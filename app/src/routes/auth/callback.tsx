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

    if (errorParam || errorDesc) {
      setError(
        errorDesc ||
          errorParam ||
          "Google sign-in was cancelled or encountered an error."
      );
      return;
    }

    const client = getSupabase();

    if (code) {
      client.auth
        .exchangeCodeForSession(code)
        .then(async ({ data, error: exchangeError }) => {
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }

          if (data.session) {
            window.location.replace(nextUrl);
          } else {
            window.location.replace("/");
          }
        })
        .catch((err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Authentication exchange failed";
          setError(message);
        });
    } else {
      // Check if session was already established or is in hash
      client.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          window.location.replace(nextUrl);
        } else {
          // Listen for next auth event or timeout to login
          const timer = setTimeout(() => {
            window.location.replace("/login");
          }, 2500);
          return () => clearTimeout(timer);
        }
      });
    }
  }, []);

  if (error) {
    return (
      <main className="root-error content-wrap">
        <div className="error-box" role="alert">
          <WarningCircle size={28} />
          <h2>Authentication Failed</h2>
          <p>{error}</p>
          <a href="/login" className="enter-ticket">
            Try signing in again <ArrowRight size={18} />
          </a>
        </div>
      </main>
    );
  }

  return <Loading label="Finalizing Google authorization..." />;
}
