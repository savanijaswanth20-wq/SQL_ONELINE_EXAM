import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Brand } from "@/components/exam-shell";
import { openCookieSettings } from "@/lib/cookie-consent";
import {
  GithubLogo,
  ShieldCheck,
  CheckCircle,
  WarningCircle,
  Database,
  LockKey,
} from "@phosphor-icons/react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In with GitHub | Algonex Exam Studio" },
      {
        name: "description",
        content:
          "Sign in with GitHub to securely save your exam attempts, answers, and report cards on Algonex Exam Studio.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://algonexexam.savanijaswanth20.workers.dev/login",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, error, isConfigured, signInWithGitHub, clearError } =
    useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [redirectPath, setRedirectPath] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      const redirect = search.get("redirect") || "/";
      const err = search.get("error");
      setRedirectPath(redirect);
      if (err) {
        setLocalError(err);
      }
    }
  }, []);

  // If already logged in, redirect to intended target
  useEffect(() => {
    if (!loading && user && typeof window !== "undefined") {
      window.location.replace(redirectPath || "/");
    }
  }, [user, loading, redirectPath]);

  const handleGitHubSignIn = async () => {
    setSubmitting(true);
    setLocalError("");
    clearError();
    try {
      await signInWithGitHub(redirectPath);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to initiate GitHub sign in";
      setLocalError(msg);
      setSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <Brand />
          <span className="eyebrow">AUTHENTICATION & ACCESS</span>
          <h1>Candidate Authentication</h1>
          <p className="muted">
            Sign in with GitHub to securely save your exam attempts, answers, and report cards.
          </p>
        </div>

        {activeError && (
          <div className="error-box" role="alert">
            <WarningCircle size={20} />
            <div>
              <strong>Sign In Error</strong>
              <p>{activeError}</p>
            </div>
          </div>
        )}

        {!isConfigured && (
          <div className="config-warning-box">
            <LockKey size={22} />
            <div>
              <strong>Supabase Setup Required</strong>
              <p>
                To enable GitHub OAuth, define your Supabase credentials in your{" "}
                <code>.env</code> file:
              </p>
              <pre className="env-snippet">
                VITE_SUPABASE_URL=https://your-project.supabase.co
                {"\n"}
                VITE_SUPABASE_ANON_KEY=your-anon-key
              </pre>
            </div>
          </div>
        )}

        <div className="auth-action-area">
          <button
            type="button"
            className="github-auth-button"
            onClick={handleGitHubSignIn}
            disabled={submitting || loading || !isConfigured}
            aria-label="Sign in with GitHub"
          >
            <GithubLogo size={22} weight="bold" />
            <span>
              {submitting
                ? "Connecting to GitHub..."
                : "Sign in with GitHub"}
            </span>
          </button>
        </div>

        <div className="auth-features-list">
          <div className="auth-feature-item">
            <ShieldCheck size={18} />
            <div>
              <strong>Developer Identity Verification</strong>
              <p>
                Secure OAuth authentication through GitHub, keeping your source code and keys isolated.
              </p>
            </div>
          </div>
          <div className="auth-feature-item">
            <Database size={18} />
            <div>
              <strong>Persistent Assessment Records</strong>
              <p>
                Sign in with GitHub to securely save your exam attempts, answers, and report cards.
              </p>
            </div>
          </div>
          <div className="auth-feature-item">
            <CheckCircle size={18} />
            <div>
              <strong>Downloadable PDF Report Cards</strong>
              <p>
                Export verifiable, high-resolution PDF report cards detailing your scores and topic mastery.
              </p>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>
            By continuing, you agree to Algonex Exam Studio terms of service and assessment code of conduct.
          </p>
          <div className="login-footer-links">
            <a href="/cookie-policy" className="login-footer-link">
              Privacy &amp; Cookies
            </a>
            <span className="login-footer-dot">•</span>
            <button
              type="button"
              onClick={openCookieSettings}
              className="login-cookie-btn"
            >
              Cookie Settings
            </button>
            <span className="login-footer-dot">•</span>
            <a href="/" className="login-back-link">
              Back to Overview
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
