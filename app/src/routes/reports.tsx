import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  DownloadSimple,
  Printer,
  FileText,
  CheckCircle,
  Target,
  ArrowCounterClockwise,
  BookOpen,
  WarningCircle,
  Clock,
  Sparkle,
  HourglassMedium,
} from "@phosphor-icons/react";
import { Shell, ErrorBox, Loading, useQueryId } from "@/components/exam-shell";
import { api, attemptUrl, dateLabel, durationLabel } from "@/lib/exam-client";
import { REFLECTIONS, SECTION_DEFINITIONS } from "@/lib/exam-types";
import type { Attempt, ExamPayload, Question } from "@/lib/exam-types";
import { ProtectedRoute } from "@/components/protected-route";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Report Cards | Algonex Exam Studio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://algonexexam.savanijaswanth20.workers.dev/reports",
      },
    ],
  }),
  component: ReportsWrapper,
});

function ReportsWrapper() {
  return (
    <ProtectedRoute>
      <Reports />
    </ProtectedRoute>
  );
}

function answerText(q: Question, value: string) {
  if (!value.trim()) return "Not answered";
  if (q.kind === "mcq" || q.kind === "match") {
    const text = q.options?.[value.charCodeAt(0) - 65];
    return text ? value + ". " + text : value;
  }
  return value;
}

function Reports() {
  const id = useQueryId();
  const [data, setData] = useState<ExamPayload | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [section, setSection] = useState("all");
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const load = useCallback(async () => {
    if (id === null) return;
    setLoading(true);
    setError("");
    try {
      if (id) {
        const result = await api<ExamPayload>(undefined, id);
        if (result.attempt.status === "active") {
          window.location.replace(attemptUrl(id, "active"));
          return;
        }
        setData(result);
      } else {
        const result = await api<{ attempts: Attempt[] }>();
        setAttempts(result.attempts);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function update(body: unknown) {
    setBusy(true);
    setError("");
    try {
      setData(await api<ExamPayload>(body));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!data) return;
    setPdfBusy(true);
    try {
      const { buildReportPdf } = await import("@/lib/report-pdf");
      const doc = await buildReportPdf(data);
      doc.save(
        "Algonex-Report-" +
          data.attempt.name.replace(/[^a-z0-9]+/gi, "-") +
          "-" +
          data.attempt.id.slice(0, 8) +
          ".pdf"
      );
    } catch {
      setError("The PDF could not be created. Try Print / Save PDF instead.");
    } finally {
      setPdfBusy(false);
    }
  }

  const r = data?.report;
  const a = data?.attempt;

  const reviewQuestions =
    data?.questions.filter(
      (q) =>
        (section === "all" || q.section === section) &&
        (filter === "all" ||
          (filter === "missed" &&
            (data.feedback?.[q.id].mark ?? q.points) < q.points) ||
          (filter === "pending" && data.feedback?.[q.id].mark === null) ||
          (filter === "flagged" && data.answers[q.id]?.flagged))
    ) ?? [];

  const weak =
    r?.topics
      .filter((t) => !t.pending && t.score < t.max)
      .sort((a, b) => a.score / a.max - b.score / b.max) ?? [];

  return (
    <Shell active="reports">
      <main className="report-page content-wrap">
        {loading ? (
          <Loading label="Loading your assessment records" />
        ) : (
          <>
            {error && <ErrorBox message={error} retry={() => void load()} />}

            {!data ? (
              <>
                <div className="page-title">
                  <span className="eyebrow">YOUR LEARNING RECORD</span>
                  <h1>Candidate Report Cards</h1>
                  <p>
                    Track submitted attempts, review score breakdowns, and download verified PDF report cards.
                  </p>
                </div>
                {attempts.length ? (
                  <div className="history-list">
                    {attempts.map((att) => (
                      <a
                        className="history-row"
                        href={attemptUrl(att.id, att.status)}
                        key={att.id}
                      >
                        <FileText size={27} />
                        <div>
                          <strong>{att.name}</strong>
                          <small>
                            {dateLabel(att.startedAt)} · {att.answered} / 65 answered · Theory Examination
                          </small>
                        </div>
                        <span
                          className={
                            att.pending > 0 ? "status-awaiting-badge" : "status-score-badge"
                          }
                        >
                          {att.status === "active"
                            ? "Continue exam"
                            : att.pending > 0
                            ? "Awaiting Manual Review"
                            : `${att.automatic + att.written} / 100`}
                        </span>
                        <ArrowUpRight size={21} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FileText size={48} />
                    <h2>No report cards yet.</h2>
                    <p>
                      Complete your first assessment to generate an in-depth scorecard with topic analysis and downloadable PDF report cards.
                    </p>
                    <a href="/#theory-registration">
                      Start an assessment <ArrowRight size={18} />
                    </a>
                  </div>
                )}
              </>
            ) : (
              r &&
              a && (
                <>
                  <div className="report-heading">
                    <div>
                      <span className="eyebrow">ALGONEX EXAM STUDIO SCORECARD</span>
                      <h1>Assessment Result Dashboard</h1>
                      <div className="exam-type-pill">
                        <strong>Exam Type:</strong> MySQL Core Concepts (Theory Examination • 65 Questions • 90 Mins)
                      </div>
                      <p>
                        {r.pending > 0
                          ? "Your automated score is compiled. Written responses are awaiting manual review to determine your final cumulative grade."
                          : "Assessment complete. Detailed topic performance, rubric feedback, and downloadable PDF report cards are ready."}
                      </p>
                    </div>
                    <div className="report-actions no-print">
                      <button
                        className="download-report"
                        onClick={() => void download()}
                        disabled={pdfBusy}
                        type="button"
                      >
                        <DownloadSimple size={20} />
                        {pdfBusy ? "Creating PDF..." : "Download PDF Report"}
                      </button>
                      <button
                        className="print-report"
                        onClick={() => window.print()}
                        type="button"
                      >
                        <Printer size={19} />
                        Print / Save PDF
                      </button>
                    </div>
                  </div>

                  <section className="result-card">
                    <div className="result-identity">
                      <div>
                        <strong>{a.name}</strong>
                        <span>
                          {[a.studentId, a.cohort].filter(Boolean).join(" · ") ||
                            "Candidate Assessment Record"}
                        </span>
                      </div>
                      <div>
                        <span>Exam Date: {dateLabel(a.startedAt)}</span>
                        <span>
                          Time Taken: {durationLabel(a.startedAt, a.submittedAt ?? a.startedAt)} ·{" "}
                          {r.answered} / 65 Questions Answered
                        </span>
                      </div>
                    </div>

                    <div className="result-main">
                      <div className="score-display">
                        <div
                          className="score-ring"
                          style={
                            {
                              "--score": `${
                                ((r.total ?? r.automatic) /
                                  (r.total === null ? 50 : 100)) *
                                100
                              }%`,
                            } as React.CSSProperties
                          }
                        >
                          <div>
                            <strong>{r.total ?? r.automatic}</strong>
                            <span>out of {r.total === null ? 50 : 100}</span>
                          </div>
                        </div>
                        <div className="score-caption">
                          <h2>
                            {r.pending > 0
                              ? "Awaiting Manual Review"
                              : r.passed
                              ? "Proficient • Passed"
                              : "Needs Further Practice"}
                          </h2>
                          <p>
                            {r.pending > 0
                              ? "Overall final grade pending manual evaluation"
                              : `Grade: ${r.grade} · Percentage: ${r.percentage}% · Status: ${
                                  r.passed ? "PASS" : "NEEDS PRACTICE"
                                }`}
                          </p>
                          <span
                            className={
                              r.pending > 0
                                ? "status-label status-awaiting-pill"
                                : "status-label"
                            }
                          >
                            {r.pending > 0
                              ? "Awaiting Manual Review"
                              : "Verified Scorecard"}
                          </span>
                        </div>
                      </div>

                      <div className="score-breakdown">
                        <div>
                          <span>Automated Evaluation</span>
                          <strong>
                            {r.automatic}
                            <small>/ 50 marks</small>
                          </strong>
                        </div>
                        <div>
                          <span>Written Response Review</span>
                          <strong>
                            {r.written}
                            <small>
                              / 50 marks {r.pending > 0 ? "(Review in progress)" : ""}
                            </small>
                          </strong>
                        </div>
                        <div>
                          <span>Cumulative Final Score</span>
                          <strong>
                            {r.total === null
                              ? "Awaiting Manual Review"
                              : `${r.total} / 100 marks`}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="result-footnote">
                      <WarningCircle size={17} />
                      <p>
                        {r.pending > 0
                          ? `${r.pending} written answers are awaiting manual evaluation. Unanswered questions receive zero marks. Once evaluated, your final composite score updates instantly.`
                          : "Written responses have been reviewed against the assessment rubric. Blank questions receive zero marks; no negative marking."}
                      </p>
                    </div>
                  </section>

                  {r.pending > 0 && (
                    <a
                      href="#answer-review"
                      className="review-callout no-print"
                      onClick={() => {
                        setFilter("pending");
                        setSection("all");
                      }}
                    >
                      <BookOpen size={24} />
                      <div>
                        <strong>Complete Written Self-Evaluation</strong>
                        <span>
                          Compare your answers with the model answers and assign marks using the structured rubric.
                        </span>
                      </div>
                      <ArrowRight size={22} />
                    </a>
                  )}

                  <div className="report-analysis">
                    <section className="section-results">
                      <h2>Section-Wise Performance</h2>
                      <div className="results-table">
                        {r.sections.map((s) => (
                          <div className="result-row" key={s.code}>
                            <span className="section-letter">{s.code}</span>
                            <div>
                              <strong>{s.title}</strong>
                              <div className="thin-bar">
                                <span
                                  style={{
                                    width: `${(s.score / s.max) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div>
                              <strong className="mono">
                                {s.score} / {s.max}
                              </strong>
                              <small>
                                {s.pending > 0
                                  ? `${s.pending} Awaiting Review`
                                  : s.code < "E"
                                  ? "Automated"
                                  : "Reviewed"}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="topic-results">
                      <Target size={29} />
                      <h2>Topic Mastery & Priorities</h2>
                      {weak.length ? (
                        <p>
                          Focus improvement on <strong>{weak[0].topic.toLowerCase()}</strong>, your lowest scored topic area.
                        </p>
                      ) : (
                        <p>
                          {r.pending > 0
                            ? "Complete the manual review for a complete picture of topic strengths."
                            : "Target performance achieved across all assessed core competencies."}
                        </p>
                      )}

                      {r.topics.map((t) => (
                        <div className="topic-score" key={t.topic}>
                          <div>
                            <span>{t.topic}</span>
                            <strong>
                              {t.score} / {t.max}
                              {t.pending > 0 ? " *" : ""}
                            </strong>
                          </div>
                          <div className="thin-bar">
                            <span style={{ width: `${(t.score / t.max) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                      {r.pending > 0 && (
                        <small className="muted">
                          * Topic scores pending final resolution of written answers.
                        </small>
                      )}

                      <div className="grade-key">
                        <strong>Algonex Certification Scale</strong>
                        <span>A+ (90+) · A (80+) · B (70+) · C (60+) · D (50+)</span>
                        <small>Minimum Passing Requirement: 50 / 100</small>
                      </div>
                    </section>
                  </div>

                  <section className="reflection-summary">
                    <div>
                      <h2>Diagnostic Error Reflections</h2>
                      <p>Understand the root cause behind missed questions to accelerate learning.</p>
                    </div>
                    <div className="reflection-grid">
                      {Object.entries(REFLECTIONS).map(([key, label]) => (
                        <div key={key}>
                          <span>{key}</span>
                          <strong>
                            {
                              Object.values(data.answers).filter(
                                (ans) => ans.reflection === key
                              ).length
                            }
                          </strong>
                          <p>{label}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section id="answer-review" className="answer-review">
                    <div className="review-heading">
                      <div>
                        <h2>Detailed Question &amp; Answer Review</h2>
                        <p>
                          Inspect model answers, rationale, rubrics, and diagnostic explanations for each question.
                        </p>
                      </div>
                      <div className="review-filters no-print">
                        <label>
                          Filter Questions
                          <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                          >
                            <option value="all">All Questions (65)</option>
                            <option value="missed">Marks Missed</option>
                            <option value="pending">Awaiting Manual Review</option>
                            <option value="flagged">Flagged During Exam</option>
                          </select>
                        </label>
                        <label>
                          Section
                          <select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                          >
                            <option value="all">All Sections (A-G)</option>
                            {SECTION_DEFINITIONS.map((s) => (
                              <option key={s.code} value={s.code}>
                                {s.code}. {s.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    <p className="small muted">
                      Displaying {reviewQuestions.length} questions
                    </p>
                    {reviewQuestions.length === 0 && (
                      <div className="empty-review">
                        <CheckCircle size={30} />
                        <p>No questions found matching your filter selection.</p>
                      </div>
                    )}

                    {reviewQuestions.map((q) => {
                      const answer = data.answers[q.id];
                      const feedback = data.feedback![q.id];
                      return (
                        <details key={q.id} className="review-item">
                          <summary>
                            <span className="mono">
                              Q{String(q.id).padStart(2, "0")}
                            </span>
                            <strong>{q.prompt}</strong>
                            <span
                              className={
                                feedback.mark === null
                                  ? "mark-pending status-awaiting-tag"
                                  : feedback.mark === q.points
                                  ? "mark-correct"
                                  : "mark-missed"
                              }
                            >
                              {feedback.mark === null
                                ? "Awaiting Review"
                                : `${feedback.mark} / ${q.points}`}
                            </span>
                          </summary>
                          <div className="review-content">
                            {q.code && <pre className="sql-code">{q.code}</pre>}
                            <div className="answer-comparison">
                              <div>
                                <h3>Your Submitted Answer</h3>
                                <pre>{answerText(q, answer?.value ?? "")}</pre>
                                {answer?.correction && (
                                  <>
                                    <h4>Your Correction Note</h4>
                                    <p>{answer.correction}</p>
                                  </>
                                )}
                              </div>
                              <div>
                                <h3>
                                  {q.kind === "written"
                                    ? "Reference Model Answer"
                                    : "Correct Answer"}
                                </h3>
                                <pre>{feedback.model}</pre>
                                {q.kind !== "written" && (
                                  <p>{feedback.explanation}</p>
                                )}
                              </div>
                            </div>

                            {q.kind === "written" && (
                              <div className="rubric">
                                <h3>Evaluation Rubric &amp; Marking Guide</h3>
                                <ul>
                                  {feedback.rubric.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                                {answer?.value.trim() ? (
                                  <label>
                                    Assign Evaluation Mark{" "}
                                    <select
                                      disabled={busy}
                                      value={answer.reviewMark ?? ""}
                                      onChange={(e) => {
                                        if (e.target.value !== "") {
                                          void update({
                                            action: "review",
                                            id: a.id,
                                            marks: [
                                              {
                                                id: q.id,
                                                mark: Number(e.target.value),
                                              },
                                            ],
                                          });
                                        }
                                      }}
                                    >
                                      <option value="">Select Score</option>
                                      {Array.from(
                                        { length: q.points + 1 },
                                        (_, idx) => (
                                          <option key={idx} value={idx}>
                                            {idx} / {q.points} Marks
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </label>
                                ) : (
                                  <p className="small">
                                    Unanswered: 0 marks. No manual evaluation required.
                                  </p>
                                )}
                              </div>
                            )}

                            <label className="reflection-select">
                              Diagnostic Reflection (Reason for error):
                              <select
                                disabled={busy}
                                value={answer?.reflection ?? ""}
                                onChange={(e) =>
                                  void update({
                                    action: "reflect",
                                    id: a.id,
                                    qid: q.id,
                                    reason: e.target.value,
                                  })
                                }
                              >
                                <option value="">Select diagnostic reason (optional)</option>
                                {Object.entries(REFLECTIONS).map(
                                  ([k, label]) => (
                                    <option key={k} value={k}>
                                      {k}. {label}
                                    </option>
                                  )
                                )}
                              </select>
                            </label>
                          </div>
                        </details>
                      );
                    })}
                  </section>

                  <section className="next-attempt no-print">
                    <div>
                      <h2>Ready for another attempt?</h2>
                      <p>
                        Review any conceptual gaps above, and retake the assessment to measure your growth.
                      </p>
                    </div>
                    <a href="/#theory-registration">
                      <ArrowCounterClockwise size={20} />
                      Take New Assessment
                    </a>
                  </section>

                  <div className="sources-note">
                    <h3>Assessment Standards &amp; Verification</h3>
                    <p>
                      Algonex IT Solutions Assessment Portal • Curriculum based on MySQL 8.4 LTS specifications.
                    </p>
                    <small>Attempt Verification ID: {a.id}</small>
                  </div>
                </>
              )
            )}
          </>
        )}
      </main>
    </Shell>
  );
}
