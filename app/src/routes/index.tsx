// ScrollScrub landing journey contract compatibility
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock,
  FileText,
  CheckCircle,
  LockKey,
  ArrowUpRight,
  CodeBlock,
  Key,
  Database,
  BracketsCurly,
  Sparkle,
  GithubLogo,
  Check,
  Exam,
  ListNumbers,
  ChartBar,
  ShieldCheck,
  User,
  Users,
  MagnifyingGlass,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";
import { Shell, ErrorBox } from "@/components/exam-shell";
import { LearnerCard } from "@/components/learner-card";
import { api, attemptUrl, dateLabel } from "@/lib/exam-client";
import { SECTION_DEFINITIONS, SYLLABUS } from "@/lib/exam-types";
import type { Attempt, ExamPayload } from "@/lib/exam-types";
import { useAuth } from "@/lib/auth-context";
import type { PublicLearner } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      {
        rel: "canonical",
        href: "https://algonexexam.savanijaswanth20.workers.dev/",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, updatePublicVisibility } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [cohort, setCohort] = useState("");
  const [accepted, setAccepted] = useState(false);

  // Community Learners State
  const [communityLearners, setCommunityLearners] = useState<PublicLearner[]>([]);
  const [learnersLoading, setLearnersLoading] = useState(true);
  const [learnersSearch, setLearnersSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(3);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [visibilityFeedback, setVisibilityFeedback] = useState<string | null>(null);

  const isPublic = Boolean(profile?.is_public);

  useEffect(() => {
    let active = true;
    async function loadCommunity() {
      setLearnersLoading(true);
      try {
        const res = await fetch("/api/learners?limit=50");
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setCommunityLearners(data.learners || []);
          }
        }
      } catch (err) {
        console.error("Failed to load community learners:", err);
      } finally {
        if (active) setLearnersLoading(false);
      }
    }
    void loadCommunity();
    return () => {
      active = false;
    };
  }, []);

  async function handleToggleVisibility() {
    if (!user || isUpdatingVisibility) return;
    setIsUpdatingVisibility(true);
    setVisibilityFeedback(null);
    const nextState = !isPublic;
    const ok = await updatePublicVisibility(nextState);
    if (ok) {
      setVisibilityFeedback(
        nextState
          ? "Your profile is now publicly visible in the Community directory."
          : "Your profile is now private (hidden from the public)."
      );
      try {
        const res = await fetch("/api/learners?limit=50");
        if (res.ok) {
          const data = await res.json();
          setCommunityLearners(data.learners || []);
        }
      } catch {}
    } else {
      setVisibilityFeedback("Failed to update visibility. Please try again.");
    }
    setIsUpdatingVisibility(false);
  }

  useEffect(() => {
    if (profile?.full_name && !name) {
      setName(profile.full_name);
    } else if (user?.user_metadata?.full_name && !name) {
      setName(user.user_metadata.full_name);
    }
  }, [profile, user, name]);

  async function history() {
    setLoading(true);
    try {
      const data = await api<{ attempts: Attempt[] }>();
      setAttempts(data.attempts);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void history();
  }, []);

  const active = attempts.find((a) => a.status === "active");
  const finished = attempts.filter((a) => a.status === "submitted");
  const best = finished
    .filter((a) => !a.pending)
    .reduce<number | null>(
      (acc, a) => Math.max(acc ?? 0, a.automatic + a.written),
      null
    );

  async function startTheoryExam(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api<ExamPayload>({
        action: "start",
        name,
        studentId,
        cohort,
        accepted,
      });
      window.location.assign(attemptUrl(data.attempt.id, data.attempt.status));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const icons = [
    <BracketsCurly size={24} key="brackets" />,
    <LockKey size={24} key="lock" />,
    <Key size={24} key="key" />,
    <CodeBlock size={24} key="code" />,
  ];

  return (
    <Shell active="overview">
      <main className="dashboard content-wrap">
        {/* Hero Section */}
        <section className="welcome">
          <div className="welcome-copy">
            <span className="eyebrow">ALGONEX IT SOLUTIONS • EXAM PORTAL</span>
            <h1>
              Algonex <span>Exam Studio</span>
            </h1>
            <p>
              Standardized online assessments for database engineering and SQL development.
              Choose between comprehensive theoretical evaluation and live hands-on query development.
            </p>
            <div className="hero-action-buttons">
              <a className="hero-primary-btn" href="#available-exams">
                Explore Examinations <ArrowRight size={18} />
              </a>
              <a className="hero-secondary-btn" href="#community-learners">
                <Users size={18} /> Community Learners
              </a>
              {!user && (
                <a className="hero-secondary-btn" href="/login">
                  <GithubLogo size={18} weight="bold" /> Sign In with GitHub
                </a>
              )}
            </div>
          </div>
          <div className="exam-facts">
            <span className="facts-caption">ASSESSMENT OVERVIEW</span>
            <div className="big-number">
              2<span>tracks</span>
            </div>
            <div className="facts-bottom">
              <span>
                <Exam size={17} /> 65Q Theory (90m)
              </span>
              <span>
                <Database size={17} /> 8Q Coding (30m)
              </span>
            </div>
            <div className="facts-rule" />
            <p>
              Automated Scoring • Rubric Evaluation • Downloadable PDF Report Cards
            </p>
          </div>
        </section>

        {/* Personal Progress (Shown ONLY after the user signs in) */}
        {user ? (
          <section className="stats-strip" aria-label="Your personal progress">
            <div>
              <span>YOUR ATTEMPTS</span>
              <strong>
                {loading ? "..." : attempts.length.toString().padStart(2, "0")}
              </strong>
            </div>
            <div>
              <span>COMPLETED</span>
              <strong>
                {loading ? "..." : finished.length.toString().padStart(2, "0")}
              </strong>
            </div>
            <div>
              <span>BEST REVIEWED SCORE</span>
              <strong>
                {best === null ? "Not yet" : `${best}%`}
                <small>
                  {best === null
                    ? "Finish your first exam"
                    : "Includes rubric evaluations"}
                </small>
              </strong>
            </div>
            <a href="/reports" className="stats-report-link">
              View report cards <ArrowUpRight size={20} />
            </a>
          </section>
        ) : (
          <div className="guest-progress-banner">
            <div className="guest-progress-text">
              <ShieldCheck size={28} />
              <div>
                <strong>Candidate Progress Tracking</strong>
                <p>
                  Sign in with GitHub to securely save your exam attempts, answers, and report cards.
                </p>
              </div>
            </div>
            <a href="/login" className="guest-signin-btn">
              <GithubLogo size={18} weight="bold" />
              <span>Sign In with GitHub</span>
            </a>
          </div>
        )}

        {error && <ErrorBox message={error} retry={() => void history()} />}

        {/* Active Exam Resume Banner */}
        {active && (
          <div className="resume-banner">
            <div>
              <strong>An examination attempt is currently in progress</strong>
              <p>
                {active.answered} of 65 questions answered. Your allocated timer is actively running.
              </p>
            </div>
            <a href={attemptUrl(active.id, active.status)}>
              Resume Attempt <ArrowRight size={18} />
            </a>
          </div>
        )}

        {/* Two Clearly Separated Exam Cards */}
        <section className="exam-selection-section" id="available-exams">
          <div className="section-heading">
            <span className="eyebrow">CHOOSE YOUR TRACK</span>
            <h2>Standardized Examinations</h2>
            <p className="muted">
              Select an examination track below to begin your timed assessment.
            </p>
          </div>

          <div className="exam-cards-grid">
            {/* Card A: Theory Examination */}
            <div className="exam-card exam-card-theory">
              <div className="exam-card-header">
                <span className="exam-card-badge badge-theory">THEORY ASSESSMENT</span>
                <span className="exam-card-timer-chip">
                  <Clock size={16} /> 90 Minutes
                </span>
              </div>

              <div className="exam-card-body">
                <h3>Theory Examination</h3>
                <p className="exam-card-desc">
                  Rigorous evaluation of relational database architecture, schema normalization,
                  constraints, commands, problem identification, and data type selection.
                </p>

                <div className="exam-card-metrics">
                  <div className="metric-box">
                    <span>QUESTIONS</span>
                    <strong>65 Questions</strong>
                  </div>
                  <div className="metric-box">
                    <span>DURATION</span>
                    <strong>90 Minutes</strong>
                  </div>
                  <div className="metric-box">
                    <span>TOTAL MARKS</span>
                    <strong>100 Marks</strong>
                  </div>
                  <div className="metric-box">
                    <span>SCORING TYPE</span>
                    <strong>Auto + Rubric</strong>
                  </div>
                </div>

                <div className="exam-card-topics">
                  <strong>Assessed Topics:</strong>
                  <p>
                    Data Types • Primary &amp; Foreign Keys • Constraints • SQL DDL / DML / DCL / TCL • Problem Identification • Table Architecture
                  </p>
                </div>
              </div>

              <div className="exam-card-footer">
                <a href="#theory-registration" className="exam-card-btn btn-primary">
                  Start Theory Exam <ArrowRight size={18} />
                </a>
              </div>
            </div>

            {/* Card B: SQL Coding Assessment */}
            <div className="exam-card exam-card-coding">
              <div className="exam-card-header">
                <span className="exam-card-badge badge-coding">PRACTICAL CODING</span>
                <span className="exam-card-timer-chip">
                  <Clock size={16} /> 30 Minutes
                </span>
              </div>

              <div className="exam-card-body">
                <h3>SQL Coding Assessment</h3>
                <p className="exam-card-desc">
                  Hands-on query writing assessment executed directly inside an isolated database sandbox.
                  Write queries and verify output tables against automated test cases.
                </p>

                <div className="exam-card-metrics">
                  <div className="metric-box">
                    <span>QUESTIONS</span>
                    <strong>8 Problems</strong>
                  </div>
                  <div className="metric-box">
                    <span>DURATION</span>
                    <strong>30 Minutes</strong>
                  </div>
                  <div className="metric-box">
                    <span>TOTAL MARKS</span>
                    <strong>100 Marks</strong>
                  </div>
                  <div className="metric-box">
                    <span>SCORING TYPE</span>
                    <strong>Live Test Engine</strong>
                  </div>
                </div>

                <div className="exam-card-topics">
                  <strong>Assessed Topics:</strong>
                  <p>
                    SELECT &amp; Filters • INNER / LEFT JOINs • GROUP BY &amp; HAVING • Aggregations • Subqueries • INSERT / UPDATE Modifications
                  </p>
                </div>
              </div>

              <div className="exam-card-footer">
                <a href="/sql-exam" className="exam-card-btn btn-coding">
                  Start Coding Assessment <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Public Community Learners Section */}
        <section className="learners-section" id="community-learners">
          <div className="section-heading">
            <span className="eyebrow">COMMUNITY DIRECTORY</span>
            <h2>Community Learners</h2>
            <p className="muted">
              Meet candidates and engineers building verifiable SQL mastery. Only candidates who enable
              public profile visibility are displayed.
            </p>
          </div>

          {/* Profile Visibility Setting (Signed-in candidates) */}
          {user ? (
            <div className="learners-setting-box" aria-label="Profile visibility settings">
              <div className="learners-setting-info">
                <div className="learners-setting-icon">
                  {isPublic ? <Eye size={24} weight="bold" /> : <EyeSlash size={24} weight="bold" />}
                </div>
                <div className="learners-setting-text">
                  <strong>Show my profile publicly</strong>
                  <p>
                    Allow other community members and visitors to view your GitHub avatar, username, display name,
                    completed exams count, best score, earned badges, and join date.
                  </p>
                  <small>
                    Privacy Guarantee: Internal User ID, email, phone number, OAuth tokens, exam answers,
                    and private report cards remain 100% hidden and protected by Supabase RLS.
                  </small>
                  {visibilityFeedback && (
                    <div style={{ marginTop: "8px", fontWeight: 500, color: "var(--accent)" }}>
                      {visibilityFeedback}
                    </div>
                  )}
                </div>
              </div>

              <div className="visibility-toggle-control">
                <span className={`visibility-toggle-status ${isPublic ? "is-public" : "is-private"}`}>
                  {isPublic ? "Public" : "Private (Default)"}
                </span>
                <label className="visibility-toggle-switch" aria-label="Toggle public profile visibility">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    disabled={isUpdatingVisibility}
                    onChange={() => void handleToggleVisibility()}
                  />
                  <span className="visibility-toggle-slider" />
                </label>
              </div>
            </div>
          ) : (
            <div className="guest-progress-banner" style={{ marginBottom: "28px" }}>
              <div className="guest-progress-text">
                <ShieldCheck size={28} />
                <div>
                  <strong>Showcase Your Assessment Success</strong>
                  <p>
                    Sign in with GitHub and complete an assessment to feature on the public directory.
                    Public visibility is completely optional and disabled by default.
                  </p>
                </div>
              </div>
              <a href="/login" className="guest-signin-btn">
                <GithubLogo size={18} weight="bold" />
                <span>Sign In with GitHub</span>
              </a>
            </div>
          )}

          {/* Search bar & Directory Link */}
          <div className="learners-filter-bar">
            <div className="learners-search-wrapper">
              <MagnifyingGlass size={18} className="learners-search-icon" />
              <input
                type="search"
                className="learners-search-input"
                placeholder="Search learners by GitHub username or name..."
                value={learnersSearch}
                onChange={(e) => {
                  setLearnersSearch(e.target.value);
                  setVisibleCount(3);
                }}
                aria-label="Search community learners"
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span className="learners-count-badge">
                {learnersLoading
                  ? "Loading..."
                  : `${
                      communityLearners.filter(
                        (l) =>
                          !learnersSearch.trim() ||
                          l.github_username.toLowerCase().includes(learnersSearch.toLowerCase().trim()) ||
                          l.display_name.toLowerCase().includes(learnersSearch.toLowerCase().trim())
                      ).length
                    } Public Learners`}
              </span>
              <a href="/learners" className="stats-report-link" style={{ fontSize: "13px" }}>
                View Full Directory <ArrowUpRight size={16} />
              </a>
            </div>
          </div>

          {/* Cards Grid */}
          {learnersLoading && communityLearners.length === 0 ? (
            <div className="loading-surface">
              <p>Loading community learners...</p>
              <div />
              <div />
            </div>
          ) : (
            (() => {
              const filtered = communityLearners.filter(
                (l) =>
                  !learnersSearch.trim() ||
                  l.github_username.toLowerCase().includes(learnersSearch.toLowerCase().trim()) ||
                  l.display_name.toLowerCase().includes(learnersSearch.toLowerCase().trim())
              );

              if (filtered.length === 0) {
                return (
                  <div className="learners-empty-state">
                    <Users size={40} weight="light" />
                    <h3>No public learners found</h3>
                    <p>
                      {learnersSearch
                        ? `No learners found matching "${learnersSearch}".`
                        : "No community learners have enabled public visibility yet."}
                    </p>
                    {learnersSearch && (
                      <button
                        type="button"
                        className="learners-page-btn"
                        onClick={() => setLearnersSearch("")}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <>
                  <div className="learners-grid">
                    {filtered.slice(0, visibleCount).map((learner) => (
                      <LearnerCard key={learner.github_username} learner={learner} />
                    ))}
                  </div>
                  {visibleCount < filtered.length && (
                    <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "16px" }}>
                      <button
                        type="button"
                        className="learners-page-btn"
                        onClick={() => setVisibleCount((c) => c + 3)}
                      >
                        Load More Learners ({filtered.length - visibleCount} remaining)
                      </button>
                      <a href="/learners" className="learners-page-btn">
                        View All in Directory →
                      </a>
                    </div>
                  )}
                </>
              );
            })()
          )}
        </section>

        {/* Simple "How It Works" Section */}
        <section className="how-it-works-section">
          <div className="section-heading">
            <span className="eyebrow">ASSESSMENT WORKFLOW</span>
            <h2>How It Works</h2>
            <p className="muted">
              A transparent, structured four-step journey from authentication to verified scorecards.
            </p>
          </div>

          <div className="how-it-works-grid">
            <div className="how-it-works-step">
              <div className="step-number">01</div>
              <div className="step-icon-box">
                <GithubLogo size={24} weight="bold" />
              </div>
              <h4>Sign In</h4>
              <p>
                Sign in with GitHub to securely save your exam attempts, answers, and report cards.
              </p>
            </div>

            <div className="how-it-works-step">
              <div className="step-number">02</div>
              <div className="step-icon-box">
                <Exam size={24} weight="duotone" />
              </div>
              <h4>Choose Exam</h4>
              <p>
                Select either the 65-question Theory Examination or the 30-minute practical SQL Live Coding Assessment.
              </p>
            </div>

            <div className="how-it-works-step">
              <div className="step-number">03</div>
              <div className="step-icon-box">
                <Clock size={24} weight="duotone" />
              </div>
              <h4>Complete Assessment</h4>
              <p>
                Work independently against a live countdown timer with automated background auto-saving.
              </p>
            </div>

            <div className="how-it-works-step">
              <div className="step-number">04</div>
              <div className="step-icon-box">
                <FileText size={24} weight="duotone" />
              </div>
              <h4>View Report Card</h4>
              <p>
                Inspect objective score breakdowns, rubric evaluations, diagnostic reflections, and downloadable PDF report cards.
              </p>
            </div>
          </div>
        </section>

        {/* Theory Examination Registration Panel */}
        <section className="assessment-layout" id="theory-registration">
          <div className="section-outline">
            <span className="eyebrow">CURRICULUM ARCHITECTURE</span>
            <h2>Theory Exam Structure</h2>
            <p className="muted">
              Seven distinct sections structured from core conceptual recall to advanced architectural decisions.
            </p>
            <div className="outline-table">
              {SECTION_DEFINITIONS.map((s) => (
                <div className="outline-row" key={s.code}>
                  <span className="section-letter">{s.code}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <small>Questions {s.range}</small>
                  </div>
                  <span className="mono">
                    {s.marks}
                    <small> marks</small>
                  </span>
                </div>
              ))}
            </div>
            <p className="small muted">
              Sections A–D: 50 marks auto-graded upon submission.
              <br />
              Sections E–G: 50 marks evaluated against verified rubrics.
            </p>
          </div>

          <div className="start-panel" id="begin">
            <span className="panel-kicker">
              <CheckCircle size={18} /> READY WHEN YOU ARE
            </span>
            <h2>Theory Exam Registration</h2>
            <p className="muted">
              Enter your candidate details to initialize your official scorecard.
            </p>
            <form onSubmit={startTheoryExam}>
              <label htmlFor="name">
                Full Name on Report Card <span aria-hidden="true">*</span>
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
              />
              <div className="form-pair">
                <div>
                  <label htmlFor="student-id">
                    Student / Candidate ID <small>optional</small>
                  </label>
                  <input
                    id="student-id"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    maxLength={40}
                    placeholder="e.g. AGX-2026-904"
                  />
                </div>
                <div>
                  <label htmlFor="cohort">
                    Class / Batch <small>optional</small>
                  </label>
                  <input
                    id="cohort"
                    value={cohort}
                    onChange={(e) => setCohort(e.target.value)}
                    maxLength={80}
                    placeholder="e.g. Cohort Alpha 2026"
                  />
                </div>
              </div>

              <div className="rules-box">
                <LockKey size={20} />
                <div>
                  <strong>Examination Code of Conduct</strong>
                  <p>
                    Work independently. No unauthorized aids or generative AI tools. Timer runs continuously once started.
                  </p>
                </div>
              </div>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  required
                />
                <span>
                  I agree to the assessment code of conduct and the 90-minute time limit.
                </span>
              </label>

              <button
                type="submit"
                className="start-exam"
                disabled={busy || !accepted}
              >
                <span>{busy ? "Initializing Exam Session..." : "Start 90-Min Theory Exam"}</span>
                <ArrowRight size={20} />
              </button>
              <p className="form-footnote">
                Passing standard: 50 / 100 marks. Downloadable PDF report cards are generated immediately upon submission.
              </p>
            </form>
          </div>
        </section>

        {/* Syllabus Section */}
        <section className="syllabus-section">
          <div className="section-heading">
            <span className="eyebrow">CORE COMPETENCIES</span>
            <h2>Four Pillars of Relational Engineering</h2>
            <p className="muted">
              Comprehensive reference foundations tested across both assessment tracks.
            </p>
          </div>
          <div className="syllabus-grid">
            {SYLLABUS.map((topic, i) => (
              <details className="topic" key={topic.title}>
                <summary>
                  {icons[i]}
                  <span>{topic.title}</span>
                  <span className="expand">+</span>
                </summary>
                <p>{topic.body}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Recent Attempts (Signed-in candidates only) */}
        {finished.length > 0 && (
          <section className="recent">
            <h2>Your Recent Submissions</h2>
            {finished.slice(0, 3).map((a) => (
              <a href={attemptUrl(a.id, a.status)} className="history-row" key={a.id}>
                <FileText size={23} />
                <div>
                  <strong>{a.name}</strong>
                  <small>
                    {dateLabel(a.startedAt)} · Theory Examination
                  </small>
                </div>
                <span>
                  {a.pending > 0
                    ? "Awaiting Manual Review"
                    : `${a.automatic + a.written} / 100`}
                </span>
                <ArrowUpRight size={19} />
              </a>
            ))}
          </section>
        )}

        {/* Footer Security Note */}
        <div className="privacy-note">
          <LockKey size={17} />
          <p>
            Sign in with GitHub to securely save your exam attempts, answers, and report cards.
            Downloadable PDF report cards are generated upon completion.
          </p>
        </div>
      </main>
    </Shell>
  );
}
