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
      { title: "Sign In with GitHub | MySQL Exam Studio" },
      {
        name: "description",
        content:
          "Sign in with GitHub to access your MySQL assessments, certifications, and progress records.",
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
          <h1>Sign in with GitHub</h1>
          <p className="muted">
            Authenticate using your GitHub account to access your examination
            workspace, track attempts, and generate verified report cards.
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
            aria-label="Continue with GitHub"
          >
            <GithubLogo size={22} weight="bold" />
            <span>
              {submitting
                ? "Connecting to GitHub..."
                : "Continue with GitHub"}
            </span>
          </button>
        </div>

        <div className="auth-features-list">
          <div className="auth-feature-item">
            <ShieldCheck size={18} />
            <div>
              <strong>Verified Developer Identity</strong>
              <p>
                Seamless authentication linked to your GitHub developer credentials.
              </p>
            </div>
          </div>
          <div className="auth-feature-item">
            <Database size={18} />
            <div>
              <strong>Persistent Assessment Records</strong>
              <p>
                Exam progress, answers, and reviewed scores synced to your profile.
              </p>
            </div>
          </div>
          <div className="auth-feature-item">
            <CheckCircle size={18} />
            <div>
              <strong>Shareable PDF Scorecards</strong>
              <p>
                Download signed report cards displaying your name and GitHub username.
              </p>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>
            By continuing, you agree to MySQL Exam Studio terms of service and exam code of conduct.
          </p>
          <div className="login-footer-links">
            <a href="/cookie-policy" className="login-footer-link">
              Cookie Policy
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
              Public Overview
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
