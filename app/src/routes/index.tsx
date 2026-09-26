import {createFileRoute} from "@tanstack/react-router";
import {useEffect,useState} from "react";
import {ArrowRight,Clock,FileText,CheckCircle,LockKey,ArrowUpRight,CodeBlock,Key,Table as TableIcon,BracketsCurly} from "@phosphor-icons/react";
import {Shell,ErrorBox} from "@/components/exam-shell";
import {api,attemptUrl,dateLabel} from "@/lib/exam-client";
import {SECTION_DEFINITIONS,SYLLABUS} from "@/lib/exam-types";
import type {Attempt,ExamPayload} from "@/lib/exam-types";
import {useAuth} from "@/lib/auth-context";
export const Route=createFileRoute("/")({head:()=>({links:[{rel:"canonical",href:"https://mysql-exam-studio.higgsfield.app"}]}),component:Dashboard});
function Dashboard(){
 const {user,profile}=useAuth();
 const [attempts,setAttempts]=useState<Attempt[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const [name,setName]=useState(""),[studentId,setStudentId]=useState(""),[cohort,setCohort]=useState(""),[accepted,setAccepted]=useState(false);
 useEffect(()=>{
  if(profile?.full_name&&!name){setName(profile.full_name)}
  else if(user?.user_metadata?.full_name&&!name){setName(user.user_metadata.full_name)}
 },[profile,user]);
 async function history(){setLoading(true);try{const data=await api<{attempts:Attempt[]}>();setAttempts(data.attempts);setError("")}catch(e){setError((e as Error).message)}finally{setLoading(false)}}
 useEffect(()=>{void history()},[]);
 const active=attempts.find(a=>a.status==="active");const finished=attempts.filter(a=>a.status==="submitted");
 const best=finished.filter(a=>!a.pending).reduce<number|null>((best,a)=>Math.max(best??0,a.automatic+a.written),null);
 async function start(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{const data=await api<ExamPayload>({action:"start",name,studentId,cohort,accepted});window.location.assign(attemptUrl(data.attempt.id,data.attempt.status))}catch(e){setError((e as Error).message);setBusy(false)}}
 const icons=[<BracketsCurly size={24}/>,<LockKey size={24}/>,<Key size={24}/>,<CodeBlock size={24}/>];
 return <Shell active="overview"><main className="dashboard content-wrap">
 <section className="welcome"><div className="welcome-copy"><span className="eyebrow">THE MYSQL ASSESSMENT</span><h1>Know it.<br/><span>Prove it.</span></h1><p>Put your core concepts to the test.<br/>Leave with a clear picture of your progress.</p><a className="enter-ticket" href={active?attemptUrl(active.id,active.status):"#begin"}>{active?"Continue attempt":"Take the exam"}<ArrowRight size={21}/></a></div>
 <div className="exam-facts"><span className="facts-caption">YOUR NEXT CHALLENGE</span><div className="big-number">65<span>questions</span></div><div className="facts-bottom"><span><Clock size={17}/>90 minutes</span><span><FileText size={17}/>100 marks</span></div><div className="facts-rule"/><p>Data types. Constraints.<br/>Keys. SQL commands.</p></div></section>
 <section className="stats-strip" aria-label="Your progress"><div><span>YOUR ATTEMPTS</span><strong>{loading?"...":attempts.length.toString().padStart(2,"0")}</strong></div><div><span>COMPLETED</span><strong>{loading?"...":finished.length.toString().padStart(2,"0")}</strong></div><div><span>BEST REVIEWED SCORE</span><strong>{best===null?"Not yet":best+"%"}<small>{best===null?"Finish your first exam":"Including self-reviewed marks"}</small></strong></div><a href="/reports">View report cards <ArrowUpRight size={21}/></a></section>
 {error&&<ErrorBox message={error} retry={()=>void history()}/>}
 {active&&<div className="resume-banner"><div><strong>An exam is in progress</strong><p>{active.answered} of 65 answered. Your original deadline still applies.</p></div><a href={attemptUrl(active.id,active.status)}>Continue attempt <ArrowRight size={18}/></a></div>}
 <section className="syllabus-section"><div className="section-heading"><h2>Four foundations. One assessment.</h2><p>A practical check of the concepts behind reliable databases.</p></div><div className="syllabus-grid">{SYLLABUS.map((topic,i)=><details className="topic" key={topic.title}><summary>{icons[i]}<span>{topic.title}</span><span className="expand">+</span></summary><p>{topic.body}</p></details>)}</div></section>
 <section className="assessment-layout"><div className="section-outline"><h2>From recall to real decisions.</h2><p className="muted">Seven sections, with more room to explain as you go.</p><div className="outline-table">{SECTION_DEFINITIONS.map(s=><div className="outline-row" key={s.code}><span className="section-letter">{s.code}</span><div><strong>{s.title}</strong><small>Questions {s.range}</small></div><span className="mono">{s.marks}<small>marks</small></span></div>)}</div><p className="small muted">Sections A-D: 50 automatically scored marks.<br/>Sections E-G: 50 marks reviewed against a written rubric.</p></div>
 <div className="start-panel" id="begin"><span className="panel-kicker"><CheckCircle size={18}/> READY WHEN YOU ARE</span><h2>Make it your attempt.</h2><p className="muted">Your details will appear on your report card.</p><form onSubmit={start}><label htmlFor="name">Name on report <span aria-hidden="true">*</span></label><input id="name" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" placeholder="Enter your full name"/><div className="form-pair"><div><label htmlFor="student-id">Student ID <small>optional</small></label><input id="student-id" value={studentId} onChange={e=>setStudentId(e.target.value)} maxLength={40} placeholder="Roll or employee ID"/></div><div><label htmlFor="cohort">Class / batch <small>optional</small></label><input id="cohort" value={cohort} onChange={e=>setCohort(e.target.value)} maxLength={80} placeholder="Your class or batch"/></div></div>
 <div className="rules-box"><LockKey size={20}/><div><strong>No notes. No Google. No ChatGPT.</strong><p>Work independently. Answers appear only after submission. This is an honour-based practice exam.</p></div></div>
 <label className="check-row"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} required/><span>I agree to the exam rules and the 90-minute time limit.</span></label>
 <button className="start-exam" disabled={busy||!accepted}>{busy?"Starting...":"Start exam"}<ArrowRight size={20}/></button>
 <p className="form-footnote">No negative marking. Timer continues when you leave. Pass mark: 50/100 after all written answers are reviewed.</p></form></div></section>
 {finished.length>0&&<section className="recent"><h2>Pick up your progress.</h2>{finished.slice(0,3).map(a=><a href={attemptUrl(a.id,a.status)} className="history-row" key={a.id}><FileText size={23}/><div><strong>{a.name}</strong><small>{dateLabel(a.startedAt)}</small></div><span>{a.pending?"Review pending":a.automatic+a.written+" / 100"}</span><ArrowUpRight size={19}/></a>)}</section>}
 <div className="privacy-note"><LockKey size={17}/><p>Attempts are private to this browser session. Clearing cookies removes access. Download your report cards to keep a copy. No account is required.</p></div>
 </main></Shell>
}
