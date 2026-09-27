import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  SquaresFour,
  Exam,
  ChartBar,
  ArrowUpRight,
  ShieldCheck,
  Database,
  SignOut,
  GithubLogo,
  Shield,
  User,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { openCookieSettings } from "@/lib/cookie-consent";

export function Brand() {
  return (
    <a href="/" className="brand" aria-label="MySQL Exam Studio home">
      <span className="brand-mark">
        <Database size={23} weight="duotone" />
      </span>
      <span>
        MySQL<span className="brand-small">Exam Studio</span>
      </span>
    </a>
  );
}

export function Shell({
  active,
  children,
}: {
  active?: "overview" | "exam" | "reports" | "admin" | "policy";
  children: ReactNode;
}) {
  const { user, profile, role, signOut, loading } = useAuth();
  const [avatarError, setAvatarError] = useState(false);

  const githubUsername = (user?.user_metadata?.user_name || user?.user_metadata?.preferred_username || profile?.github_username || "") as string;
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || githubUsername || user?.email?.split("@")[0] || "Learner";
  const displayEmail = profile?.email || user?.email || "";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initial = (displayName || githubUsername || "U").charAt(0).toUpperCase();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Brand />

        <div className="nav-caption">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          <a
            href="/"
            className={active === "overview" ? "current" : ""}
            aria-current={active === "overview" ? "page" : undefined}
          >
            <SquaresFour size={20} />
            Overview
          </a>
          <a
            href="/sql-exam"
            className={active === "exam" ? "current" : ""}
            aria-current={active === "exam" ? "page" : undefined}
          >
            <Database size={20} />
            SQL Coding Exam (30 Min)
          </a>
          <a
            href="/exam"
            className={active === "exam" ? "current" : ""}
            aria-current={active === "exam" ? "page" : undefined}
          >
            <Exam size={20} />
            Theory Examination
          </a>
          <a
            href="/reports"
            className={active === "reports" ? "current" : ""}
            aria-current={active === "reports" ? "page" : undefined}
          >
            <ChartBar size={20} />
            Report cards
          </a>
          {role === "admin" && (
            <a
              href="/admin"
              className={active === "admin" ? "current" : ""}
              aria-current={active === "admin" ? "page" : undefined}
            >
              <Shield size={20} />
              Admin portal
            </a>
          )}
        </nav>

        {/* Account / Profile Section */}
        <div className="sidebar-account-section">
          {loading ? (
            <div className="sidebar-account-loading">
              <div className="avatar-placeholder" />
              <div className="text-placeholder" />
            </div>
          ) : user ? (
            <div className="user-profile-box">
              <div className="user-profile-identity">
                {avatarUrl && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="user-profile-avatar"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="user-profile-initial" aria-hidden="true">
                    {initial}
                  </div>
                )}
                <div className="user-profile-meta">
                  <div className="user-profile-name-row">
                    <strong className="user-profile-name" title={displayName}>
                      {displayName}
                    </strong>
                    <span className={`role-badge role-badge-${role}`}>
                      {role.toUpperCase()}
                    </span>
                  </div>
                  {githubUsername && (
                    <span className="user-profile-github" title={`@${githubUsername}`}>
                      @{githubUsername}
                    </span>
                  )}
                  <span className="user-profile-email" title={displayEmail}>
                    {displayEmail}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="sidebar-signout-btn"
                onClick={() => void signOut()}
                title="Sign out of your GitHub account"
              >
                <SignOut size={15} />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <a href="/login" className="sidebar-signin-link">
              <GithubLogo size={18} weight="bold" />
              <span>Continue with GitHub</span>
            </a>
          )}
        </div>

        <div className="sidebar-note">
          <ShieldCheck size={24} />
          <strong>Developer progress, saved.</strong>
          <p>Authenticated attempts and certificates are synced to your GitHub account.</p>
        </div>
        <div className="sidebar-footer">
          <span>MySQL core concepts</span>
          <span className="mono">
            Practice with purpose <ArrowUpRight size={13} />
          </span>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <span>
            Assessment workspace <span className="topbar-slash">/</span>{" "}
            <strong>
              {active === "overview"
                ? "Overview"
                : active === "exam"
                ? "Examination"
                : active === "reports"
                ? "Report cards"
                : "Admin portal"}
            </strong>
          </span>
          <div className="topbar-right">
            {user ? (
              <div className="topbar-user-chip">
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="topbar-avatar"
                    referrerPolicy="no-referrer"
                    onError={() => {}}
                  />
                )}
                <span className={`role-badge role-badge-${role}`}>
                  {role.toUpperCase()}
                </span>
                <span className="topbar-user-name">
                  {displayName}
                  {githubUsername ? ` (@${githubUsername})` : ""}
                </span>
                <button
                  type="button"
                  className="topbar-signout-btn"
                  onClick={() => void signOut()}
                  title="Sign out"
                >
                  <SignOut size={12} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <a href="/login" className="topbar-login-link">
                <GithubLogo size={14} weight="bold" />
                <span>Sign in with GitHub</span>
              </a>
            )}
            <span className="topbar-label">PERSONAL PRACTICE</span>
          </div>
        </header>
        {children}
        <footer className="page-footer">
          <div className="page-footer-left">
            <span>MySQL Exam Studio</span>
            <span className="page-footer-divider">|</span>
            <span>Built for focused practice. Based on MySQL 8.4 concepts.</span>
          </div>
          <div className="page-footer-right">
            <a href="/cookie-policy" className="footer-link">
              Cookie Policy
            </a>
            <span className="footer-dot">•</span>
            <button
              type="button"
              onClick={openCookieSettings}
              className="footer-cookie-btn"
            >
              Cookie Settings
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function ErrorBox({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="error-box" role="alert">
      <p>{message}</p>
      {retry && <button onClick={retry}>Try again</button>}
    </div>
  );
}

export function Loading({
  label = "Loading your workspace",
}: {
  label?: string;
}) {
  return (
    <div className="loading-surface" aria-live="polite" aria-busy="true">
      <p>{label}...</p>
      <div />
      <div />
      <div />
    </div>
  );
}

export function useQueryId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(
    () =>
      setId(new URLSearchParams(window.location.search).get("id") ?? ""),
    []
  );
  return id;
}

export const ExamShell = Shell;
