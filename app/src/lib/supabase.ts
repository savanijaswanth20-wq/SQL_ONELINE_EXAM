import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "staff" | "student" | "customer";

export interface Profile {
  id: string;
  github_id?: string;
  github_username?: string;
  full_name: string;
  email: string;
  avatar_url: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface DbExamAttempt {
  id: string;
  user_id: string;
  name: string;
  student_id: string;
  cohort: string;
  started_at: number;
  deadline: number;
  submitted_at: number | null;
  status: "active" | "submitted";
  score_automatic?: number;
  score_written?: number;
  score_pending?: number;
  score_total?: number;
  percentage?: number;
  grade?: string;
  passed?: boolean;
  report_card?: unknown;
  created_at?: string;
  updated_at?: string;
}

export interface DbExamAnswer {
  id?: string;
  attempt_id: string;
  user_id: string;
  question_id: number;
  value: string;
  correction: string;
  flagged: boolean;
  review_mark: number | null;
  reflection: string;
  created_at?: string;
  updated_at?: string;
}

const getEnvVar = (name: string): string => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[name]) {
    return String(import.meta.env[name]);
  }
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    return String(process.env[name]);
  }
  return "";
};

export const SUPABASE_URL =
  getEnvVar("VITE_SUPABASE_URL") ||
  getEnvVar("NEXT_PUBLIC_SUPABASE_URL") ||
  getEnvVar("SUPABASE_URL") ||
  "https://xjanptwgpwortkueolkl.supabase.co";

export const SUPABASE_ANON_KEY =
  getEnvVar("VITE_SUPABASE_ANON_KEY") ||
  getEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
  getEnvVar("SUPABASE_ANON_KEY") ||
  "sb_publishable_9CFAFikyfipmIO2EmZX7Wg_oyRoYYuF";

export function isSupabaseConfigured(): boolean {
  const url = SUPABASE_URL;
  const key = SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("placeholder-project") &&
      !key.includes("placeholder-anon-key")
  );
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (clientInstance) return clientInstance;

  const isBrowser = typeof window !== "undefined";

  clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      flowType: "pkce",
      storage: isBrowser ? window.localStorage : undefined,
    },
  });

  return clientInstance;
}

export const supabase = getSupabase();
