export type SectionCode = "A"|"B"|"C"|"D"|"E"|"F"|"G";
export type Topic = "Data types"|"Constraints"|"Keys"|"Commands";
export interface Question { id:number;section:SectionCode;topic:Topic;kind:"mcq"|"blank"|"tf"|"match"|"written";points:number;prompt:string;options?:string[];code?:string }
export interface Answer { value:string;correction:string;flagged:boolean;reviewMark:number|null;reflection:string }
export interface Attempt { id:string;name:string;studentId:string;cohort:string;startedAt:number;deadline:number;submittedAt:number|null;status:"active"|"submitted";answered:number;automatic:number;written:number;pending:number }
export interface SectionScore { code:SectionCode;title:string;score:number;max:number;pending:number }
export interface Report { automatic:number;written:number;pending:number;total:number|null;percentage:number|null;grade:string|null;passed:boolean|null;answered:number;sections:SectionScore[];topics:{topic:Topic;score:number;max:number;pending:number}[] }
export interface Feedback { correct:boolean|null;mark:number|null;model:string;explanation:string;rubric:string[] }
export interface ExamPayload { attempt:Attempt;questions:Question[];answers:Record<string,Answer>;report:Report|null;feedback:Record<string,Feedback>|null;serverNow:number }
export const SECTION_DEFINITIONS = [{"code":"A","title":"Multiple choice","range":"01-20","count":20,"marks":20,"description":"Choose the best answer."},{"code":"B","title":"Fill in the blanks","range":"21-30","count":10,"marks":10,"description":"Write the missing SQL term."},{"code":"C","title":"True or false","range":"31-40","count":10,"marks":10,"description":"Choose TRUE or FALSE. Practise correcting false statements; corrections are not scored."},{"code":"D","title":"Match the following","range":"41-50","count":10,"marks":10,"description":"Match each concept to its meaning."},{"code":"E","title":"Identify the problem","range":"51-55","count":5,"marks":20,"description":"Explain the problem and a better design."},{"code":"F","title":"Command decisions","range":"56-60","count":5,"marks":15,"description":"Choose a command and explain why."},{"code":"G","title":"Data type design","range":"61-65","count":5,"marks":15,"description":"Design fields for a quick-commerce application."}] as const;
export const REFLECTIONS:Record<string,string>={A:"I did not know the concept",B:"I knew the concept but chose the wrong data type",C:"I misunderstood the business requirement",D:"I made a syntax mistake",E:"I got the answer but cannot explain why"};
export const SYLLABUS = [
{title:"Data types",body:"Integer types, DECIMAL, FLOAT, DOUBLE, BIT, CHAR, VARCHAR, TEXT, BLOB, BINARY, VARBINARY, ENUM, SET, DATE, TIME, DATETIME, TIMESTAMP, YEAR, JSON"},
{title:"Constraints",body:"PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, DEFAULT, CHECK"},
{title:"Keys",body:"Primary, foreign, candidate, alternate, super, composite, unique"},
{title:"SQL commands",body:"CREATE, ALTER, DROP, TRUNCATE, RENAME, INSERT, UPDATE, DELETE, SELECT, USE, SHOW, DESCRIBE, GRANT, REVOKE, COMMIT, ROLLBACK, SAVEPOINT"}];
export function answeredCount(answers:Record<string,Answer>){return Object.values(answers).filter(a=>a.value.trim()).length}
