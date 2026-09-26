import { BANK } from "./question-bank.server";
import { SECTION_DEFINITIONS } from "./exam-types";
import type {Answer,Feedback,Report,Topic} from "./exam-types";
export function normalize(v:string){return v.trim().replace(/[;.]/g,"").replaceAll(String.fromCharCode(96),"").replace(/\s+/g," ").toUpperCase()}
export function gradeObjective(id:number,value:string):boolean {
 const q=BANK.find(q=>q.id===id); if(!q||q.kind==="written"||!value.trim())return false;
 const expected=Array.isArray(q.answer)?q.answer:[q.answer];
 return expected.some(v=>normalize(v)===normalize(value));
}
export function calculateReport(answers:Record<string,Answer>):{report:Report;feedback:Record<string,Feedback>} {
 let automatic=0,written=0,pending=0,answered=0;
 const feedback:Record<string,Feedback>={};
 const sections=SECTION_DEFINITIONS.map(s=>({code:s.code,title:s.title,score:0,max:s.marks,pending:0}));
 const topics=(["Data types","Constraints","Keys","Commands"] as Topic[]).map(topic=>({topic,score:0,max:0,pending:0}));
 for(const q of BANK){
  const a=answers[q.id]; const has=Boolean(a?.value.trim()); if(has)answered++;
  const correct=q.kind==="written"?null:gradeObjective(q.id,a?.value??"");
  const mark=q.kind==="written"?(has?(a?.reviewMark??null):0):(correct?q.points:0);
  if(q.kind==="written"){if(mark===null)pending++;else written+=mark}else automatic+=mark??0;
  const section=sections.find(s=>s.code===q.section)!;const topic=topics.find(t=>t.topic===q.topic)!;
  section.score+=mark??0;topic.score+=mark??0;topic.max+=q.points;
  if(mark===null){section.pending++;topic.pending++}
  const model=Array.isArray(q.answer)?q.answer[0]:q.answer;
  const readable=(q.kind==="mcq"||q.kind==="match")?model+". "+q.options![model.charCodeAt(0)-65]:model;
  feedback[q.id]={correct,mark,model:readable,explanation:q.explanation,rubric:q.rubric??[]};
 }
 const total=pending?null:automatic+written;
 const grade=total===null?null:total>=90?"A+":total>=80?"A":total>=70?"B":total>=60?"C":total>=50?"D":"Needs practice";
 return {report:{automatic,written,pending,total,percentage:total,grade,passed:total===null?null:total>=50,answered,sections,topics},feedback};
}
