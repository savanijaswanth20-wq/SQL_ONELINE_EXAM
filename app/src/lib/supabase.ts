import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "staff" | "customer";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  role: UserRole;
  created_at: string;
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
