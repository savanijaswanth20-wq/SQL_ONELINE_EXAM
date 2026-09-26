import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Loading } from "@/components/exam-shell";
import { WarningCircle, ArrowRight } from "@phosphor-icons/react";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Authenticating | MySQL Exam Studio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");
    const nextUrl = searchParams.get("next") || "/";

    // Handle cancelled login or OAuth provider errors
    if (errorParam || errorDesc) {
      setError(
        errorDesc ||
          errorParam ||
          "GitHub sign-in was cancelled or encountered an error."
      );
      return;
    }

    const client = getSupabase();

    // 1. Listen for auth state change (in case background exchange succeeded)
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        window.location.replace(nextUrl);
      }
    });

    // 2. Check if session was already established or can be exchanged
    client.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        window.location.replace(nextUrl);
        return;
      }

      if (code) {
        try {
          const { data, error: exchangeError } =
            await client.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            // Check once more in case detectSessionInUrl exchanged it in parallel
            const {
              data: { session: retrySession },
            } = await client.auth.getSession();

            if (retrySession) {
              window.location.replace(nextUrl);
              return;
            }

            setError(
              "Your login session expired or was already used. Please click below to sign in freshly."
            );
            return;
          }

          if (data.session) {
            window.location.replace(nextUrl);
          } else {
            window.location.replace("/");
          }
        } catch {
          const {
            data: { session: retrySession },
          } = await client.auth.getSession();

          if (retrySession) {
            window.location.replace(nextUrl);
            return;
          }

          setError(
            "Authentication session expired. Please click below to start a fresh sign-in."
          );
        }
      } else {
        const timer = setTimeout(() => {
          window.location.replace("/login");
        }, 2000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (error) {
    return (
      <main className="root-error content-wrap">
        <div className="error-box" role="alert">
          <WarningCircle size={28} />
          <h2>Authentication Notice</h2>
          <p>{error}</p>
          <a href="/login" className="enter-ticket">
            Sign in with GitHub <ArrowRight size={18} />
          </a>
        </div>
      </main>
    );
  }

  return <Loading label="Finalizing GitHub authorization" />;
}
