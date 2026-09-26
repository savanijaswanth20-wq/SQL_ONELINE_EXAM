import {test,expect,mock} from "bun:test";
import {Database} from "bun:sqlite";
import {readFileSync} from "node:fs";
import {BANK} from "../src/lib/question-bank.server";
import {calculateReport,gradeObjective} from "../src/lib/scoring.server";
const sqlite=new Database(":memory:");sqlite.exec(readFileSync("migrations/0001_mysql_exam.sql","utf8"));
class Statement{
 constructor(public sql:string,public values:any[]=[]){}
 bind(...values:any[]){return new Statement(this.sql,values)}
 async first<T>(){return (sqlite.query(this.sql).get(...this.values)??null) as T|null}
 async all<T>(){return {results:sqlite.query(this.sql).all(...this.values) as T[],success:true}}
 async run(){return {success:true,meta:sqlite.query(this.sql).run(...this.values)}}
}
const db={prepare:(sql:string)=>new Statement(sql),batch:async(statements:Statement[])=>Promise.all(statements.map(s=>s.run()))};
mock.module("../src/lib/bindings.server",()=>({bindings:()=>({DB:db})}));
const {handleExam}=await import("../src/lib/exam.server");
const origin="https://mysql-exam-studio.higgsfield.app";
async function post(body:any,cookie="",foreign=false){return handleExam(new Request(origin+"/api/exam",{method:"POST",headers:{"Content-Type":"application/json",Origin:foreign?"https://unrelated.example":origin,Cookie:cookie},body:JSON.stringify(body)}))}
async function get(id="",cookie=""){return handleExam(new Request(origin+"/api/exam"+(id?"?id="+id:""),{headers:{Cookie:cookie}}))}
async function start(name="Test learner"){const res=await post({action:"start",name,accepted:true});expect(res.status).toBe(201);return {data:await res.json(),cookie:res.headers.get("set-cookie")!.split(";")[0]}}
test("65 questions and exact 100-mark blueprint",()=>{
 expect(BANK.length).toBe(65);expect(new Set(BANK.map(q=>q.id)).size).toBe(65);
 expect(BANK.reduce((n,q)=>n+q.points,0)).toBe(100);
 expect(BANK.filter(q=>q.kind!=="written").reduce((n,q)=>n+q.points,0)).toBe(50);
 expect(BANK.find(q=>q.id===54)!.explanation).toContain("WHERE created_at >= CURDATE()");
});
test("Grading accepts valid terms and keeps incomplete grades pending",()=>{
 expect(gradeObjective(21," numeric; ")).toBe(true);expect(gradeObjective(25,"not     null")).toBe(true);expect(gradeObjective(27," ALTER TABLE ")).toBe(true);expect(gradeObjective(21,"FLOAT")).toBe(false);
 const answers:any={};for(const q of BANK)answers[q.id]={value:Array.isArray(q.answer)?q.answer[0]:q.answer,reviewMark:null,correction:"",flagged:false,reflection:""};
 const {report}=calculateReport(answers);expect(report.automatic).toBe(50);expect(report.pending).toBe(15);expect(report.total).toBeNull();expect(report.grade).toBeNull();
 for(const q of BANK)if(q.kind==="written")answers[q.id].reviewMark=q.points;
 const finished=calculateReport(answers).report;expect(finished.total).toBe(100);expect(finished.grade).toBe("A+");expect(finished.sections.reduce((n,s)=>n+s.score,0)).toBe(100);expect(finished.topics.reduce((n,s)=>n+s.max,0)).toBe(100);expect(calculateReport({}).report.total).toBe(0);
});
test("Private session, save, submit, review and PDF work together",async()=>{
 const first=await start();const {id}=first.data.attempt;
 expect(first.cookie).toMatch(/^mysql_exam_session=[a-f0-9]{64}$/);expect(first.data.questions.length).toBe(65);expect(first.data.feedback).toBeNull();expect(first.data.report).toBeNull();
 for(const q of first.data.questions){expect(q.answer).toBeUndefined();expect(q.explanation).toBeUndefined()}
 const second=await start("Different learner");expect((await get(id,second.cookie)).status).toBe(404);expect((await get(id)).status).toBe(401);
 const saved=await post({action:"save",id,entries:[{id:1,value:"B",correction:"",flagged:true},{id:21,value:"numeric",correction:"",flagged:false},{id:54,value:"DELETE FROM orders WHERE DATE(created_at) = CURDATE(); DROP removes the table.",correction:"",flagged:true}]},first.cookie);expect(saved.status).toBe(200);
 const resumed=await (await get(id,first.cookie)).json();expect(resumed.answers[1].value).toBe("B");expect(resumed.answers[1].flagged).toBe(true);expect(resumed.attempt.answered).toBe(3);
 const submitted=await (await post({action:"submit",id},first.cookie)).json();expect(submitted.attempt.status).toBe("submitted");expect(submitted.report.automatic).toBe(2);expect(submitted.report.pending).toBe(1);expect(submitted.report.total).toBeNull();expect(submitted.feedback[54].model).toContain("DELETE FROM orders");
 await post({action:"save",id,entries:[{id:1,value:"A",correction:"",flagged:false}]},first.cookie);const locked=await(await get(id,first.cookie)).json();expect(locked.answers[1].value).toBe("B");
 expect((await post({action:"review",id,marks:[{id:56,mark:4}]},first.cookie)).status).toBe(400);
 const reviewed=await(await post({action:"review",id,marks:[{id:54,mark:4}]},first.cookie)).json();expect(reviewed.report.total).toBe(6);expect(reviewed.report.pending).toBe(0);
 const reflected=await(await post({action:"reflect",id,qid:54,reason:"C"},first.cookie)).json();expect(reflected.answers[54].reflection).toBe("C");
 const {buildReportPdf}=await import("../src/lib/report-pdf");const pdf=await buildReportPdf(reflected);expect(pdf.getNumberOfPages()).toBe(1);expect(pdf.output("arraybuffer").byteLength).toBeGreaterThan(5000);
});
test("Deadline locks saved answers",async()=>{
 const {data,cookie}=await start("Expiry learner");const id=data.attempt.id;await post({action:"save",id,entries:[{id:2,value:"C",correction:"",flagged:false}]},cookie);
 sqlite.query("UPDATE exam_attempts SET deadline=? WHERE id=?").run(Date.now()-1000,id);
 const expired=await(await post({action:"save",id,entries:[{id:2,value:"A",correction:"",flagged:false}]},cookie)).json();expect(expired.attempt.status).toBe("submitted");expect(expired.answers[2].value).toBe("C");expect(expired.report.automatic).toBe(1);
});
test("CSRF, malformed input and premature review are rejected",async()=>{
 expect((await post({action:"start",name:"CSRF",accepted:true},"",true)).status).toBe(403);expect((await post({action:"start",name:"",accepted:true})).status).toBe(400);
 const {data,cookie}=await start("Validation learner");expect((await post({action:"review",id:data.attempt.id,marks:[{id:51,mark:4}]},cookie)).status).toBe(409);
 expect((await post({action:"start",name:"x".repeat(225000),accepted:true})).status).toBe(413);
 const resumed=await(await post({action:"start",name:"Again",accepted:true},cookie)).json();expect(resumed.attempt.id).toBe(data.attempt.id);
});

