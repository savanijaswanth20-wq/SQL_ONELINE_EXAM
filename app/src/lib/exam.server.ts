import { z } from "zod";
import { bindings } from "./bindings.server";
import { BANK } from "./question-bank.server";
import { calculateReport } from "./scoring.server";
import type { Answer, Attempt, ExamPayload } from "./exam-types";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./supabase";

type Row = {
  id: string;
  owner: string;
  name: string;
  student_id: string;
  cohort: string;
  started_at: number;
  deadline: number;
  submitted_at: number | null;
  status: "active" | "submitted";
};

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const uuid = z.string().uuid();
const entry = z.object({
  id: z.number().int().min(1).max(65),
  value: z.string().max(4000),
  correction: z.string().max(2000),
  flagged: z.boolean(),
});

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    name: z.string().trim().min(2).max(80),
    studentId: z.string().trim().max(40).default(""),
    cohort: z.string().trim().max(80).default(""),
    accepted: z.literal(true),
  }),
  z.object({ action: z.literal("save"), id: uuid, entries: z.array(entry).max(65) }),
  z.object({ action: z.literal("submit"), id: uuid }),
  z.object({
    action: z.literal("review"),
    id: uuid,
    marks: z.array(
      z.object({
        id: z.number().int().min(51).max(65),
        mark: z.number().int().min(0).max(4),
      })
    ).min(1).max(15),
  }),
  z.object({
    action: z.literal("reflect"),
    id: uuid,
    qid: z.number().int().min(1).max(65),
    reason: z.enum(["", "A", "B", "C", "D", "E"]),
  }),
]);

type MemAttemptRow = {
  id: string;
  owner: string;
  name: string;
  student_id: string;
  cohort: string;
  started_at: number;
  deadline: number;
  submitted_at: number | null;
  status: "active" | "submitted";
  version: number;
};

type MemAnswerRow = {
  attempt_id: string;
  question_id: number;
  value: string;
  correction: string;
  flagged: number;
  review_mark: number | null;
  reflection: string;
  updated_at: number;
};

const memAttempts = new Map<string, MemAttemptRow>();
const memAnswers = new Map<string, MemAnswerRow>();
const memLimits = new Map<string, number>();

class MemoryStatement {
  constructor(private sql: string, private values: unknown[] = []) {}

  bind(...values: unknown[]) {
    return new MemoryStatement(this.sql, values);
  }

  async first<T>(): Promise<T | null> {
    const res = await this.all<T>();
    return res.results[0] ?? null;
  }

  async run() {
    await this.all();
    return { success: true };
  }

  async all<T>(): Promise<{ results: T[]; success: boolean }> {
    const sql = this.sql;
    const vals = this.values;

    if (sql.includes("SELECT * FROM exam_attempts WHERE id=? AND owner=?")) {
      const [id, owner] = vals as [string, string];
      const row = memAttempts.get(id);
      if (row && row.owner === owner) {
        return { results: [{ ...row }] as unknown as T[], success: true };
      }
      return { results: [], success: true };
    }

    if (
      sql.includes(
        "UPDATE exam_attempts SET status='submitted', submitted_at=deadline WHERE id=? AND owner=? AND status='active'"
      )
    ) {
      const [id, owner] = vals as [string, string];
      const row = memAttempts.get(id);
      if (row && row.owner === owner && row.status === "active") {
        row.status = "submitted";
        row.submitted_at = row.deadline;
      }
      return { results: [], success: true };
    }

    if (sql.includes("FROM exam_answers WHERE attempt_id=?")) {
      const [attemptId] = vals as [string];
      const list: MemAnswerRow[] = [];
      for (const a of memAnswers.values()) {
        if (a.attempt_id === attemptId) {
          list.push({ ...a });
        }
      }
      return { results: list as unknown as T[], success: true };
    }

    if (
      sql.includes(
        "UPDATE exam_attempts SET status='submitted',submitted_at=deadline WHERE owner=? AND status='active' AND deadline<=?"
      )
    ) {
      const [owner, now] = vals as [string, number];
      for (const a of memAttempts.values()) {
        if (a.owner === owner && a.status === "active" && a.deadline <= now) {
          a.status = "submitted";
          a.submitted_at = a.deadline;
        }
      }
      return { results: [], success: true };
    }

    if (
      sql.includes(
        "SELECT * FROM exam_attempts WHERE owner=? ORDER BY started_at DESC LIMIT 30"
      )
    ) {
      const [owner] = vals as [string];
      const list: MemAttemptRow[] = [];
      for (const a of memAttempts.values()) {
        if (a.owner === owner) {
          list.push({ ...a });
        }
      }
      list.sort((x, y) => y.started_at - x.started_at);
      return { results: list.slice(0, 30) as unknown as T[], success: true };
    }

    if (
      sql.includes(
        "SELECT * FROM exam_attempts WHERE owner=? AND status='active' AND deadline>?"
      )
    ) {
      const [owner, now] = vals as [string, number];
      const list: MemAttemptRow[] = [];
      for (const a of memAttempts.values()) {
        if (a.owner === owner && a.status === "active" && a.deadline > now) {
          list.push({ ...a });
        }
      }
      list.sort((x, y) => y.started_at - x.started_at);
      return { results: (list[0] ? [list[0]] : []) as unknown as T[], success: true };
    }

    if (sql.includes("INSERT INTO exam_start_limits")) {
      const [key] = vals as [string];
      const current = memLimits.get(key) || 0;
      if (current >= 50) return { results: [], success: true };
      memLimits.set(key, current + 1);
      return { results: [{ count: current + 1 }] as unknown as T[], success: true };
    }

    if (sql.includes("INSERT INTO exam_attempts")) {
      const [id, owner, name, student_id, cohort, started_at, deadline] = vals as [
        string,
        string,
        string,
        string,
        string,
        number,
        number
      ];
      memAttempts.set(id, {
        id,
        owner,
        name,
        student_id: student_id || "",
        cohort: cohort || "",
        started_at,
        deadline,
        submitted_at: null,
        status: "active",
        version: 1,
      });
      return { results: [], success: true };
    }

    if (
      sql.includes(
        "INSERT INTO exam_answers (attempt_id,question_id,value,correction,flagged,updated_at)"
      )
    ) {
      const [
        attempt_id,
        question_id,
        value,
        correction,
        flagged,
        updated_at,
        check_id,
        check_owner,
        check_now,
      ] = vals as [
        string,
        number,
        string,
        string,
        number,
        number,
        string,
        string,
        number
      ];
      const att = memAttempts.get(check_id);
      if (
        att &&
        att.owner === check_owner &&
        att.status === "active" &&
        att.deadline > check_now
      ) {
        const key = `${attempt_id}:${question_id}`;
        const existing = memAnswers.get(key);
        memAnswers.set(key, {
          attempt_id,
          question_id,
          value,
          correction,
          flagged,
          review_mark: existing?.review_mark ?? null,
          reflection: existing?.reflection ?? "",
          updated_at,
        });
      }
      return { results: [], success: true };
    }

    if (
      sql.includes(
        "UPDATE exam_attempts SET status='submitted', submitted_at=MIN(?,deadline)"
      )
    ) {
      const [now, id, owner] = vals as [number, string, string];
      const row = memAttempts.get(id);
      if (row && row.owner === owner && row.status === "active") {
        row.status = "submitted";
        row.submitted_at = Math.min(now, row.deadline);
      }
      return { results: [], success: true };
    }

    if (
      sql.includes(
        "UPDATE exam_answers SET review_mark=? WHERE attempt_id=? AND question_id=?"
      )
    ) {
      const [mark, attempt_id, question_id] = vals as [number, string, number];
      const key = `${attempt_id}:${question_id}`;
      const existing = memAnswers.get(key);
      if (existing) {
        existing.review_mark = mark;
      }
      return { results: [], success: true };
    }

    if (sql.includes("INSERT INTO exam_answers") && sql.includes("reflection")) {
      const [attempt_id, question_id, reason, updated_at] = vals as [
        string,
        number,
        string,
        number
      ];
      const key = `${attempt_id}:${question_id}`;
      const existing = memAnswers.get(key);
      if (existing) {
        existing.reflection = reason;
        existing.updated_at = updated_at;
      } else {
        memAnswers.set(key, {
          attempt_id,
          question_id,
          value: "",
          correction: "",
          flagged: 0,
          review_mark: null,
          reflection: reason,
          updated_at,
        });
      }
      return { results: [], success: true };
    }

    return { results: [], success: true };
  }
}

interface DbPreparedStatement {
  bind(...values: unknown[]): DbPreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<{ success: boolean }>;
}

interface DbClient {
  prepare(sql: string): DbPreparedStatement;
  batch(statements: unknown[]): Promise<unknown[]>;
}

const memoryDb: DbClient = {
  prepare: (sql: string) => new MemoryStatement(sql),
  batch: async (statements: unknown[]) =>
    Promise.all((statements as MemoryStatement[]).map((s) => s.run())),
};

function database(): DbClient {
  const db = bindings().DB;
  if (!db) {
    return memoryDb;
  }
  return db as unknown as DbClient;
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function tokenFrom(request: Request) {
  const token = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("mysql_exam_session="))
    ?.split("=")[1];
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

function freshToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function json(data: unknown, status = 200, cookie?: string) {
  const h = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  });
  if (cookie)
    h.set(
      "Set-Cookie",
      "mysql_exam_session=" +
        cookie +
        "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=15552000"
    );
  return new Response(JSON.stringify(data), { status, headers: h });
}

async function readBody(request: Request) {
  const max = 220000;
  if (Number(request.headers.get("content-length") ?? 0) > max)
    throw new HttpError(413, "Request too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Missing request.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const r = await reader.read();
    if (r.done) break;
    size += r.value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "Request too large.");
    }
    chunks.push(r.value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.length;
  }
  try {
    return bodySchema.parse(JSON.parse(new TextDecoder().decode(all)));
  } catch {
    throw new HttpError(400, "Please check your input and try again.");
  }
}

async function getSupabaseSession(request: Request) {
  if (!isSupabaseConfigured()) return null;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error,
    } = await client.auth.getUser(token);
    if (error || !user) return null;

    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return { client, user, isAdmin: profile?.role === "admin" };
  } catch {
    return null;
  }
}

async function owned(id: string, owner: string): Promise<Row> {
  const row = await database()
    .prepare("SELECT * FROM exam_attempts WHERE id=? AND owner=?")
    .bind(id, owner)
    .first<Row>();
  if (!row) throw new HttpError(404, "This attempt is not available in this browser.");
  if (row.status === "active" && Date.now() >= row.deadline) {
    await database()
      .prepare(
        "UPDATE exam_attempts SET status='submitted', submitted_at=deadline WHERE id=? AND owner=? AND status='active'"
      )
      .bind(id, owner)
      .run();
    row.status = "submitted";
    row.submitted_at = row.deadline;
  }
  return row;
}

async function answersFor(id: string) {
  const result = await database()
    .prepare(
      "SELECT question_id,value,correction,flagged,review_mark,reflection FROM exam_answers WHERE attempt_id=?"
    )
    .bind(id)
    .all<{
      question_id: number;
      value: string;
      correction: string;
      flagged: number;
      review_mark: number | null;
      reflection: string;
    }>();
  const answers: Record<string, Answer> = {};
  for (const a of result.results ?? [])
    answers[a.question_id] = {
      value: a.value,
      correction: a.correction,
      flagged: Boolean(a.flagged),
      reviewMark: a.review_mark,
      reflection: a.reflection,
    };
  return answers;
}

function summary(row: Row, answers: Record<string, Answer>): Attempt {
  const { report } = calculateReport(answers);
  return {
    id: row.id,
    name: row.name,
    studentId: row.student_id,
    cohort: row.cohort,
    startedAt: row.started_at,
    deadline: row.deadline,
    submittedAt: row.submitted_at,
    status: row.status,
    answered: report.answered,
    automatic: row.status === "submitted" ? report.automatic : 0,
    written: row.status === "submitted" ? report.written : 0,
    pending: row.status === "submitted" ? report.pending : 15,
  };
}

async function payload(row: Row): Promise<ExamPayload> {
  const answers = await answersFor(row.id);
  const graded = row.status === "submitted" ? calculateReport(answers) : null;
  return {
    attempt: summary(row, answers),
    questions: BANK.map(({ answer, explanation, rubric, ...q }) => q),
    answers,
    report: graded?.report ?? null,
    feedback: graded?.feedback ?? null,
    serverNow: Date.now(),
  };
}

export async function handleExam(request: Request): Promise<Response> {
  try {
    const sb = await getSupabaseSession(request);
    const url = new URL(request.url);

    // If request is authenticated with Supabase, handle via Supabase DB with RLS
    if (sb) {
      const { client, user, isAdmin } = sb;
      const now = Date.now();

      if (request.method === "GET") {
        const id = url.searchParams.get("id");
        if (id) {
          if (!uuid.safeParse(id).success) throw new HttpError(400, "Invalid attempt.");
          let q = client.from("exam_attempts").select("*").eq("id", id);
          if (!isAdmin) q = q.eq("user_id", user.id);
          const { data: row } = await q.maybeSingle();
          if (!row) throw new HttpError(404, "Exam attempt not found.");

          const { data: answersData } = await client
            .from("exam_answers")
            .select("question_id, value, correction, flagged, review_mark, reflection")
            .eq("attempt_id", id);

          const answers: Record<string, Answer> = {};
          (answersData || []).forEach((a) => {
            answers[a.question_id] = {
              value: a.value,
              correction: a.correction,
              flagged: Boolean(a.flagged),
              reviewMark: a.review_mark,
              reflection: a.reflection,
            };
          });

          const attemptRow: Row = {
            id: row.id,
            owner: row.user_id,
            name: row.name,
            student_id: row.student_id,
            cohort: row.cohort,
            started_at: Number(row.started_at),
            deadline: Number(row.deadline),
            submitted_at: row.submitted_at ? Number(row.submitted_at) : null,
            status: row.status,
          };

          const graded = attemptRow.status === "submitted" ? calculateReport(answers) : null;
          return json({
            attempt: summary(attemptRow, answers),
            questions: BANK.map(({ answer, explanation, rubric, ...q }) => q),
            answers,
            report: graded?.report ?? null,
            feedback: graded?.feedback ?? null,
            serverNow: Date.now(),
          });
        }

        // Fetch all attempts for user or admin
        let q = client
          .from("exam_attempts")
          .select("*")
          .order("started_at", { ascending: false });
        if (!isAdmin) q = q.eq("user_id", user.id);
        const { data: rows } = await q.limit(30);

        const attemptsList = await Promise.all(
          (rows || []).map(async (r) => {
            const { data: ansData } = await client
              .from("exam_answers")
              .select("question_id, value, correction, flagged, review_mark, reflection")
              .eq("attempt_id", r.id);

            const answers: Record<string, Answer> = {};
            (ansData || []).forEach((a) => {
              answers[a.question_id] = {
                value: a.value,
                correction: a.correction,
                flagged: Boolean(a.flagged),
                reviewMark: a.review_mark,
                reflection: a.reflection,
              };
            });

            const attRow: Row = {
              id: r.id,
              owner: r.user_id,
              name: r.name,
              student_id: r.student_id,
              cohort: r.cohort,
              started_at: Number(r.started_at),
              deadline: Number(r.deadline),
              submitted_at: r.submitted_at ? Number(r.submitted_at) : null,
              status: r.status,
            };
            return summary(attRow, answers);
          })
        );

        return json({ attempts: attemptsList });
      }

      if (request.method !== "POST") throw new HttpError(405, "Method not allowed.");
      const data = await readBody(request);

      if (data.action === "start") {
        const { data: activeRow } = await client
          .from("exam_attempts")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gt("deadline", now)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeRow) {
          const { data: ansData } = await client
            .from("exam_answers")
            .select("question_id, value, correction, flagged, review_mark, reflection")
            .eq("attempt_id", activeRow.id);

          const answers: Record<string, Answer> = {};
          (ansData || []).forEach((a) => {
            answers[a.question_id] = {
              value: a.value,
              correction: a.correction,
              flagged: Boolean(a.flagged),
              reviewMark: a.review_mark,
              reflection: a.reflection,
            };
          });

          const attRow: Row = {
            id: activeRow.id,
            owner: activeRow.user_id,
            name: activeRow.name,
            student_id: activeRow.student_id,
            cohort: activeRow.cohort,
            started_at: Number(activeRow.started_at),
            deadline: Number(activeRow.deadline),
            submitted_at: activeRow.submitted_at ? Number(activeRow.submitted_at) : null,
            status: activeRow.status,
          };
          return json({
            attempt: summary(attRow, answers),
            questions: BANK.map(({ answer, explanation, rubric, ...q }) => q),
            answers,
            report: null,
            feedback: null,
            serverNow: Date.now(),
          });
        }

        const attemptId = crypto.randomUUID();
        const deadline = now + 5400000;

        await client.from("exam_attempts").insert({
          id: attemptId,
          user_id: user.id,
          name: data.name,
          student_id: data.studentId,
          cohort: data.cohort,
          started_at: now,
          deadline,
          status: "active",
          score_automatic: 0,
          score_written: 0,
          score_pending: 15,
        });

        const newAttRow: Row = {
          id: attemptId,
          owner: user.id,
          name: data.name,
          student_id: data.studentId,
          cohort: data.cohort,
          started_at: now,
          deadline,
          submitted_at: null,
          status: "active",
        };

        return json(
          {
            attempt: summary(newAttRow, {}),
            questions: BANK.map(({ answer, explanation, rubric, ...q }) => q),
            answers: {},
            report: null,
            feedback: null,
            serverNow: Date.now(),
          },
          201
        );
      }

      // Handle save, submit, review, reflect in Supabase
      const { data: targetRow } = await client
        .from("exam_attempts")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();

      if (!targetRow) throw new HttpError(404, "Exam attempt not found.");
      if (!isAdmin && targetRow.user_id !== user.id)
        throw new HttpError(403, "Access denied to this attempt.");

      if (data.action === "save") {
        if (targetRow.status !== "active") {
          return json({ saved: true, serverNow: Date.now(), status: targetRow.status });
        }
        if (data.entries.length) {
          const upsertRows = data.entries.map((e) => ({
            attempt_id: targetRow.id,
            user_id: targetRow.user_id,
            question_id: e.id,
            value: e.value,
            correction: e.correction,
            flagged: e.flagged,
            updated_at: new Date().toISOString(),
          }));

          await client
            .from("exam_answers")
            .upsert(upsertRows, { onConflict: "attempt_id,question_id" });
        }
        return json({ saved: true, serverNow: Date.now(), status: "active" });
      }

      if (data.action === "submit") {
        const { data: ansData } = await client
          .from("exam_answers")
          .select("question_id, value, correction, flagged, review_mark, reflection")
          .eq("attempt_id", targetRow.id);

        const answers: Record<string, Answer> = {};
        (ansData || []).forEach((a) => {
          answers[a.question_id] = {
            value: a.value,
            correction: a.correction,
            flagged: Boolean(a.flagged),
            reviewMark: a.review_mark,
            reflection: a.reflection,
          };
        });

        const { report } = calculateReport(answers);
        const submittedTime = Math.min(now, Number(targetRow.deadline));

        await client
          .from("exam_attempts")
          .update({
            status: "submitted",
            submitted_at: submittedTime,
            score_automatic: report.automatic,
            score_written: report.written,
            score_pending: report.pending,
            score_total: report.total,
            percentage: report.percentage,
            grade: report.grade,
            passed: report.passed,
            report_card: report,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetRow.id);

        const updatedAttRow: Row = {
          id: targetRow.id,
          owner: targetRow.user_id,
          name: targetRow.name,
          student_id: targetRow.student_id,
          cohort: targetRow.cohort,
          started_at: Number(targetRow.started_at),
          deadline: Number(targetRow.deadline),
          submitted_at: submittedTime,
          status: "submitted",
        };

        const graded = calculateReport(answers);
        return json({
          attempt: summary(updatedAttRow, answers),
          questions: BANK.map(({ answer, explanation, rubric, ...q }) => q),
          answers,
          report: graded.report,
          feedback: graded.feedback,
          serverNow: Date.now(),
        });
      }

      if (data.action === "review") {
        for (const m of data.marks) {
          await client
            .from("exam_answers")
            .update({ review_mark: m.mark, updated_at: new Date().toISOString() })
            .eq("attempt_id", targetRow.id)
            .eq("question_id", m.id);
        }
      }

      if (data.action === "reflect") {
        await client
          .from("exam_answers")
          .upsert(
            {
              attempt_id: targetRow.id,
              user_id: targetRow.user_id,
              question_id: data.qid,
              reflection: data.reason,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "attempt_id,question_id" }
          );
      }

      // Return updated payload after review or reflect
      const { data: finalAnsData } = await client
        .from("exam_answers")
        .select("question_id, value, correction, flagged, review_mark, reflection")
        .eq("attempt_id", targetRow.id);

      const finalAnswers: Record<string, Answer> = {};
      (finalAnsData || []).forEach((a) => {
        finalAnswers[a.question_id] = {
          value: a.value,
          correction: a.correction,
          flagged: Boolean(a.flagged),
          reviewMark: a.review_mark,
          reflection: a.reflection,
        };
      });

      const { report: finalReport } = calculateReport(finalAnswers);
      await client
        .from("exam_attempts")
        .update({
          score_automatic: finalReport.automatic,
          score_written: finalReport.written,
          score_pending: finalReport.pending,
          score_total: finalReport.total,
          percentage: finalReport.percentage,
          grade: finalReport.grade,
          passed: finalReport.passed,
          report_card: finalReport,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetRow.id);

      const finalAttRow: Row = {
        id: targetRow.id,
        owner: targetRow.user_id,
        name: targetRow.name,
        student_id: targetRow.student_id,
        cohort: targetRow.cohort,
        started_at: Number(targetRow.started_at),
        deadline: Number(targetRow.deadline),
        submitted_at: targetRow.submitted_at ? Number(targetRow.submitted_at) : null,
        status: targetRow.status,
      };

      const graded = calculateReport(finalAnswers);
      return json({
        attempt: summary(finalAttRow, finalAnswers),
        questions: BANK.map(({ answer, explanation, rubric, ...q }) => q),
        answers: finalAnswers,
        report: graded.report,
        feedback: graded.feedback,
        serverNow: Date.now(),
      });
    }

    // Fallback unauthenticated/session-cookie implementation
    let token = tokenFrom(request);
    let owner = token ? await digest(token) : null;
    if (request.method === "GET") {
      if (!owner) {
        if (url.searchParams.has("id"))
          throw new HttpError(401, "Open this attempt in the browser where you started it.");
        return json({ attempts: [] });
      }
      const id = url.searchParams.get("id");
      if (id) {
        if (!uuid.safeParse(id).success) throw new HttpError(400, "Invalid attempt.");
        return json(await payload(await owned(id, owner)));
      }
      const now = Date.now();
      await database()
        .prepare(
          "UPDATE exam_attempts SET status='submitted',submitted_at=deadline WHERE owner=? AND status='active' AND deadline<=?"
        )
        .bind(owner, now)
        .run();
      const rows = await database()
        .prepare(
          "SELECT * FROM exam_attempts WHERE owner=? ORDER BY started_at DESC LIMIT 30"
        )
        .bind(owner)
        .all<Row>();
      const attempts = await Promise.all(
        (rows.results ?? []).map(async (r) => summary(r, await answersFor(r.id)))
      );
      return json({ attempts });
    }

    if (request.method !== "POST") throw new HttpError(405, "Method not allowed.");
    const origin = request.headers.get("origin");
    if (origin !== url.origin)
      throw new HttpError(403, "Please open the exam directly and try again.");
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new HttpError(415, "JSON required.");
    const data = await readBody(request);

    if (data.action === "start") {
      if (!token) {
        token = freshToken();
        owner = await digest(token);
      }
      const db = database();
      const now = Date.now();
      const active = await db
        .prepare(
          "SELECT * FROM exam_attempts WHERE owner=? AND status='active' AND deadline>? ORDER BY started_at DESC LIMIT 1"
        )
        .bind(owner, now)
        .first<Row>();
      if (active) return json(await payload(active), 200, token!);
      const day = Math.floor(now / 86400000);
      const limitKey = await digest(
        (request.headers.get("cf-connecting-ip") ?? owner!) + ":" + day
      );
      const quota = await db
        .prepare(
          "INSERT INTO exam_start_limits (key,count) VALUES (?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<50 RETURNING count"
        )
        .bind(limitKey)
        .first<{ count: number }>();
      if (!quota)
        throw new HttpError(
          429,
          "The daily attempt limit has been reached. Please try again tomorrow."
        );
      const id = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO exam_attempts (id,owner,name,student_id,cohort,started_at,deadline) VALUES (?,?,?,?,?,?,?)"
        )
        .bind(id, owner, data.name, data.studentId, data.cohort, now, now + 5400000)
        .run();
      return json(await payload(await owned(id, owner!)), 201, token!);
    }

    if (!owner)
      throw new HttpError(401, "Your browser session is missing. Return to the dashboard.");
    let row = await owned(data.id, owner);
    const db = database();
    if (data.action === "save") {
      if (row.status !== "active") return json(await payload(row));
      const now = Date.now();
      if (data.entries.length)
        await db.batch(
          data.entries.map((e) =>
            db
              .prepare(
                "INSERT INTO exam_answers (attempt_id,question_id,value,correction,flagged,updated_at) SELECT ?,?,?,?,?,? FROM exam_attempts WHERE id=? AND owner=? AND status='active' AND deadline>? ON CONFLICT(attempt_id,question_id) DO UPDATE SET value=excluded.value,correction=excluded.correction,flagged=excluded.flagged,updated_at=excluded.updated_at"
              )
              .bind(row.id, e.id, e.value, e.correction, e.flagged ? 1 : 0, now, row.id, owner, now)
          )
        );
      return json({ saved: true, serverNow: Date.now(), status: "active" });
    }
    if (data.action === "submit") {
      await db
        .prepare(
          "UPDATE exam_attempts SET status='submitted', submitted_at=MIN(?,deadline) WHERE id=? AND owner=? AND status='active'"
        )
        .bind(Date.now(), row.id, owner)
        .run();
      row = await owned(row.id, owner);
      return json(await payload(row));
    }
    if (row.status !== "submitted")
      throw new HttpError(409, "Submit the exam before reviewing answers.");
    if (data.action === "review") {
      const answers = await answersFor(row.id);
      for (const m of data.marks) {
        const q = BANK.find((q) => q.id === m.id)!;
        if (m.mark > q.points || (!answers[m.id]?.value.trim() && m.mark !== 0))
          throw new HttpError(400, "A review mark is outside the allowed range.");
      }
      await db.batch(
        data.marks.map((m) =>
          db
            .prepare(
              "UPDATE exam_answers SET review_mark=? WHERE attempt_id=? AND question_id=?"
            )
            .bind(m.mark, row.id, m.id)
        )
      );
    }
    if (data.action === "reflect") {
      await db
        .prepare(
          "INSERT INTO exam_answers (attempt_id,question_id,value,correction,flagged,reflection,updated_at) VALUES (?,?,'','',0,?,?) ON CONFLICT(attempt_id,question_id) DO UPDATE SET reflection=excluded.reflection"
        )
        .bind(row.id, data.qid, data.reason, Date.now())
        .run();
    }
    return json(await payload(await owned(row.id, owner)));
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    return json(
      { error: "The exam service could not complete that request. Your saved answers are retained. Please retry." },
      500
    );
  }
}
