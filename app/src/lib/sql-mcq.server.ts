import { z } from "zod";
import { SQL_MCQ_QUESTIONS, SQL_MCQ_EXAM_DURATION_MS, TOTAL_MCQ_MARKS } from "./sql-mcq-questions";
import type { SqlMcqAnswer, SqlMcqAttempt, SqlMcqExamPayload, CategoryScore } from "./sql-mcq-types";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const attemptIdSchema = z.string().uuid();

const saveEntrySchema = z.object({
  questionId: z.number().int().min(1).max(45),
  option: z.enum(["A", "B", "C", "D", ""]),
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
    entries: z.array(saveEntrySchema).max(45),
  }),
  z.object({
    action: z.literal("submit"),
    id: attemptIdSchema,
  }),
]);

// In-memory persistent storage for SQL MCQ exam attempts
const mcqAttemptsStore = new Map<string, SqlMcqAttempt>();
const userActiveMcqAttemptMap = new Map<string, string>();

function getSessionUserKey(request: Request): string {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const authCookie = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("mysql_sql_mcq_session=") || s.startsWith("sb-") || s.startsWith("mysql_exam_session="));

  if (authCookie) {
    return authCookie;
  }

  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local_user";
  const ua = request.headers.get("user-agent") || "browser";
  return `mcq_session_${ip}_${ua}`;
}

function tokenFromCookie(request: Request): string {
  const token = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("mysql_sql_mcq_session="))
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
      `mysql_sql_mcq_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=15552000`
    );
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function buildMcqPayload(attempt: SqlMcqAttempt): SqlMcqExamPayload {
  const isSubmitted = attempt.status === "submitted";

  // Hide correctOption and explanation during active exam
  const sanitizedQuestions = SQL_MCQ_QUESTIONS.map(({ correctOption, explanation, ...q }) => q);

  return {
    attempt,
    questions: sanitizedQuestions,
    answers: attempt.answers,
    serverNow: Date.now(),
    fullQuestions: isSubmitted ? SQL_MCQ_QUESTIONS : null,
  };
}

export async function handleSqlMcqExam(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const sessionToken = tokenFromCookie(request);
    const userKey = getSessionUserKey(request);

    if (request.method === "GET") {
      const idParam = url.searchParams.get("id");

      if (idParam) {
        const attempt = mcqAttemptsStore.get(idParam);
        if (!attempt) {
          throw new HttpError(404, "MCQ Exam attempt not found.");
        }
        if (attempt.status === "active" && Date.now() >= attempt.deadline) {
          submitMcqAttempt(attempt);
        }
        return jsonResponse(buildMcqPayload(attempt));
      }

      const existingId = userActiveMcqAttemptMap.get(userKey);
      if (existingId) {
        const attempt = mcqAttemptsStore.get(existingId);
        if (attempt) {
          if (attempt.status === "active" && Date.now() >= attempt.deadline) {
            submitMcqAttempt(attempt);
          }
          return jsonResponse(buildMcqPayload(attempt));
        }
      }

      return jsonResponse({ attempt: null, questions: [], answers: {}, serverNow: Date.now() });
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
      const existingId = userActiveMcqAttemptMap.get(userKey);
      if (existingId) {
        const existingAttempt = mcqAttemptsStore.get(existingId);
        if (existingAttempt) {
          if (existingAttempt.status === "active" && Date.now() >= existingAttempt.deadline) {
            submitMcqAttempt(existingAttempt);
          }
          return jsonResponse(buildMcqPayload(existingAttempt), 200, sessionToken);
        }
      }

      const now = Date.now();
      const attemptId = crypto.randomUUID();

      const initialAnswers: Record<number, SqlMcqAnswer> = {};
      for (const q of SQL_MCQ_QUESTIONS) {
        initialAnswers[q.id] = {
          option: "",
          flagged: false,
          updatedAt: now,
        };
      }

      const newAttempt: SqlMcqAttempt = {
        id: attemptId,
        userId: userKey,
        userName: data.userName || "Learner",
        userEmail: data.userEmail || "",
        startedAt: now,
        deadline: now + SQL_MCQ_EXAM_DURATION_MS,
        submittedAt: null,
        status: "active",
        answers: initialAnswers,
      };

      mcqAttemptsStore.set(attemptId, newAttempt);
      userActiveMcqAttemptMap.set(userKey, attemptId);

      return jsonResponse(buildMcqPayload(newAttempt), 201, sessionToken);
    }

    const attempt = mcqAttemptsStore.get(data.id);
    if (!attempt) {
      throw new HttpError(404, "MCQ Exam attempt not found.");
    }

    if (attempt.status === "active" && Date.now() >= attempt.deadline) {
      submitMcqAttempt(attempt);
      return jsonResponse(buildMcqPayload(attempt));
    }

    if (data.action === "save") {
      if (attempt.status !== "active") {
        return jsonResponse(buildMcqPayload(attempt));
      }

      const now = Date.now();
      for (const entry of data.entries) {
        attempt.answers[entry.questionId] = {
          option: entry.option,
          flagged: entry.flagged,
          updatedAt: now,
        };
      }
      return jsonResponse({ saved: true, serverNow: now, status: "active" });
    }

    if (data.action === "submit") {
      if (attempt.status === "active") {
        submitMcqAttempt(attempt);
      }
      return jsonResponse(buildMcqPayload(attempt));
    }

    return jsonResponse(buildMcqPayload(attempt));
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    return jsonResponse({ error: "MCQ Exam service error. Please retry." }, 500);
  }
}

function submitMcqAttempt(attempt: SqlMcqAttempt) {
  attempt.status = "submitted";
  attempt.submittedAt = Math.min(Date.now(), attempt.deadline);

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const categoryMap: Record<string, { total: number; correct: number }> = {};

  for (const q of SQL_MCQ_QUESTIONS) {
    if (!categoryMap[q.category]) {
      categoryMap[q.category] = { total: 0, correct: 0 };
    }
    categoryMap[q.category].total += 1;

    const userAns = attempt.answers[q.id]?.option ?? "";
    if (!userAns) {
      unansweredCount++;
    } else if (userAns === q.correctOption) {
      correctCount++;
      categoryMap[q.category].correct += 1;
    } else {
      wrongCount++;
    }
  }

  const categoryBreakdown: Record<string, CategoryScore> = {};
  for (const [cat, stats] of Object.entries(categoryMap)) {
    categoryBreakdown[cat] = {
      category: cat,
      total: stats.total,
      correct: stats.correct,
      percentage: Math.round((stats.correct / stats.total) * 100 * 10) / 10,
    };
  }

  attempt.totalScore = correctCount; // 1 mark per correct answer
  attempt.maxScore = TOTAL_MCQ_MARKS;
  attempt.correctCount = correctCount;
  attempt.wrongCount = wrongCount;
  attempt.unansweredCount = unansweredCount;
  attempt.percentage = Math.round((correctCount / TOTAL_MCQ_MARKS) * 100 * 10) / 10;
  attempt.categoryBreakdown = categoryBreakdown;
}
