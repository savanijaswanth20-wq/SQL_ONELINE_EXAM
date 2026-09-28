import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useTransition } from "react";
import {
  MagnifyingGlass,
  Users,
  ShieldCheck,
  GithubLogo,
  ArrowRight,
  Eye,
  EyeSlash,
  CaretLeft,
  CaretRight,
  Sparkle,
} from "@phosphor-icons/react";
import { Shell } from "@/components/exam-shell";
import { LearnerCard } from "@/components/learner-card";
import { useAuth } from "@/lib/auth-context";
import type { PublicLearner } from "@/lib/supabase";
import type { LearnersResponse } from "@/lib/learners.server";

export const Route = createFileRoute("/learners")({
  head: () => ({
    links: [
      {
        rel: "canonical",
        href: "https://algonexexam.savanijaswanth20.workers.dev/learners",
      },
    ],
    meta: [
      { title: "Community Learners | Algonex Exam Studio" },
      {
        name: "description",
        content:
          "Public directory and verifiable achievements of students and engineers participating in Algonex SQL Examinations.",
      },
      {
        property: "og:title",
        content: "Community Learners | Algonex Exam Studio",
      },
      {
        property: "og:description",
        content:
          "Discover certified SQL developers and data engineers. Opt-in public profiles displaying scores and earned badges.",
      },
    ],
  }),
  component: LearnersDirectoryPage,
});

function LearnersDirectoryPage() {
  const { user, profile, updatePublicVisibility } = useAuth();
  const [learners, setLearners] = useState<PublicLearner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [visibilityFeedback, setVisibilityFeedback] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const isPublic = Boolean(profile?.is_public);

  async function loadLearners(q: string, p: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("page", String(p));
      params.set("limit", "6");

      const res = await fetch(`/api/learners?${params.toString()}`);
      if (res.ok) {
        const data: LearnersResponse = await res.json();
        setLearners(data.learners);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch public learners:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      void loadLearners(searchQuery, page);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery, page]);

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
      // Reload learners list to reflect updated visibility
      void loadLearners(searchQuery, page);
    } else {
      setVisibilityFeedback("Failed to update visibility. Please try again.");
    }

    setIsUpdatingVisibility(false);
  }

  return (
    <Shell active="learners">
      <main className="content-wrap learners-section">
        <div className="learners-header-row">
          <div className="learners-header-copy">
            <span className="eyebrow">GLOBAL DIRECTORY • VERIFIED SKILLS</span>
            <h1>Community Learners</h1>
            <p>
              Discover developers, database engineers, and students who have publicly shared their SQL
              assessment accomplishments. Profiles display only verified credentials, scores, and earned badges.
            </p>
          </div>
        </div>

        {/* Profile Visibility Setting (Signed-in candidates) */}
        {user ? (
          <section className="learners-setting-box" aria-label="Profile visibility settings">
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
                  <div className="visibility-feedback-msg" style={{ marginTop: "8px", fontWeight: 500, color: "var(--accent)" }}>
                    {visibilityFeedback}
                  </div>
                )}
              </div>
            </div>

            <div className="visibility-toggle-control">
              <span
                className={`visibility-toggle-status ${
                  isPublic ? "is-public" : "is-private"
                }`}
              >
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
          </section>
        ) : (
          <div className="guest-progress-banner" style={{ marginBottom: "32px" }}>
            <div className="guest-progress-text">
              <ShieldCheck size={28} />
              <div>
                <strong>Join the Algonex Community Directory</strong>
                <p>
                  Sign in with GitHub to complete an examination and showcase your verifiable badges.
                  Public profile visibility is completely optional and disabled by default.
                </p>
              </div>
            </div>
            <a href="/login" className="guest-signin-btn">
              <GithubLogo size={18} weight="bold" />
              <span>Sign In with GitHub</span>
            </a>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="learners-filter-bar">
          <div className="learners-search-wrapper">
            <MagnifyingGlass size={18} className="learners-search-icon" />
            <input
              type="search"
              className="learners-search-input"
              placeholder="Search by GitHub username or display name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              aria-label="Search community learners"
            />
          </div>

          <div className="learners-count-badge">
            {loading ? "Searching..." : `Showing ${learners.length} of ${total} public learners`}
          </div>
        </div>

        {/* Learners Grid */}
        {loading && learners.length === 0 ? (
          <div className="loading-surface">
            <p>Loading community learners directory...</p>
            <div />
            <div />
            <div />
          </div>
        ) : learners.length > 0 ? (
          <div className="learners-grid">
            {learners.map((learner) => (
              <LearnerCard key={learner.github_username} learner={learner} />
            ))}
          </div>
        ) : (
          <div className="learners-empty-state">
            <Users size={48} weight="light" />
            <h3>No public learners found</h3>
            <p>
              {searchQuery
                ? `No community learners matched your search for "${searchQuery}".`
                : "No community learners have enabled public profile visibility yet."}
            </p>
            {searchQuery && (
              <button
                type="button"
                className="learners-page-btn"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="learners-pagination" aria-label="Learners directory pagination">
            <button
              type="button"
              className="learners-page-btn"
              disabled={page <= 1 || loading}
              onClick={() => {
                startTransition(() => {
                  setPage((p) => Math.max(1, p - 1));
                });
              }}
            >
              <CaretLeft size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
              Previous
            </button>
            <span className="learners-page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="learners-page-btn"
              disabled={page >= totalPages || loading}
              onClick={() => {
                startTransition(() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                });
              }}
            >
              Next
              <CaretRight size={14} style={{ display: "inline", verticalAlign: "middle", marginLeft: "4px" }} />
            </button>
          </nav>
        )}

        {/* Bottom Callout */}
        <section className="learners-cta-box">
          <div className="learners-cta-text">
            <h3>Ready to earn your community badge?</h3>
            <p>
              Take the 65-question Theory Examination or the 30-minute SQL Live Coding Assessment.
              Achieve verified proficiency and showcase your skills on your public profile.
            </p>
          </div>
          <a href="/#available-exams" className="learners-cta-btn">
            Explore Examinations <ArrowRight size={16} />
          </a>
        </section>
      </main>
    </Shell>
  );
}
