import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/exam-shell";
import { openCookieSettings } from "@/lib/cookie-consent";
import {
  Cookie,
  ShieldCheck,
  CheckCircle,
  SlidersHorizontal,
  LockKey,
  ChartLineUp,
  GearSix,
  MegaphoneSimple,
} from "@phosphor-icons/react";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Cookie Policy | MySQL Exam Studio" },
      {
        name: "description",
        content:
          "Read our Cookie Policy to understand how MySQL Exam Studio uses cookies, storage mechanisms, and how to manage your privacy preferences.",
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
          <h1>Cookie Policy</h1>
          <p className="policy-intro">
            This Cookie Policy explains how MySQL Exam Studio uses cookies and
            similar local storage technologies when you access our assessment
            platform. We are committed to protecting your personal data and giving
            you clear control over your choices.
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
              Last revised: September 2026 • Compliant with GDPR &amp; ePrivacy
            </span>
          </div>
        </header>

        <section className="policy-section">
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your computer or mobile device
            when you visit a website. They allow the platform to remember your
            actions and preferences (such as authentication state, assessment session,
            and interface options) over a period of time, ensuring a smooth and
            uninterrupted testing experience.
          </p>
        </section>

        <section className="policy-section">
          <h2>2. Categories of Cookies We Use</h2>
          <div className="policy-categories-grid">
            <div className="policy-category-card">
              <div className="policy-category-card-header">
                <div className="category-icon-box">
                  <LockKey size={20} weight="fill" />
                </div>
                <div>
                  <h3>Strictly Necessary Cookies</h3>
                  <span className="cookie-badge cookie-badge-required">
                    Always Enabled
                  </span>
                </div>
              </div>
              <p>
                Essential for core assessment operation. These allow you to sign in
                with GitHub, protect against Cross-Site Request Forgery (CSRF),
                keep track of your 65-question assessment countdown timer, and
                cache test answers locally so connection drops never cause loss of progress.
              </p>
            </div>

            <div className="policy-category-card">
              <div className="policy-category-card-header">
                <div className="category-icon-box">
                  <ChartLineUp size={20} weight="fill" />
                </div>
                <div>
                  <h3>Analytics &amp; Performance</h3>
                  <span className="cookie-badge cookie-badge-optional">
                    Optional
                  </span>
                </div>
              </div>
              <p>
                Help us understand how candidates navigate the assessment, verify
                system latency, identify server-side errors, and optimize question
                rendering speeds. All data is aggregated and never linked to your
                exam score.
              </p>
            </div>

            <div className="policy-category-card">
              <div className="policy-category-card-header">
                <div className="category-icon-box">
                  <GearSix size={20} weight="fill" />
                </div>
                <div>
                  <h3>Functional &amp; Preferences</h3>
                  <span className="cookie-badge cookie-badge-optional">
                    Optional
                  </span>
                </div>
              </div>
              <p>
                Used to remember your preferred viewing modes, sidebar layout state,
                font accessibility toggles, and syntax highlighting choices so you
                do not have to reconfigure them each time you visit.
              </p>
            </div>

            <div className="policy-category-card">
              <div className="policy-category-card-header">
                <div className="category-icon-box">
                  <MegaphoneSimple size={20} weight="fill" />
                </div>
                <div>
                  <h3>Marketing &amp; Announcements</h3>
                  <span className="cookie-badge cookie-badge-optional">
                    Optional
                  </span>
                </div>
              </div>
              <p>
                Allow us to notify you about relevant MySQL curriculum updates, new
                version assessments (e.g. MySQL 8.4 LTS certifications), and special
                evaluation tracks. We never sell your personal data.
              </p>
            </div>
          </div>
        </section>

        <section className="policy-section">
          <h2>3. Cookie Inventory Table</h2>
          <div className="policy-table-wrapper">
            <table className="policy-table">
              <thead>
                <tr>
                  <th>Cookie Name</th>
                  <th>Category</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>sb-*-auth-token</code></td>
                  <td>Strictly Necessary</td>
                  <td>Maintains authenticated GitHub session via Supabase Auth</td>
                  <td>Session / 1 Year</td>
                </tr>
                <tr>
                  <td><code>cookie_consent</code></td>
                  <td>Strictly Necessary</td>
                  <td>Stores your cookie consent choices so the banner does not re-appear</td>
                  <td>1 Year</td>
                </tr>
                <tr>
                  <td><code>exam_session_lock</code></td>
                  <td>Strictly Necessary</td>
                  <td>Prevents concurrent attempts and guarantees assessment integrity</td>
                  <td>Session</td>
                </tr>
                <tr>
                  <td><code>_ga, _ga_*</code></td>
                  <td>Analytics (Optional)</td>
                  <td>Measures platform performance and anonymous page views</td>
                  <td>2 Years (only with consent)</td>
                </tr>
                <tr>
                  <td><code>user_pref_theme</code></td>
                  <td>Functional (Optional)</td>
                  <td>Saves interface personalization and layout preferences</td>
                  <td>1 Year (only with consent)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="policy-section">
          <h2>4. Managing Your Choices</h2>
          <p>
            You can change or withdraw your consent at any time. When you click the
            <strong> “Update Cookie Preferences”</strong> button below or the
            <strong> “Cookie Settings”</strong> link in our website footer, you can
            toggle optional cookie categories on or off.
          </p>
          <div className="policy-banner-callout">
            <ShieldCheck size={28} weight="duotone" />
            <div>
              <strong>Ready to update your preferences?</strong>
              <p>
                Your changes take effect immediately and are saved across sessions.
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
          <h2>5. Contact Us</h2>
          <p>
            If you have questions about this policy or how your data is handled,
            please contact our compliance team through our GitHub repository or
            reach out to your system administrator.
          </p>
        </section>
      </div>
      </main>
    </Shell>
  );
}
