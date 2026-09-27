export interface SqlQuestion {
  id: number;
  title: string;
  prompt: string;
  points: number;
  initialCode: string;
  expectedSql: string;
  category: string;
  explanation: string;
  isModification?: boolean; // For INSERT / UPDATE queries
}

export interface TableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  references?: string;
}

export interface TableSchema {
  name: string;
  description: string;
  columns: TableColumn[];
  sampleData: Record<string, unknown>[];
}

export interface SqlQueryResult {
  success: boolean;
  columns?: string[];
  rows?: Record<string, unknown>[];
  rowCount?: number;
  affectedRows?: number;
  error?: string;
  executionTimeMs?: number;
}

export interface QuestionEvaluation {
  questionId: number;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  studentSql: string;
  expectedSql: string;
  studentResult?: SqlQueryResult;
  expectedResult?: SqlQueryResult;
  feedback: string;
}

export interface SqlExamAnswer {
  code: string;
  flagged: boolean;
  lastRunResult?: SqlQueryResult | null;
  updatedAt: number;
}

export interface SqlExamAttempt {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  startedAt: number;
  deadline: number;
  submittedAt: number | null;
  status: "active" | "submitted";
  answers: Record<number, SqlExamAnswer>;
  evaluations?: Record<number, QuestionEvaluation>;
  totalScore?: number;
  maxScore?: number;
  passMark?: number;
}

export interface SqlExamPayload {
  attempt: SqlExamAttempt;
  questions: Omit<SqlQuestion, "expectedSql" | "explanation">[];
  answers: Record<number, SqlExamAnswer>;
  serverNow: number;
  evaluations?: Record<number, QuestionEvaluation> | null;
  fullQuestions?: SqlQuestion[] | null; // Available only after submission
}

// Security Guardrail: Check for dangerous or disallowed SQL keywords
const FORBIDDEN_SQL_PATTERNS = [
  /\bDROP\s+DATABASE\b/i,
  /\bDROP\s+SCHEMA\b/i,
  /\bCREATE\s+USER\b/i,
  /\bDROP\s+USER\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bLOAD\s+DATA\b/i,
  /\bINTO\s+OUTFILE\b/i,
  /\bINTO\s+DUMPFILE\b/i,
  /\bSHUTDOWN\b/i,
  /\bEXEC\s+/i,
  /\bEXECUTE\s+/i,
  /\bSYSTEM\b/i,
  /\bINFORMATION_SCHEMA\b/i,
  /\bMYSQL\.\w+/i,
  /\bPG_\w+/i,
  /\bALTER\s+USER\b/i,
  /\bFLUSH\s+PRIVILEGES\b/i,
];

export function checkSqlSecurity(sql: string): { isSafe: boolean; reason?: string } {
  const trimmed = sql.trim();
  if (!trimmed) {
    return { isSafe: true };
  }

  for (const pattern of FORBIDDEN_SQL_PATTERNS) {
    if (pattern.test(trimmed)) {
      const match = trimmed.match(pattern)?.[0] || "Dangerous command";
      return {
        isSafe: false,
        reason: `Forbidden SQL operation detected: "${match}". Operations like DROP DATABASE, GRANT, REVOKE, and file system access are restricted.`,
      };
    }
  }

  return { isSafe: true };
}
