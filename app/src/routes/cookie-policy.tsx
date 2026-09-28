import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/exam-shell";
import { openCookieSettings } from "@/lib/cookie-consent";
import {
  Cookie,
  ShieldCheck,
  CheckCircle,
  SlidersHorizontal,
  LockKey,
  Database,
  GearSix,
} from "@phosphor-icons/react";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Privacy & Cookies | Algonex Exam Studio" },
      {
        name: "description",
        content:
          "Read our Cookie & Privacy Policy to understand how Algonex Exam Studio uses session storage mechanisms and how to manage your preferences.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://algonexexam.savanijaswanth20.workers.dev/cookie-policy",
      },
    ],
  }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return (
    <Shell active="policy">
      <main className="content-wrap">
        <div className="cookie-policy-page">
          <header className="cookie-policy-header">
            <div className="policy-badge">
              <Cookie size={14} weight="duotone" />
              <span>TRANSPARENCY &amp; PRIVACY</span>
            </div>
            <h1>Privacy &amp; Cookie Policy</h1>
            <p className="policy-intro">
              This policy explains how Algonex Exam Studio (Algonex IT Solutions Exam Portal) uses cookies and
              local browser storage technologies to provide a secure, authenticated, and uninterrupted assessment experience.
            </p>
            <div className="policy-actions">
              <button
                type="button"
                className="policy-settings-btn"
                onClick={openCookieSettings}
              >
                <SlidersHorizontal size={16} />
                <span>Update Cookie Preferences</span>
              </button>
              <span className="policy-last-updated">
                Last revised: September 2026 • Grounded strictly in active platform tools
              </span>
            </div>
          </header>

          <section className="policy-section">
            <h2>1. What Are Cookies &amp; Local Storage?</h2>
            <p>
              Cookies and local browser storage are lightweight data keys stored on your device when you interact with our
              online assessment platform. They allow Algonex Exam Studio to verify your GitHub OAuth identity, maintain your
              timer during an ongoing examination, and prevent loss of answers in the event of unexpected internet disruptions.
            </p>
          </section>

          <section className="policy-section">
            <h2>2. Implemented Storage Technologies</h2>
            <div className="policy-categories-grid">
              <div className="policy-category-card">
                <div className="policy-category-card-header">
                  <div className="category-icon-box">
                    <LockKey size={20} weight="fill" />
                  </div>
                  <div>
                    <h3>Strictly Necessary Authentication</h3>
                    <span className="cookie-badge cookie-badge-required">
                      Always Active
                    </span>
                  </div>
                </div>
                <p>
                  Required for core platform functionality. These tokens enable secure GitHub OAuth authorization via Supabase
                  Auth, enforce Row Level Security (RLS) on your candidate records, and preserve active examination progress.
                </p>
              </div>

              <div className="policy-category-card">
                <div className="policy-category-card-header">
                  <div className="category-icon-box">
                    <Database size={20} weight="fill" />
                  </div>
                  <div>
                    <h3>Session Continuity &amp; Auto-Save</h3>
                    <span className="cookie-badge cookie-badge-required">
                      Always Active
                    </span>
                  </div>
                </div>
                <p>
                  Keeps your 90-minute or 30-minute exam timer synchronized with the server, auto-saves question responses
                  as you type, and preserves your scorecards upon exam submission.
                </p>
              </div>

              <div className="policy-category-card">
                <div className="policy-category-card-header">
                  <div className="category-icon-box">
                    <GearSix size={20} weight="fill" />
                  </div>
                  <div>
                    <h3>User Preferences &amp; Consent</h3>
                    <span className="cookie-badge cookie-badge-optional">
                      Configurable
                    </span>
                  </div>
                </div>
                <p>
                  Remembers your cookie consent choices so the banner does not intrude on subsequent visits, and caches UI
                  filters on the report card dashboard.
                </p>
              </div>
            </div>
          </section>

          <section className="policy-section">
            <h2>3. Active Cookie Inventory Table</h2>
            <p>
              Below is the comprehensive list of cookies and local storage keys actively implemented in this platform:
            </p>
            <div className="policy-table-wrapper">
              <table className="policy-table">
                <thead>
                  <tr>
                    <th>Cookie / Storage Key</th>
                    <th>Classification</th>
                    <th>Function &amp; Purpose</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>sb-*-auth-token</code></td>
                    <td>Strictly Necessary</td>
                    <td>Maintains authenticated GitHub OAuth session with Supabase Auth</td>
                    <td>Session / 1 Year</td>
                  </tr>
                  <tr>
                    <td><code>cookie_consent</code></td>
                    <td>Essential Preference</td>
                    <td>Stores candidate consent preferences so the notice remains non-blocking</td>
                    <td>1 Year</td>
                  </tr>
                  <tr>
                    <td><code>mysql_exam_session</code></td>
                    <td>Strictly Necessary</td>
                    <td>Cryptographic session token for persistent exam timer and attempt state</td>
                    <td>180 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="policy-section">
            <h2>4. Managing Your Preferences</h2>
            <p>
              You can adjust your consent choices at any time by clicking the <strong>“Cookie Settings”</strong> button in the
              page footer or the button below. Our cookie banner is designed to be non-blocking and respects user focus.
            </p>
            <div className="policy-banner-callout">
              <ShieldCheck size={28} weight="duotone" />
              <div>
                <strong>Update your privacy preferences anytime</strong>
                <p>
                  Your selections are applied instantly without interrupting ongoing exam attempts.
                </p>
              </div>
              <button
                type="button"
                className="policy-settings-btn"
                onClick={openCookieSettings}
              >
                Manage Preferences
              </button>
            </div>
          </section>

          <section className="policy-section">
            <h2>5. Data Security Guarantee</h2>
            <p>
              Algonex Exam Studio strictly enforces Row Level Security (RLS) on all database tables. Passwords, GitHub OAuth tokens,
              and private cookies are never exposed or stored in source control. GitHub is utilized exclusively for authentication
              and source-code hosting.
            </p>
          </section>
        </div>
      </main>
    </Shell>
  );
}
