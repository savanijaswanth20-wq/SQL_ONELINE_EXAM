import {createFileRoute} from "@tanstack/react-router";
import {useCallback,useEffect,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Flag,Check,Clock,PaperPlaneTilt,Exam as ExamIcon,FloppyDisk} from "@phosphor-icons/react";
import {Shell,ErrorBox,Loading,useQueryId} from "@/components/exam-shell";
import {api,attemptUrl} from "@/lib/exam-client";
import {SECTION_DEFINITIONS,answeredCount} from "@/lib/exam-types";
import type {Answer,Attempt,ExamPayload} from "@/lib/exam-types";
export const Route=createFileRoute("/exam")({head:()=>({meta:[{title:"Examination | MySQL Exam Studio"},{name:"robots",content:"noindex, nofollow"}],links:[{rel:"canonical",href:"https://mysql-exam-studio.higgsfield.app/exam"}]}),component:ExamPage});
const blank:Answer={value:"",correction:"",flagged:false,reviewMark:null,reflection:""};
function Confirm({answered,flagged,busy,onCancel,onSubmit}:{answered:number;flagged:number;busy:boolean;onCancel:()=>void;onSubmit:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[]);
 return <dialog ref={ref} className="submit-dialog" onCancel={e=>{e.preventDefault();onCancel()}} aria-labelledby="submit-heading"><PaperPlaneTilt size={35}/><h2 id="submit-heading">Ready to submit?</h2><p>Your answers will be locked. You can then view your score and review the answer key.</p><div className="submit-counts"><span><strong>{answered}</strong>answered</span><span><strong>{65-answered}</strong>unanswered</span><span><strong>{flagged}</strong>flagged</span></div>{65-answered>0&&<p className="small">Unanswered questions receive zero marks.</p>}<div className="dialog-actions"><button onClick={onCancel} disabled={busy}>Keep working</button><button className="confirm-submit" onClick={onSubmit} disabled={busy}>{busy?"Submitting...":"Submit exam"}</button></div></dialog>
}
function ExamPage(){
 const id=useQueryId();const [data,setData]=useState<ExamPayload|null>(null),[answers,setAnswers]=useState<Record<string,Answer>>({}),[loading,setLoading]=useState(true),[error,setError]=useState(""),[index,setIndex]=useState(0),[remaining,setRemaining]=useState(5400),[saveState,setSaveState]=useState("All changes saved"),[confirm,setConfirm]=useState(false),[submitting,setSubmitting]=useState(false);
 const pending=useRef(new Map<number,Answer>()),saving=useRef<Promise<void>|null>(null),clockOffset=useRef(0),finishing=useRef(false),questionRef=useRef<HTMLHeadingElement>(null);
 const load=useCallback(async()=>{
  if(id===null)return;setLoading(true);setError("");
  try{
   if(!id){const result=await api<{attempts:Attempt[]}>();const active=result.attempts.find(a=>a.status==="active");if(active)window.location.replace(attemptUrl(active.id,active.status));else setLoading(false);return}
   const result=await api<ExamPayload>(undefined,id);
   if(result.attempt.status==="submitted"){window.location.replace(attemptUrl(id,"submitted"));return}
   clockOffset.current=result.serverNow-Date.now();setRemaining(Math.max(0,Math.ceil((result.attempt.deadline-result.serverNow)/1000)));setData(result);setAnswers(result.answers);
  }catch(e){setError((e as Error).message)}finally{setLoading(false)}
 },[id]);
 useEffect(()=>{void load()},[load]);
 const flush=useCallback(async()=>{
  if(!data||!pending.current.size)return;if(saving.current)return saving.current;
  const task=(async()=>{
   setSaveState("Saving...");
   try{
    while(pending.current.size){
     const items=Array.from(pending.current.entries());
     const result=await api<{status?:string;attempt?:Attempt}>({action:"save",id:data.attempt.id,entries:items.map(([id,a])=>({id,value:a.value,correction:a.correction,flagged:a.flagged}))});
     if(result.attempt?.status==="submitted"){window.location.replace(attemptUrl(data.attempt.id,"submitted"));return}
     for(const [id,a] of items)if(pending.current.get(id)===a)pending.current.delete(id);
    }
    setSaveState("All changes saved");setError("");
   }catch(e){setSaveState("Not saved");setError((e as Error).message);throw e}
  })();saving.current=task;try{await task}finally{saving.current=null}
 },[data]);
 const finish=useCallback(async(expired=false)=>{
  if(!data||finishing.current)return;finishing.current=true;setSubmitting(true);setError("");
  try{if(!expired)await flush();else if(saving.current)await saving.current.catch(()=>{});const result=await api<ExamPayload>({action:"submit",id:data.attempt.id});window.location.assign(attemptUrl(result.attempt.id,"submitted"))}
  catch(e){setError((e as Error).message);setSubmitting(false);setConfirm(false);finishing.current=false}
 },[data,flush]);
 useEffect(()=>{
  if(!data)return;
  const timer=setInterval(()=>setRemaining(Math.max(0,Math.ceil((data.attempt.deadline-Date.now()-clockOffset.current)/1000))),1000);
  const saveTimer=setInterval(()=>{if(navigator.onLine)void flush().catch(()=>{})},2000);
  const online=()=>{if(Date.now()+clockOffset.current>=data.attempt.deadline)void finish(true);else void flush().catch(()=>{})};
  const before=(e:BeforeUnloadEvent)=>{if(pending.current.size||saving.current){e.preventDefault();e.returnValue=""}};
  const hide=()=>{if(!pending.current.size)return;const body=JSON.stringify({action:"save",id:data.attempt.id,entries:Array.from(pending.current,([id,a])=>({id,value:a.value,correction:a.correction,flagged:a.flagged}))});if(body.length<60000)void fetch("/api/exam",{method:"POST",headers:{"Content-Type":"application/json"},body,credentials:"same-origin",keepalive:true}).catch(()=>{})};
  window.addEventListener("online",online);window.addEventListener("beforeunload",before);window.addEventListener("pagehide",hide);
  return()=>{clearInterval(timer);clearInterval(saveTimer);window.removeEventListener("online",online);window.removeEventListener("beforeunload",before);window.removeEventListener("pagehide",hide)};
 },[data,flush,finish]);
 useEffect(()=>{if(data&&remaining===0)void finish(true)},[data,remaining,finish]);
 function patch(qid:number,change:Partial<Answer>){setAnswers(prev=>{const next={...(prev[qid]??blank),...change};pending.current.set(qid,next);return {...prev,[qid]:next}});setSaveState("Unsaved changes")}
 function go(n:number){setIndex(n);void flush().catch(()=>{});requestAnimationFrame(()=>questionRef.current?.focus())}
 const count=answeredCount(answers),flagged=Object.values(answers).filter(a=>a.flagged).length;
 const q=data?.questions[index],a=q?(answers[q.id]??blank):blank,section=q?SECTION_DEFINITIONS.find(s=>s.code===q.section):null;
 return <Shell active="exam"><main className="exam-page content-wrap">
 {loading?<Loading label="Opening your exam"/>:!data?<><ErrorBox message={error||"You have no active exam in this browser."} retry={error?()=>void load():undefined}/><div className="empty-state"><ExamIcon size={48}/><h1>A fresh page awaits.</h1><p>Enter your details to start your 65-question assessment.</p><a href="/#begin">Start an attempt <ArrowRight size={19}/></a></div></>:<>
 <div className="exam-heading"><div><p className="breadcrumb">MYSQL CORE CONCEPTS</p><h1>Make every answer count.</h1><p>{data.attempt.name}{data.attempt.studentId?" · "+data.attempt.studentId:""}</p></div><div className={"timer "+(remaining<300?"urgent":"")} role="timer" aria-label={"Time remaining "+Math.floor(remaining/60)+" minutes "+remaining%60+" seconds"}><Clock size={22}/><div><span>TIME REMAINING</span><strong>{Math.floor(remaining/60).toString().padStart(2,"0")}:{(remaining%60).toString().padStart(2,"0")}</strong></div></div></div>
 <div className="exam-rule"><span>No notes. No Google. No ChatGPT.</span><span className="save-state" aria-live="polite"><FloppyDisk size={16}/>{saveState}</span></div>
 {error&&<ErrorBox message={error} retry={()=>void (remaining===0?finish(true):flush()).catch(()=>{})}/>}
 {remaining===0&&<div className="error-box" role="status">Time is up. Submitting your saved answers. If you are offline, reconnect and retry.</div>}
 <div className="exam-workspace"><section className="question-panel" aria-label="Current question">
 <div className="question-meta"><span>Section {section?.code} <span className="meta-separator">/</span> {section?.title}</span><span className="mono">{q?.points} {q?.points===1?"mark":"marks"}</span></div>
 <div className="question-progress"><span style={{width:((index+1)/65*100)+"%"}}/></div>
 <div className="question-body"><span className="question-number">QUESTION {String(q?.id).padStart(2,"0")} / 65</span><h2 ref={questionRef} tabIndex={-1}>{q?.prompt}</h2><p id="question-guidance" className="question-guidance">{section?.description}</p>{q?.code&&<pre className="sql-code"><code>{q.code}</code></pre>}
 <fieldset className="answer-fieldset" disabled={remaining===0||submitting}><legend className="sr-only">Your answer to question {q?.id}</legend>
 {(q?.kind==="mcq"||q?.kind==="tf")&&<div className="options">{q.options?.map((text,i)=>{const key=q.kind==="tf"?text:String.fromCharCode(65+i);return <label className={"option "+(a.value===key?"selected":"")} key={key}><input type="radio" name={"q"+q.id} value={key} checked={a.value===key} onChange={()=>patch(q.id,{value:key})}/><span className="option-letter">{q.kind==="tf"?(i===0?"T":"F"):key}</span><span>{text}</span><Check className="option-check" size={19}/></label>})}</div>}
 {q?.kind==="blank"&&<><label htmlFor="blank-answer">Your answer</label><input className="blank-input" id="blank-answer" value={a.value} onChange={e=>patch(q.id,{value:e.target.value})} maxLength={150} autoComplete="off" autoCorrect="off" spellCheck={false} placeholder="Type the missing SQL term" aria-describedby="question-guidance"/></>}
 {q?.kind==="match"&&<><label htmlFor="match-answer">Choose the matching definition</label><select id="match-answer" value={a.value} onChange={e=>patch(q.id,{value:e.target.value})}><option value="">Select a match</option>{q.options?.map((text,i)=><option key={text} value={String.fromCharCode(65+i)}>{String.fromCharCode(65+i)}. {text}</option>)}</select></>}
 {q?.kind==="tf"&&a.value==="FALSE"&&<div className="correction-field"><label htmlFor="correction">Correct the statement <small>practice, not scored</small></label><textarea id="correction" rows={3} maxLength={2000} value={a.correction} onChange={e=>patch(q.id,{correction:e.target.value})} placeholder="Explain what the correct statement should say."/></div>}
 {q?.kind==="written"&&<><label htmlFor="written-answer">Your answer and reasoning</label><textarea id="written-answer" className="written-input" rows={9} maxLength={4000} value={a.value} onChange={e=>patch(q.id,{value:e.target.value})} spellCheck={false} placeholder="Write your SQL, data type, or explanation here."/><div className="writing-footer"><span>Write the answer and explain WHY.</span><span className="mono">{a.value.length} / 4000</span></div><p className="small muted">Written answers are reviewed using a marking guide after submission. SQL entered here is not executed.</p></>}
 </fieldset></div>
 <div className="question-tools"><button onClick={()=>q&&patch(q.id,{value:"",correction:""})} disabled={!a.value||remaining===0}>Clear answer</button><button className={a.flagged?"flagged":""} aria-pressed={a.flagged} disabled={remaining===0} onClick={()=>q&&patch(q.id,{flagged:!a.flagged})}><Flag size={18} weight={a.flagged?"fill":"regular"}/>{a.flagged?"Marked for review":"Mark for review"}</button></div>
 <div className="question-navigation"><button className="previous-question" onClick={()=>go(index-1)} disabled={index===0}><ArrowLeft size={19}/>Previous</button><span className="mono">{count}/65 answered</span>{index<64?<button className="next-question" onClick={()=>go(index+1)}>Next question<ArrowRight size={19}/></button>:<button className="next-question" onClick={()=>setConfirm(true)}>Finish exam<Check size={19}/></button>}</div>
 </section>
 <aside className="question-rail"><div className="rail-heading"><h3>Your questions</h3><span>{count} / 65</span></div><div className="progress-meter"><span style={{width:count/65*100+"%"}}/></div>
 <div className="question-legend"><span><i className="legend-answer"/>Answered</span><span><i className="legend-flag"/>Review</span><span><i/>Unanswered</span></div>
 {SECTION_DEFINITIONS.map(s=><div className="nav-section" key={s.code}><button className="section-jump" onClick={()=>go(data.questions.findIndex(q=>q.section===s.code))}><strong>{s.code}</strong>{s.title}<small>{data.questions.filter(q=>q.section===s.code&&answers[q.id]?.value.trim()).length}/{s.count}</small></button><div className="question-grid">{data.questions.filter(q=>q.section===s.code).map(question=><button key={question.id} className={[answers[question.id]?.value.trim()?"answered":"",answers[question.id]?.flagged?"has-flag":"",q?.id===question.id?"active-question":""].join(" ")} onClick={()=>go(question.id-1)} aria-current={q?.id===question.id?"step":undefined} aria-label={"Question "+question.id+(answers[question.id]?.value.trim()?", answered":", unanswered")+(answers[question.id]?.flagged?", marked for review":"")}>{question.id}</button>)}</div></div>)}
 <button className="submit-exam" onClick={()=>remaining===0?void finish(true):setConfirm(true)} disabled={submitting}><PaperPlaneTilt size={18}/>{submitting?"Submitting...":"Submit exam"}</button><p className="small muted rail-note">You can move between sections. Submit when you are ready.</p>
 </aside></div>
 {confirm&&<Confirm answered={count} flagged={flagged} busy={submitting} onCancel={()=>setConfirm(false)} onSubmit={()=>void finish()}/>}
 </>}
 </main></Shell>
}
