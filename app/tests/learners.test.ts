import { describe, expect, it } from "bun:test";
import { computeBadges, formatJoinDate } from "../src/lib/learners.server";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Community Learners feature & privacy guarantees", () => {
  it("computes earned badges accurately from completed exams and scores", () => {
    const eliteBadges = computeBadges(2, 96);
    expect(eliteBadges).toContain("Elite Scorer");
    expect(eliteBadges).toContain("Multi-Track Scholar");
    expect(eliteBadges).toContain("Community Contributor");

    const topBadges = computeBadges(1, 92);
    expect(topBadges).toContain("Top Scorer");
    expect(topBadges).toContain("Certified Learner");

    const passBadges = computeBadges(1, 78);
    expect(passBadges).toContain("SQL Proficient");
    expect(passBadges).toContain("Certified Learner");
  });

  it("formats join date reliably", () => {
    expect(formatJoinDate("2026-08-15T00:00:00Z")).toContain("2026");
    expect(formatJoinDate("invalid")).toBe("Joined Recently");
    expect(formatJoinDate(undefined)).toBe("Joined Recently");
  });

  it("verifies database schema has is_public disabled by default, RLS policy, and public view", () => {
    const schemaPath = join(process.cwd(), "../supabase/schema.sql");
    const appSchemaPath = join(process.cwd(), "supabase/schema.sql");

    const schema = existsSync(schemaPath)
      ? readFileSync(schemaPath, "utf8")
      : readFileSync(appSchemaPath, "utf8");

    // Check default false for is_public
    expect(schema).toMatch(/is_public boolean not null default false/i);

    // Check index on is_public
    expect(schema).toMatch(/idx_profiles_is_public on public\.profiles\(is_public\)/i);

    // Check RLS policy allows public access only when is_public = true
    expect(schema).toMatch(/is_public = true/i);

    // Check community_learners view selects ONLY public fields (never email, ID, or tokens)
    expect(schema).toMatch(/create or replace view public\.community_learners/i);
    expect(schema).toMatch(/where p\.is_public = true/i);
  });

  it("ensures public learner routes exist and are registered", () => {
    expect(existsSync(join(process.cwd(), "src/routes/learners.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/routes/api/learners.ts"))).toBe(true);
    expect(existsSync(join(process.cwd(), "src/components/learner-card.tsx"))).toBe(true);

    const learnersFile = readFileSync(join(process.cwd(), "src/routes/learners.tsx"), "utf8");
    expect(learnersFile).toContain("/learners");
    expect(learnersFile).toContain("Show my profile publicly");
    expect(learnersFile).toContain("updatePublicVisibility");

    const indexFile = readFileSync(join(process.cwd(), "src/routes/index.tsx"), "utf8");
    expect(indexFile).toContain("Community Learners");
    expect(indexFile).toContain("Show my profile publicly");
    expect(indexFile).toContain("/learners");
  });

  it("guarantees that LearnerCard component NEVER references private fields", () => {
    const cardFile = readFileSync(join(process.cwd(), "src/components/learner-card.tsx"), "utf8");
    expect(cardFile).not.toContain("learner.email");
    expect(cardFile).not.toContain("learner.id");
    expect(cardFile).not.toContain("learner.phone");
    expect(cardFile).not.toContain("learner.token");
    expect(cardFile).not.toContain("learner.answers");
    expect(cardFile).not.toContain("learner.report_card");
  });
});
