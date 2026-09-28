import type { ExamPayload } from "./exam-types";
import { REFLECTIONS } from "./exam-types";

export async function buildReportPdf(data: ExamPayload) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const r = data.report!;
  const a = data.attempt;

  // Blue, dark navy, and slate color system
  const ink = [15, 23, 42] as const; // Dark navy #0F172A
  const accent = [37, 99, 235] as const; // Primary blue #2563EB
  const muted = [71, 85, 105] as const; // Slate #475569

  const text = (
    value: string,
    x: number,
    y: number,
    size = 10,
    color: readonly [number, number, number] = ink,
    bold = false
  ) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(value, x, y);
  };

  const clean = (s: string) =>
    s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, " ");
  const short = (s: string, n = 80) => (s.length > n ? s.slice(0, n - 3) + "..." : s);

  // Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 297, "F");

  // Main Card
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 12, 186, 271, 4, 4, "F");

  // Header
  text("ALGONEX IT SOLUTIONS  |  EXAM PORTAL", 21, 26, 10, accent, true);
  text("Algonex Exam Studio Report Card", 21, 40, 21, ink, true);
  text(
    r.pending > 0
      ? "STATUS: AWAITING MANUAL REVIEW"
      : "STATUS: COMPLETED | FINAL SCORECARD",
    21,
    48,
    8,
    muted,
    true
  );

  // Candidate Details
  text(short(clean(a.name), 60), 21, 61, 14, ink, true);
  text("Student ID: " + (clean(a.studentId) || "Not supplied"), 21, 69, 9, muted);
  text("Class / Batch: " + short(clean(a.cohort) || "Not supplied", 58), 21, 76, 9, muted);

  text("Exam: MySQL Core Concepts (Theory)", 125, 61, 9, ink, true);
  text("Date: " + new Date(a.startedAt).toLocaleDateString("en-GB"), 125, 67, 9, muted);
  text(
    "Duration: " +
      Math.round(((a.submittedAt ?? a.startedAt) - a.startedAt) / 60000) +
      " / 90 min",
    125,
    73,
    9,
    muted
  );
  text("Answered: " + r.answered + " / 65 Questions", 125, 79, 9, muted);

  doc.setDrawColor(226, 232, 240);
  doc.line(21, 84, 189, 84);

  // Score Highlight
  text(
    r.total === null ? "PENDING" : r.total + " / 100",
    21,
    100,
    r.total === null ? 20 : 27,
    accent,
    true
  );
  text(
    r.total === null
      ? "Overall result: Awaiting Manual Review of written responses"
      : r.total + "%  |  Grade " + r.grade + "  |  " + (r.passed ? "PASS" : "NEEDS PRACTICE"),
    21,
    109,
    9,
    muted
  );

  text("Automatic Score: " + r.automatic + " / 50", 125, 94, 10, ink, true);
  text("Written Score: " + r.written + " / 50", 125, 102, 10, ink, true);
  text(
    r.pending > 0
      ? r.pending + " written answers awaiting manual review"
      : "All written evaluations completed",
    125,
    110,
    8,
    muted
  );

  // Section Table
  doc.setFillColor(241, 245, 249);
  doc.rect(21, 118, 168, 9, "F");
  text("SECTION", 24, 124, 8, muted, true);
  text("MARKS", 136, 124, 8, muted, true);
  text("EVALUATION STATUS", 155, 124, 8, muted, true);

  r.sections.forEach((s, i) => {
    const y = 135 + i * 9;
    text(s.code + "   " + s.title, 24, y, 10);
    text(s.score + " / " + s.max, 136, y, 10, ink, true);
    text(
      s.pending > 0 ? "Awaiting Review" : s.code < "E" ? "Automated" : "Reviewed",
      155,
      y,
      8,
      muted
    );
    doc.setDrawColor(241, 245, 249);
    doc.line(21, y + 3, 189, y + 3);
  });

  // Topic Analysis
  text("Curriculum Performance & Learning Priorities", 21, 205, 11, ink, true);
  const weak = r.topics.filter((t) => !t.pending && t.score < t.max).sort((a, b) => a.score / a.max - b.score / b.max);
  const priorities = weak.length
    ? weak.slice(0, 3).map((t) => t.topic + " (" + t.score + "/" + t.max + ")").join("  |  ")
    : r.pending > 0
    ? "Complete the manual review to reveal final topic mastery."
    : "All assessed topics achieved target proficiency. Continue practising structured explanations.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(doc.splitTextToSize(priorities, 165), 21, 213);

  const counts = Object.keys(REFLECTIONS)
    .map((key) => key + ": " + Object.values(data.answers).filter((a) => a.reflection === key).length)
    .join("   ");
  text("Diagnostic Reflection Counts: " + counts, 21, 230, 9, muted);
  const note = "A: Concept Gap  B: Wrong Data Type  C: Requirement Misunderstood  D: Syntax Error  E: Intuition Without Proof";
  text(note, 21, 237, 8, muted);

  doc.setFontSize(8);
  doc.text(
    doc.splitTextToSize(
      "Algonex Exam Studio certification standard: 50 marks are auto-graded; 50 marks follow structured rubric guidelines. Pass threshold: 50/100. Downloadable PDF report cards are generated securely from the Algonex assessment engine.",
      165
    ),
    21,
    248
  );
  text("Attempt Verification ID: " + a.id, 21, 269, 7, muted);

  doc.setProperties({
    title: "Algonex Exam Report Card - " + clean(a.name),
    subject: "Algonex IT Solutions Assessment Portal",
    creator: "Algonex Exam Studio",
  });
  return doc;
}
