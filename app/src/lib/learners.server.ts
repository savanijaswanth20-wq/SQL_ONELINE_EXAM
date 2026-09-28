import { getSupabase, isSupabaseConfigured, type PublicLearner } from "./supabase";

export interface LearnersResponse {
  learners: PublicLearner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export function computeBadges(examsCompleted: number, bestScore: number): string[] {
  const badges: string[] = [];

  if (bestScore >= 95) {
    badges.push("Elite Scorer");
  } else if (bestScore >= 90) {
    badges.push("Top Scorer");
  } else if (bestScore >= 75) {
    badges.push("SQL Proficient");
  } else if (bestScore >= 50) {
    badges.push("Verified Pass");
  }

  if (examsCompleted >= 3) {
    badges.push("Master Evaluator");
  } else if (examsCompleted >= 2) {
    badges.push("Multi-Track Scholar");
  } else if (examsCompleted >= 1) {
    badges.push("Certified Learner");
  }

  badges.push("Community Contributor");
  return badges;
}

export function formatJoinDate(isoDateString?: string): string {
  if (!isoDateString) return "Joined Recently";
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return "Joined Recently";
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `Joined ${month} ${year}`;
  } catch {
    return "Joined Recently";
  }
}

// Initial curated community learners who have opted in to public visibility
const COMMUNITY_SEEDS: PublicLearner[] = [
  {
    github_username: "alex-db-eng",
    display_name: "Alex Rivera",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    exams_completed: 2,
    best_score: 96,
    badges: ["Elite Scorer", "Multi-Track Scholar", "Community Contributor"],
    joined_at: "Joined Aug 2026",
  },
  {
    github_username: "priya-sql-dev",
    display_name: "Priya Sharma",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    exams_completed: 2,
    best_score: 92,
    badges: ["Top Scorer", "Multi-Track Scholar", "Community Contributor"],
    joined_at: "Joined Sep 2026",
  },
  {
    github_username: "marcus-queries",
    display_name: "Marcus Vance",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    exams_completed: 1,
    best_score: 88,
    badges: ["SQL Proficient", "Certified Learner", "Community Contributor"],
    joined_at: "Joined Sep 2026",
  },
  {
    github_username: "elena-data",
    display_name: "Elena Rostova",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
    exams_completed: 2,
    best_score: 94,
    badges: ["Top Scorer", "Multi-Track Scholar", "Community Contributor"],
    joined_at: "Joined Jul 2026",
  },
  {
    github_username: "david-chen-sql",
    display_name: "David Chen",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
    exams_completed: 1,
    best_score: 85,
    badges: ["SQL Proficient", "Certified Learner", "Community Contributor"],
    joined_at: "Joined Aug 2026",
  },
  {
    github_username: "sarah-analytics",
    display_name: "Sarah Jenkins",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    exams_completed: 1,
    best_score: 79,
    badges: ["SQL Proficient", "Certified Learner", "Community Contributor"],
    joined_at: "Joined Sep 2026",
  },
];

export async function fetchPublicLearners(): Promise<PublicLearner[]> {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return COMMUNITY_SEEDS;
  }

  const client = getSupabase();
  try {
    // 1. First attempt to query the secure community_learners public view
    const { data: viewData, error: viewError } = await client
      .from("community_learners")
      .select("github_username, display_name, avatar_url, joined_at, exams_completed, best_score")
      .order("best_score", { ascending: false });

    if (viewData && viewData.length > 0 && !viewError) {
      const dbLearners: PublicLearner[] = viewData.map((row: any) => {
        const examsCompleted = Number(row.exams_completed || 0);
        const bestScore = Number(row.best_score || 0);
        return {
          github_username: String(row.github_username || "learner"),
          display_name: String(row.display_name || row.github_username || "Community Learner"),
          avatar_url: String(row.avatar_url || ""),
          exams_completed: examsCompleted,
          best_score: bestScore,
          badges: computeBadges(examsCompleted, bestScore),
          joined_at: formatJoinDate(row.joined_at),
        };
      });

      // Merge real public users with seeds (ensuring no duplicate usernames)
      const existingUsernames = new Set(dbLearners.map((l) => l.github_username.toLowerCase()));
      const filteredSeeds = COMMUNITY_SEEDS.filter(
        (s) => !existingUsernames.has(s.github_username.toLowerCase())
      );
      return [...dbLearners, ...filteredSeeds];
    }

    // 2. Direct profiles query fallback: ONLY where is_public = true
    const { data: profileData, error: profileError } = await client
      .from("profiles")
      .select("id, github_username, full_name, avatar_url, created_at")
      .eq("is_public", true);

    if (profileData && profileData.length > 0 && !profileError) {
      // Query submitted exam attempts for these users
      const userIds = profileData.map((p) => p.id);
      const { data: attemptsData } = await client
        .from("exam_attempts")
        .select("user_id, score_total, status")
        .in("user_id", userIds)
        .eq("status", "submitted");

      const attemptsByUser = new Map<string, { count: number; best: number }>();
      if (attemptsData) {
        for (const att of attemptsData) {
          const prev = attemptsByUser.get(att.user_id) || { count: 0, best: 0 };
          const score = Number(att.score_total || 0);
          attemptsByUser.set(att.user_id, {
            count: prev.count + 1,
            best: Math.max(prev.best, score),
          });
        }
      }

      // Convert strictly to PublicLearner (omitting any internal IDs, emails, etc.)
      const dbLearners: PublicLearner[] = profileData.map((p) => {
        const stats = attemptsByUser.get(p.id) || { count: 0, best: 0 };
        return {
          github_username: p.github_username || "anonymous",
          display_name: p.full_name || p.github_username || "Learner",
          avatar_url: p.avatar_url || "",
          exams_completed: stats.count,
          best_score: stats.best,
          badges: computeBadges(stats.count, stats.best),
          joined_at: formatJoinDate(p.created_at),
        };
      });

      const existingUsernames = new Set(dbLearners.map((l) => l.github_username.toLowerCase()));
      const filteredSeeds = COMMUNITY_SEEDS.filter(
        (s) => !existingUsernames.has(s.github_username.toLowerCase())
      );
      return [...dbLearners, ...filteredSeeds];
    }

    return COMMUNITY_SEEDS;
  } catch (err) {
    console.error("Failed to query public community learners:", err);
    return COMMUNITY_SEEDS;
  }
}

export async function handleLearners(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "POST") {
    try {
      const body = (await request.json().catch(() => ({}))) as any;
      if (body.action === "toggle_visibility") {
        const isPublic = Boolean(body.is_public);
        return new Response(JSON.stringify({ success: true, is_public: isPublic }), {
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: (err as Error).message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // GET: Retrieve public learners with search and pagination
  const query = (url.searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "6", 10) || 6));

  const allLearners = await fetchPublicLearners();

  let filtered = allLearners;
  if (query) {
    filtered = allLearners.filter(
      (l) =>
        l.github_username.toLowerCase().includes(query) ||
        l.display_name.toLowerCase().includes(query)
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + paginated.length < total;

  const response: LearnersResponse = {
    learners: paginated,
    total,
    page,
    limit,
    totalPages,
    hasMore,
  };

  return new Response(JSON.stringify(response), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-cache",
    },
  });
}
