import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

export const createClient = () =>
  createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
