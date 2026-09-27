import { z } from "zod";
import { SQL_QUESTIONS, SQL_EXAM_NAME, SQL_EXAM_DURATION_MS, TOTAL_MARKS } from "./sql-exam-questions";
import { evaluateQuestion } from "./sql-engine";
import type { SqlExamAnswer, SqlExamAttempt, SqlExamPayload, QuestionEvaluation } from "./sql-exam-types";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const attemptIdSchema = z.string().uuid();

const saveEntrySchema = z.object({
  questionId: z.number().int().min(1).max(8),
  code: z.string().max(10000),
  flagged: z.boolean(),
});

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    userName: z.string().trim().min(2).max(80).default("Learner"),
    userEmail: z.string().trim().max(100).default(""),
  }),
  z.object({
    action: z.literal("save"),
    id: attemptIdSchema,
    entries: z.array(saveEntrySchema).max(8),
  }),
  z.object({
    action: z.literal("submit"),
    id: attemptIdSchema,
  }),
  z.object({
    action: z.literal("reset_question"),
    id: attemptIdSchema,
    questionId: z.number().int().min(1).max(8),
  }),
]);

// In-memory persistent storage for SQL exam attempts (mapped by attempt ID and user session key)
const attemptsStore = new Map<string, SqlExamAttempt>();
const userActiveAttemptMap = new Map<string, string>(); // userKey -> attemptId

function getSessionUserKey(request: Request): string {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const authCookie = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("mysql_sql_exam_session=") || s.startsWith("sb-") || s.startsWith("mysql_exam_session="));
  
  if (authCookie) {
    return authCookie;
  }
  
  // Fallback to IP / user-agent fingerprint if cookies are not set
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local_user";
  const ua = request.headers.get("user-agent") || "browser";
  return `session_${ip}_${ua}`;
}

function tokenFromCookie(request: Request): string {
  const token = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("mysql_sql_exam_session="))
    ?.split("=")[1];

  if (token && /^[a-f0-9]{32,64}$/.test(token)) {
    return token;
  }
  const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  return newToken;
}

function jsonResponse(data: unknown, status = 200, sessionToken?: string): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  });
  if (sessionToken) {
    headers.set(
      "Set-Cookie",
      `mysql_sql_exam_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=15552000`
    );
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function buildExamPayload(attempt: SqlExamAttempt): SqlExamPayload {
  const isSubmitted = attempt.status === "submitted";

  // Hide solution SQL during exam
  const sanitizedQuestions = SQL_QUESTIONS.map(({ expectedSql, explanation, ...q }) => q);

  return {
    attempt,
    questions: sanitizedQuestions,
    answers: attempt.answers,
    serverNow: Date.now(),
    evaluations: isSubmitted ? attempt.evaluations : null,
    fullQuestions: isSubmitted ? SQL_QUESTIONS : null,
  };
}

export async function handleSqlExam(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const sessionToken = tokenFromCookie(request);
    const userKey = getSessionUserKey(request);

    if (request.method === "GET") {
      const idParam = url.searchParams.get("id");

      if (idParam) {
        const attempt = attemptsStore.get(idParam);
        if (!attempt) {
          throw new HttpError(404, "Exam attempt not found.");
        }
        // Auto-submit if deadline expired and still active
        if (attempt.status === "active" && Date.now() >= attempt.deadline) {
          submitAttempt(attempt);
        }
        return jsonResponse(buildExamPayload(attempt));
      }

      // Check for user's existing active or recent attempt
      const existingId = userActiveAttemptMap.get(userKey);
      if (existingId) {
        const attempt = attemptsStore.get(existingId);
        if (attempt) {
          if (attempt.status === "active" && Date.now() >= attempt.deadline) {
            submitAttempt(attempt);
          }
          return jsonResponse(buildExamPayload(attempt));
        }
      }

      return jsonResponse({ attempt: null, attempts: [] });
    }

    if (request.method !== "POST") {
      throw new HttpError(405, "Method not allowed.");
    }

    const bodyText = await request.text();
    let data;
    try {
      data = bodySchema.parse(JSON.parse(bodyText));
    } catch {
      throw new HttpError(400, "Invalid request payload.");
    }

    if (data.action === "start") {
      const existingId = userActiveAttemptMap.get(userKey);
      if (existingId) {
        const existingAttempt = attemptsStore.get(existingId);
        if (existingAttempt) {
          if (existingAttempt.status === "active" && Date.now() >= existingAttempt.deadline) {
            submitAttempt(existingAttempt);
          }
          return jsonResponse(buildExamPayload(existingAttempt), 200, sessionToken);
        }
      }

      // Create new 30-minute exam attempt
      const now = Date.now();
      const attemptId = crypto.randomUUID();

      const initialAnswers: Record<number, SqlExamAnswer> = {};
      for (const q of SQL_QUESTIONS) {
        initialAnswers[q.id] = {
          code: q.initialCode,
          flagged: false,
          updatedAt: now,
        };
      }

      const newAttempt: SqlExamAttempt = {
        id: attemptId,
        userId: userKey,
        userName: data.userName || "Learner",
        userEmail: data.userEmail || "",
        startedAt: now,
        deadline: now + SQL_EXAM_DURATION_MS,
        submittedAt: null,
        status: "active",
        answers: initialAnswers,
      };

      attemptsStore.set(attemptId, newAttempt);
      userActiveAttemptMap.set(userKey, attemptId);

      return jsonResponse(buildExamPayload(newAttempt), 201, sessionToken);
    }

    const attempt = attemptsStore.get(data.id);
    if (!attempt) {
      throw new HttpError(404, "Exam attempt not found.");
    }

    // Auto submit if deadline passed
    if (attempt.status === "active" && Date.now() >= attempt.deadline) {
      submitAttempt(attempt);
      return jsonResponse(buildExamPayload(attempt));
    }

    if (data.action === "save") {
      if (attempt.status !== "active") {
        return jsonResponse(buildExamPayload(attempt));
      }

      const now = Date.now();
      for (const entry of data.entries) {
        attempt.answers[entry.questionId] = {
          code: entry.code,
          flagged: entry.flagged,
          updatedAt: now,
        };
      }
      return jsonResponse({ saved: true, serverNow: now, status: "active" });
    }

    if (data.action === "reset_question") {
      if (attempt.status === "active") {
        const q = SQL_QUESTIONS.find((item) => item.id === data.questionId);
        if (q) {
          attempt.answers[data.questionId] = {
            code: q.initialCode,
            flagged: false,
            updatedAt: Date.now(),
          };
        }
      }
      return jsonResponse(buildExamPayload(attempt));
    }

    if (data.action === "submit") {
      if (attempt.status === "active") {
        submitAttempt(attempt);
      }
      return jsonResponse(buildExamPayload(attempt));
    }

    return jsonResponse(buildExamPayload(attempt));
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    return jsonResponse({ error: "Exam service error. Please retry." }, 500);
  }
}

function submitAttempt(attempt: SqlExamAttempt) {
  attempt.status = "submitted";
  attempt.submittedAt = Math.min(Date.now(), attempt.deadline);

  const evaluations: Record<number, QuestionEvaluation> = {};
  let totalScore = 0;

  for (const q of SQL_QUESTIONS) {
    const studentAnswer = attempt.answers[q.id]?.code ?? "";
    const evalRes = evaluateQuestion(q, studentAnswer);
    evaluations[q.id] = evalRes;
    totalScore += evalRes.score;
  }

  attempt.evaluations = evaluations;
  attempt.totalScore = Math.round(totalScore * 10) / 10;
  attempt.maxScore = TOTAL_MARKS;
  attempt.passMark = 60;
}
