import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

export const createClient = (cookieHeader?: string) => {
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          if (!cookieHeader) return [];
          return cookieHeader.split(";").map((cookie) => {
            const [name, ...rest] = cookie.trim().split("=");
            return { name, value: rest.join("=") };
          });
        },
        setAll(_cookiesToSet) {
          // In SSR response handlers, cookies are attached to headers
        },
      },
    }
  );
};
