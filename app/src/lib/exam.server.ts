import {z} from "zod";
import {bindings} from "./bindings.server";
import {BANK} from "./question-bank.server";
import {calculateReport} from "./scoring.server";
import type {Answer,Attempt,ExamPayload} from "./exam-types";
type Row={id:string;owner:string;name:string;student_id:string;cohort:string;started_at:number;deadline:number;submitted_at:number|null;status:"active"|"submitted"};
class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
const uuid=z.string().uuid();
const entry=z.object({id:z.number().int().min(1).max(65),value:z.string().max(4000),correction:z.string().max(2000),flagged:z.boolean()});
const bodySchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("start"),name:z.string().trim().min(2).max(80),studentId:z.string().trim().max(40).default(""),cohort:z.string().trim().max(80).default(""),accepted:z.literal(true)}),
 z.object({action:z.literal("save"),id:uuid,entries:z.array(entry).max(65)}),
 z.object({action:z.literal("submit"),id:uuid}),
 z.object({action:z.literal("review"),id:uuid,marks:z.array(z.object({id:z.number().int().min(51).max(65),mark:z.number().int().min(0).max(4)})).min(1).max(15)}),
 z.object({action:z.literal("reflect"),id:uuid,qid:z.number().int().min(1).max(65),reason:z.enum(["","A","B","C","D","E"])})
]);
function database(){const db=bindings().DB;if(!db)throw new HttpError(503,"The exam service is not ready yet. Please try again shortly.");return db}
async function digest(value:string){const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("")}
function tokenFrom(request:Request){const token=(request.headers.get("cookie")??"").split(";").map(s=>s.trim()).find(s=>s.startsWith("mysql_exam_session="))?.split("=")[1];return token&&/^[a-f0-9]{64}$/.test(token)?token:null}
function freshToken(){const bytes=crypto.getRandomValues(new Uint8Array(32));return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}
function json(data:unknown,status=200,cookie?:string){const h=new Headers({"Content-Type":"application/json","Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"});if(cookie)h.set("Set-Cookie","mysql_exam_session="+cookie+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=15552000");return new Response(JSON.stringify(data),{status,headers:h})}
async function readBody(request:Request){
 const max=220000; if(Number(request.headers.get("content-length")??0)>max)throw new HttpError(413,"Request too large.");
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,"Missing request.");
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>max){await reader.cancel();throw new HttpError(413,"Request too large.")}chunks.push(r.value)}
 const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length}
 try{return bodySchema.parse(JSON.parse(new TextDecoder().decode(all)))}catch{throw new HttpError(400,"Please check your input and try again.")}
}
async function owned(id:string,owner:string):Promise<Row>{
 const row=await database().prepare("SELECT * FROM exam_attempts WHERE id=? AND owner=?").bind(id,owner).first<Row>();
 if(!row)throw new HttpError(404,"This attempt is not available in this browser.");
 if(row.status==="active"&&Date.now()>=row.deadline){
  await database().prepare("UPDATE exam_attempts SET status='submitted', submitted_at=deadline WHERE id=? AND owner=? AND status='active'").bind(id,owner).run();
  row.status="submitted";row.submitted_at=row.deadline;
 }
 return row;
}
async function answersFor(id:string){
 const result=await database().prepare("SELECT question_id,value,correction,flagged,review_mark,reflection FROM exam_answers WHERE attempt_id=?").bind(id).all<{question_id:number;value:string;correction:string;flagged:number;review_mark:number|null;reflection:string}>();
 const answers:Record<string,Answer>={};for(const a of result.results??[])answers[a.question_id]={value:a.value,correction:a.correction,flagged:Boolean(a.flagged),reviewMark:a.review_mark,reflection:a.reflection};
 return answers;
}
function summary(row:Row,answers:Record<string,Answer>):Attempt{const {report}=calculateReport(answers);return {id:row.id,name:row.name,studentId:row.student_id,cohort:row.cohort,startedAt:row.started_at,deadline:row.deadline,submittedAt:row.submitted_at,status:row.status,answered:report.answered,automatic:row.status==="submitted"?report.automatic:0,written:row.status==="submitted"?report.written:0,pending:row.status==="submitted"?report.pending:15}}
async function payload(row:Row):Promise<ExamPayload>{
 const answers=await answersFor(row.id);const graded=row.status==="submitted"?calculateReport(answers):null;
 return {attempt:summary(row,answers),questions:BANK.map(({answer,explanation,rubric,...q})=>q),answers,report:graded?.report??null,feedback:graded?.feedback??null,serverNow:Date.now()};
}
export async function handleExam(request:Request):Promise<Response>{
 try{
 const url=new URL(request.url);let token=tokenFrom(request);let owner=token?await digest(token):null;
 if(request.method==="GET"){
  if(!owner){if(url.searchParams.has("id"))throw new HttpError(401,"Open this attempt in the browser where you started it.");return json({attempts:[]})}
  const id=url.searchParams.get("id");
  if(id){if(!uuid.safeParse(id).success)throw new HttpError(400,"Invalid attempt.");return json(await payload(await owned(id,owner)))}
  const now=Date.now();await database().prepare("UPDATE exam_attempts SET status='submitted',submitted_at=deadline WHERE owner=? AND status='active' AND deadline<=?").bind(owner,now).run();
  const rows=await database().prepare("SELECT * FROM exam_attempts WHERE owner=? ORDER BY started_at DESC LIMIT 30").bind(owner).all<Row>();
  const attempts=await Promise.all((rows.results??[]).map(async r=>summary(r,await answersFor(r.id))));
  return json({attempts});
 }
 if(request.method!=="POST")throw new HttpError(405,"Method not allowed.");
 const origin=request.headers.get("origin");if(origin!==url.origin)throw new HttpError(403,"Please open the exam directly and try again.");
 if(!request.headers.get("content-type")?.includes("application/json"))throw new HttpError(415,"JSON required.");
 const data=await readBody(request);
 if(data.action==="start"){
  if(!token){token=freshToken();owner=await digest(token)}
  const db=database();const now=Date.now();
  const active=await db.prepare("SELECT * FROM exam_attempts WHERE owner=? AND status='active' AND deadline>? ORDER BY started_at DESC LIMIT 1").bind(owner,now).first<Row>();
  if(active)return json(await payload(active),200,token!);
  const day=Math.floor(now/86400000);const limitKey=await digest((request.headers.get("cf-connecting-ip")??owner!)+":"+day);
  const quota=await db.prepare("INSERT INTO exam_start_limits (key,count) VALUES (?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<50 RETURNING count").bind(limitKey).first<{count:number}>();
  if(!quota)throw new HttpError(429,"The daily attempt limit has been reached. Please try again tomorrow.");
  const id=crypto.randomUUID();await db.prepare("INSERT INTO exam_attempts (id,owner,name,student_id,cohort,started_at,deadline) VALUES (?,?,?,?,?,?,?)").bind(id,owner,data.name,data.studentId,data.cohort,now,now+5400000).run();
  return json(await payload(await owned(id,owner!)),201,token!);
 }
 if(!owner)throw new HttpError(401,"Your browser session is missing. Return to the dashboard.");
 let row=await owned(data.id,owner);const db=database();
 if(data.action==="save"){
  if(row.status!=="active")return json(await payload(row));
  const now=Date.now();
  if(data.entries.length)await db.batch(data.entries.map(e=>db.prepare("INSERT INTO exam_answers (attempt_id,question_id,value,correction,flagged,updated_at) SELECT ?,?,?,?,?,? FROM exam_attempts WHERE id=? AND owner=? AND status='active' AND deadline>? ON CONFLICT(attempt_id,question_id) DO UPDATE SET value=excluded.value,correction=excluded.correction,flagged=excluded.flagged,updated_at=excluded.updated_at").bind(row.id,e.id,e.value,e.correction,e.flagged?1:0,now,row.id,owner,now)));
  return json({saved:true,serverNow:Date.now(),status:"active"});
 }
 if(data.action==="submit"){
  await db.prepare("UPDATE exam_attempts SET status='submitted', submitted_at=MIN(?,deadline) WHERE id=? AND owner=? AND status='active'").bind(Date.now(),row.id,owner).run();
  row=await owned(row.id,owner);return json(await payload(row));
 }
 if(row.status!=="submitted")throw new HttpError(409,"Submit the exam before reviewing answers.");
 if(data.action==="review"){
  const answers=await answersFor(row.id);
  for(const m of data.marks){const q=BANK.find(q=>q.id===m.id)!;if(m.mark>q.points||(!answers[m.id]?.value.trim()&&m.mark!==0))throw new HttpError(400,"A review mark is outside the allowed range.")}
  await db.batch(data.marks.map(m=>db.prepare("UPDATE exam_answers SET review_mark=? WHERE attempt_id=? AND question_id=?").bind(m.mark,row.id,m.id)));
 }
 if(data.action==="reflect"){
  await db.prepare("INSERT INTO exam_answers (attempt_id,question_id,value,correction,flagged,reflection,updated_at) VALUES (?,?,'','',0,?,?) ON CONFLICT(attempt_id,question_id) DO UPDATE SET reflection=excluded.reflection").bind(row.id,data.qid,data.reason,Date.now()).run();
 }
 return json(await payload(await owned(row.id,owner)));
 }catch(error){if(error instanceof HttpError)return json({error:error.message},error.status);return json({error:"The exam service could not complete that request. Your saved answers are retained. Please retry."},500)}
}
