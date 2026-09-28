import { createFileRoute } from "@tanstack/react-router";
import { handleSqlMcqExam } from "@/lib/sql-mcq.server";

export const Route = createFileRoute("/api/sql-mcq-exam")({
  server: {
    handlers: {
      GET: ({ request }) => handleSqlMcqExam(request),
      POST: ({ request }) => handleSqlMcqExam(request),
    },
  },
});
