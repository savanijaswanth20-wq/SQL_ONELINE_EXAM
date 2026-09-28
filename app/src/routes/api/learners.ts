import { createFileRoute } from "@tanstack/react-router";
import { handleLearners } from "@/lib/learners.server";

export const Route = createFileRoute("/api/learners")({
  server: {
    handlers: {
      GET: ({ request }) => handleLearners(request),
      POST: ({ request }) => handleLearners(request),
    },
  },
});
