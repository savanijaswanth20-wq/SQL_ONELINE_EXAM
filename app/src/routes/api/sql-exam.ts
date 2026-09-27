import { createFileRoute } from "@tanstack/react-router";
import { handleSqlExam } from "@/lib/sql-exam.server";

export const Route = createFileRoute("/api/sql-exam")({
  server: {
    handlers: {
      GET: ({ request }) => handleSqlExam(request),
      POST: ({ request }) => handleSqlExam(request),
    },
  },
});
