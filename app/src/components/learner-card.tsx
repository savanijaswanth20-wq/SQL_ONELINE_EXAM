import { useState } from "react";
import {
  GithubLogo,
  CalendarBlank,
  Exam,
  Trophy,
  Sparkle,
} from "@phosphor-icons/react";
import type { PublicLearner } from "@/lib/supabase";

export function LearnerCard({ learner }: { learner: PublicLearner }) {
  const [imgError, setImgError] = useState(false);

  const initial = (learner.display_name || learner.github_username || "L")
    .charAt(0)
    .toUpperCase();

  return (
    <article className="learner-card" aria-label={`Public profile for ${learner.display_name}`}>
      <div className="learner-card-header">
        {learner.avatar_url && !imgError ? (
          <img
            src={learner.avatar_url}
            alt={learner.display_name}
            className="learner-avatar-img"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="learner-avatar-initial" aria-hidden="true">
            {initial}
          </div>
        )}

        <div className="learner-meta-header">
          <h3 className="learner-display-name" title={learner.display_name}>
            {learner.display_name}
          </h3>
          <a
            href={`https://github.com/${learner.github_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="learner-github-link"
            title={`View @${learner.github_username} on GitHub`}
          >
            <GithubLogo size={14} weight="bold" />
            <span>@{learner.github_username}</span>
          </a>
          <div className="learner-joined-date">
            <CalendarBlank size={12} />
            <span>{learner.joined_at}</span>
          </div>
        </div>
      </div>

      <div className="learner-stats-strip">
        <div className="learner-stat-item">
          <span className="learner-stat-label">
            <Exam size={12} /> Exams Completed
          </span>
          <strong className="learner-stat-val">
            {learner.exams_completed}
          </strong>
        </div>
        <div className="learner-stat-item">
          <span className="learner-stat-label">
            <Trophy size={12} /> Best Score
          </span>
          <strong className="learner-stat-val score-val">
            {learner.best_score > 0 ? `${learner.best_score}%` : "Enrolled"}
          </strong>
        </div>
      </div>

      <div className="learner-badges-wrap" aria-label="Earned Badges">
        {learner.badges.map((badge) => {
          let badgeClass = "learner-badge-pill";
          if (badge.toLowerCase().includes("top") || badge.toLowerCase().includes("elite")) {
            badgeClass += " badge-top";
          } else if (badge.toLowerCase().includes("multi")) {
            badgeClass += " badge-multi";
          } else if (badge.toLowerCase().includes("cert") || badge.toLowerCase().includes("pass")) {
            badgeClass += " badge-cert";
          }
          return (
            <span key={badge} className={badgeClass}>
              <Sparkle size={10} weight="fill" />
              {badge}
            </span>
          );
        })}
      </div>
    </article>
  );
}
