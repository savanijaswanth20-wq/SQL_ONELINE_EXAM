import type { SqlMcqQuestion, SqlMcqOptionMap } from "./sql-mcq-questions";
export type { SqlMcqQuestion, SqlMcqOptionMap };

export interface SqlMcqAnswer {
  option: "A" | "B" | "C" | "D" | "";
  flagged: boolean;
  updatedAt: number;
}

export interface CategoryScore {
  category: string;
  total: number;
  correct: number;
  percentage: number;
}

export interface SqlMcqAttempt {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  startedAt: number;
  deadline: number;
  submittedAt: number | null;
  status: "active" | "submitted";
  answers: Record<number, SqlMcqAnswer>;
  totalScore?: number;
  maxScore?: number;
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
  percentage?: number;
  categoryBreakdown?: Record<string, CategoryScore>;
}

export interface SqlMcqExamPayload {
  attempt: SqlMcqAttempt;
  questions: Omit<SqlMcqQuestion, "correctOption" | "explanation">[];
  answers: Record<number, SqlMcqAnswer>;
  serverNow: number;
  fullQuestions?: SqlMcqQuestion[] | null;
}
