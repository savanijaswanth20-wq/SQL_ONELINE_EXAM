import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Brand } from "@/components/exam-shell";
import {
  GoogleLogo,
  ShieldCheck,
  CheckCircle,
  WarningCircle,
  Database,
  LockKey,
} from "@phosphor-icons/react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In | MySQL Exam Studio" },
      { name: "description", content: "Sign in with Google to access your MySQL assessments and certifications." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, error, isConfigured, signInWithGoogle, clearError } = useAuth();
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

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setLocalError("");
    clearError();
    try {
      await signInWithGoogle(redirectPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate sign in";
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
          <h1>Sign in to your account</h1>
          <p className="muted">
            Authenticate with Google to preserve your assessment records, official scorecards, and progress history.
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
                To enable Google OAuth, define your Supabase credentials in your <code>.env</code> file:
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
            className="google-auth-button"
            onClick={handleGoogleSignIn}
            disabled={submitting || loading || !isConfigured}
            aria-label="Continue with Google"
          >
            <GoogleLogo size={22} weight="bold" />
            <span>{submitting ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>
        </div>

        <div className="auth-features-list">
          <div className="auth-feature-item">
            <ShieldCheck size={18} />
            <div>
              <strong>Secure Role-Based Access</strong>
              <p>Role authorization supports Customer, Staff, and Admin privileges.</p>
            </div>
          </div>
          <div className="auth-feature-item">
            <Database size={18} />
            <div>
              <strong>Persistent User Profiles</strong>
              <p>Automatic profile sync with Google name, email, and avatar.</p>
            </div>
          </div>
          <div className="auth-feature-item">
            <CheckCircle size={18} />
            <div>
              <strong>Private Attempt Recovery</strong>
              <p>Your examination sessions and reviewed scores are permanently linked to your profile.</p>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>
            By continuing, you agree to MySQL Exam Studio terms of service and exam code of conduct.
          </p>
          <a href="/" className="login-back-link">
            Return to Public Overview
          </a>
        </div>
      </div>
    </div>
  );
}
