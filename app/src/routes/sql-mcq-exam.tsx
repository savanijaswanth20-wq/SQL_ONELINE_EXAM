import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Flag,
  CheckCircle,
  Clock,
  PaperPlaneTilt,
  FloppyDisk,
  Check,
  XCircle,
  WarningCircle,
  Trophy,
  GridFour,
  ArrowClockwise,
  BookOpen,
  Sparkle,
  CheckSquare,
} from "@phosphor-icons/react";
import { Shell, ErrorBox, Loading } from "@/components/exam-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { SQL_MCQ_EXAM_NAME, TOTAL_MCQ_MARKS } from "@/lib/sql-mcq-questions";
import type { SqlMcqAnswer, SqlMcqExamPayload, SqlMcqQuestion } from "@/lib/sql-mcq-types";

export const Route = createFileRoute("/sql-mcq-exam")({
  head: () => ({
    meta: [
      { title: "SQL MCQ Assessment — 45 Questions | MySQL Exam Studio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SqlMcqExamWrapper,
});

function SqlMcqExamWrapper() {
  return (
    <ProtectedRoute>
      <SqlMcqExamPage />
    </ProtectedRoute>
  );
}

// Client API Helper
async function mcqApi<T>(body?: unknown, id?: string): Promise<T> {
  const url = id ? `/api/sql-mcq-exam?id=${encodeURIComponent(id)}` : "/api/sql-mcq-exam";
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "An error occurred during the exam operation.");
  }
  return data as T;
}

function SqlMcqExamPage() {
  const [data, setData] = useState<SqlMcqExamPayload | null>(null);
  const [answers, setAnswers] = useState<Record<number, SqlMcqAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(2700); // 45 mins
  const [saveState, setSaveState] = useState("All changes saved");
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [showPaletteModal, setShowPaletteModal] = useState(false);

  const pendingSaves = useRef<Map<number, SqlMcqAnswer>>(new Map());
  const savingRef = useRef<Promise<void> | null>(null);
  const clockOffset = useRef(0);
  const isFinishing = useRef(false);

  // Load exam payload
  const loadExam = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const queryId = new URLSearchParams(window.location.search).get("id");
      const result = await mcqApi<SqlMcqExamPayload>(undefined, queryId ?? undefined);

      if (!result.attempt) {
        const startResult = await mcqApi<SqlMcqExamPayload>({ action: "start" });
        setData(startResult);
        setAnswers(startResult.answers);
        clockOffset.current = startResult.serverNow - Date.now();
        setRemainingSeconds(Math.max(0, Math.ceil((startResult.attempt.deadline - startResult.serverNow) / 1000)));
      } else {
        setData(result);
        setAnswers(result.answers);
        clockOffset.current = result.serverNow - Date.now();
        setRemainingSeconds(Math.max(0, Math.ceil((result.attempt.deadline - result.serverNow) / 1000)));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExam();
  }, [loadExam]);

  // Flush pending answer updates to server
  const flushAnswers = useCallback(async () => {
    if (!data || !pendingSaves.current.size) return;
    if (savingRef.current) return savingRef.current;

    const task = (async () => {
      setSaveState("Saving...");
      try {
        while (pendingSaves.current.size) {
          const items = Array.from(pendingSaves.current.entries());
          await mcqApi({
            action: "save",
            id: data.attempt.id,
            entries: items.map(([questionId, a]) => ({
              questionId,
              option: a.option,
              flagged: a.flagged,
            })),
          });
          for (const [qid, a] of items) {
            if (pendingSaves.current.get(qid) === a) {
              pendingSaves.current.delete(qid);
            }
          }
        }
        setSaveState("All changes saved");
        setError("");
      } catch (e) {
        setSaveState("Save failed - Retrying...");
        setError("Network sync delayed. Your selected options are stored locally.");
      } finally {
        savingRef.current = null;
      }
    })();

    savingRef.current = task;
    return task;
  }, [data]);

  // Submit attempt function
  const submitExam = useCallback(async () => {
    if (!data || isFinishing.current) return;
    isFinishing.current = true;
    setSubmitting(true);
    try {
      await flushAnswers();
      const submittedData = await mcqApi<SqlMcqExamPayload>({
        action: "submit",
        id: data.attempt.id,
      });
      setData(submittedData);
      setAnswers(submittedData.answers);
      setConfirmSubmit(false);
      setShowPaletteModal(false);
    } catch (e) {
      setError((e as Error).message);
      isFinishing.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [data, flushAnswers]);

  // Countdown timer logic
  useEffect(() => {
    if (!data || data.attempt.status !== "active") return;

    const timer = setInterval(() => {
      const nowOnServer = Date.now() + clockOffset.current;
      const left = Math.max(0, Math.ceil((data.attempt.deadline - nowOnServer) / 1000));
      setRemainingSeconds(left);

      if (left <= 0 && !isFinishing.current) {
        clearInterval(timer);
        void submitExam();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [data, submitExam]);

  // Autosave interval trigger
  useEffect(() => {
    if (!data || data.attempt.status !== "active") return;
    const interval = setInterval(() => {
      void flushAnswers();
    }, 5000);
    return () => clearInterval(interval);
  }, [data, flushAnswers]);

  // Update answer selection locally and mark for flush
  const handleSelectOption = (questionId: number, option: "A" | "B" | "C" | "D") => {
    if (!data || data.attempt.status !== "active") return;

    const currentAns = answers[questionId] || { option: "", flagged: false, updatedAt: Date.now() };
    // Toggle option off if clicked again, otherwise select
    const newOption = currentAns.option === option ? "" : option;
    const updatedAns: SqlMcqAnswer = {
      ...currentAns,
      option: newOption,
      updatedAt: Date.now(),
    };

    setAnswers((prev) => ({ ...prev, [questionId]: updatedAns }));
    pendingSaves.current.set(questionId, updatedAns);
    setSaveState("Saving changes...");

    // Trigger fast flush
    setTimeout(() => {
      void flushAnswers();
    }, 400);
  };

  // Toggle flag status
  const handleToggleFlag = (questionId: number) => {
    if (!data || data.attempt.status !== "active") return;

    const currentAns = answers[questionId] || { option: "", flagged: false, updatedAt: Date.now() };
    const updatedAns: SqlMcqAnswer = {
      ...currentAns,
      flagged: !currentAns.flagged,
      updatedAt: Date.now(),
    };

    setAnswers((prev) => ({ ...prev, [questionId]: updatedAns }));
    pendingSaves.current.set(questionId, updatedAns);
    setSaveState("Saving changes...");

    setTimeout(() => {
      void flushAnswers();
    }, 300);
  };

  if (loading) {
    return (
      <Shell active="overview">
        <Loading label="Loading SQL MCQ Assessment environment..." />
      </Shell>
    );
  }

  if (error && !data) {
    return (
      <Shell active="overview">
        <main className="content-wrap" style={{ paddingTop: "2rem" }}>
          <ErrorBox message={error} retry={loadExam} />
        </main>
      </Shell>
    );
  }

  if (!data) return null;

  const isSubmitted = data.attempt.status === "submitted";
  const questionsList = data.questions;
  const currentQuestion = questionsList[currentIndex] || questionsList[0];
  const currentAnswer = answers[currentQuestion?.id] || { option: "", flagged: false };

  // Calculate counts
  const answeredCount = Object.values(answers).filter((a) => a.option !== "").length;
  const flaggedCount = Object.values(answers).filter((a) => a.flagged).length;
  const unansweredCount = questionsList.length - answeredCount;

  // Formatting time
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const isTimeLow = remainingSeconds < 300; // less than 5 mins

  return (
    <Shell active="overview">
      <div className="mcq-exam-container">
        {/* TOP STATUS HEADER */}
        <header className="mcq-exam-header">
          <div className="mcq-header-left">
            <span className="mcq-badge">MCQ ASSESSMENT</span>
            <h1 className="mcq-exam-title">{SQL_MCQ_EXAM_NAME}</h1>
          </div>

          <div className="mcq-header-right">
            {!isSubmitted && (
              <div className={`mcq-timer-badge ${isTimeLow ? "low-time" : ""}`}>
                <Clock size={18} weight="bold" />
                <span>{timeFormatted}</span>
              </div>
            )}

            <div className="mcq-status-pills">
              <span className="pill answered">
                <strong>{answeredCount}</strong> Answered
              </span>
              <span className="pill unanswered">
                <strong>{unansweredCount}</strong> Unanswered
              </span>
              <span className="pill flagged">
                <strong>{flaggedCount}</strong> Flagged
              </span>
            </div>

            {!isSubmitted && (
              <button
                className="mcq-palette-toggle-btn"
                onClick={() => setShowPaletteModal(!showPaletteModal)}
                title="Toggle Question Palette"
              >
                <GridFour size={20} />
                <span>Palette</span>
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="mcq-alert-banner">
            <WarningCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* ACTIVE EXAM INTERFACE */}
        {!isSubmitted ? (
          <div className="mcq-main-layout">
            {/* LEFT QUESTION VIEW */}
            <main className="mcq-question-card">
              <div className="mcq-card-header">
                <div className="mcq-q-meta">
                  <span className="mcq-q-number">Question {currentIndex + 1} of {questionsList.length}</span>
                  <span className="mcq-q-category">{currentQuestion.category}</span>
                </div>

                <div className="mcq-card-actions-top">
                  <button
                    className={`mcq-flag-btn ${currentAnswer.flagged ? "active" : ""}`}
                    onClick={() => handleToggleFlag(currentQuestion.id)}
                  >
                    <Flag size={18} weight={currentAnswer.flagged ? "fill" : "bold"} />
                    <span>{currentAnswer.flagged ? "Flagged" : "Flag Question"}</span>
                  </button>
                  <span className="mcq-save-indicator">{saveState}</span>
                </div>
              </div>

              {/* QUESTION PROMPT */}
              <div className="mcq-prompt-box">
                <p className="mcq-prompt-text">{currentQuestion.prompt}</p>
              </div>

              {/* OPTIONS LIST */}
              <div className="mcq-options-grid">
                {(["A", "B", "C", "D"] as const).map((key) => {
                  const optionText = currentQuestion.options[key];
                  const isSelected = currentAnswer.option === key;

                  return (
                    <button
                      key={key}
                      className={`mcq-option-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectOption(currentQuestion.id, key)}
                    >
                      <span className="mcq-option-badge">{key}</span>
                      <span className="mcq-option-text">{optionText}</span>
                      <div className="mcq-option-radio">
                        {isSelected && <div className="mcq-radio-inner" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* FOOTER NAV BUTTONS */}
              <div className="mcq-card-footer">
                <button
                  className="mcq-btn secondary"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                >
                  <ArrowLeft size={18} />
                  <span>Previous</span>
                </button>

                <div className="mcq-footer-center">
                  <button
                    className="mcq-btn ghost"
                    onClick={() => void flushAnswers()}
                  >
                    <FloppyDisk size={18} />
                    <span>Save Answer</span>
                  </button>
                </div>

                <div className="mcq-footer-right">
                  {currentIndex < questionsList.length - 1 ? (
                    <button
                      className="mcq-btn primary"
                      onClick={() => setCurrentIndex((prev) => prev + 1)}
                    >
                      <span>Next</span>
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      className="mcq-btn submit"
                      onClick={() => setConfirmSubmit(true)}
                    >
                      <PaperPlaneTilt size={18} weight="fill" />
                      <span>Submit Exam</span>
                    </button>
                  )}
                </div>
              </div>
            </main>

            {/* RIGHT SIDEBAR QUESTION PALETTE */}
            <aside className={`mcq-palette-sidebar ${showPaletteModal ? "open-mobile" : ""}`}>
              <div className="mcq-palette-header">
                <h3>Question Palette</h3>
                <span className="palette-sub">45 Questions</span>
              </div>

              <div className="mcq-palette-grid">
                {questionsList.map((q, idx) => {
                  const ans = answers[q.id];
                  const isAns = Boolean(ans?.option);
                  const isFlag = Boolean(ans?.flagged);
                  const isCurr = idx === currentIndex;

                  let statusClass = "unanswered";
                  if (isAns) statusClass = "answered";
                  if (isCurr) statusClass += " active";

                  return (
                    <button
                      key={q.id}
                      className={`mcq-palette-item ${statusClass}`}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowPaletteModal(false);
                      }}
                      title={`Q${q.id}: ${q.category}${isAns ? " (Answered)" : " (Unanswered)"}`}
                    >
                      <span>{q.id}</span>
                      {isFlag && <Flag className="palette-flag-icon" size={12} weight="fill" />}
                    </button>
                  );
                })}
              </div>

              <div className="mcq-palette-legend">
                <div className="legend-item">
                  <span className="legend-box current" />
                  <span>Current</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box answered" />
                  <span>Answered</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box unanswered" />
                  <span>Unanswered</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box flagged" />
                  <span>Flagged</span>
                </div>
              </div>

              <button
                className="mcq-submit-sidebar-btn"
                onClick={() => setConfirmSubmit(true)}
              >
                <PaperPlaneTilt size={18} weight="fill" />
                <span>Submit Assessment</span>
              </button>
            </aside>
          </div>
        ) : (
          /* SUBMITTED RESULT VIEW / REPORT CARD */
          <div className="mcq-result-container">
            <div className="mcq-result-hero">
              <div className="mcq-result-hero-content">
                <span className="mcq-result-eyebrow">
                  <Trophy size={20} weight="fill" color="#f59e0b" /> ASSESSMENT COMPLETED
                </span>
                <h2>SQL MCQ Assessment Results</h2>
                <p>Detailed performance report and complete question explanations</p>

                <div className="mcq-score-big">
                  <div className="score-num">
                    {data.attempt.totalScore} <span>/ {TOTAL_MCQ_MARKS}</span>
                  </div>
                  <div className="score-percentage">
                    {data.attempt.percentage}% Overall Score
                  </div>
                  <div className={`score-badge ${(data.attempt.percentage ?? 0) >= 60 ? "pass" : "fail"}`}>
                    {(data.attempt.percentage ?? 0) >= 60 ? "PASSED (>=60%)" : "NEEDS IMPROVEMENT (<60%)"}
                  </div>
                </div>
              </div>

              <div className="mcq-metrics-grid">
                <div className="metric-card green">
                  <CheckCircle size={28} weight="fill" />
                  <span className="metric-value">{data.attempt.correctCount}</span>
                  <span className="metric-label">Correct Answers</span>
                </div>
                <div className="metric-card red">
                  <XCircle size={28} weight="fill" />
                  <span className="metric-value">{data.attempt.wrongCount}</span>
                  <span className="metric-label">Wrong Answers</span>
                </div>
                <div className="metric-card gray">
                  <WarningCircle size={28} weight="fill" />
                  <span className="metric-value">{data.attempt.unansweredCount}</span>
                  <span className="metric-label">Unanswered</span>
                </div>
              </div>
            </div>

            {/* SECTION-WISE PERFORMANCE BREAKDOWN */}
            {data.attempt.categoryBreakdown && (
              <section className="mcq-section-performance">
                <div className="section-title-wrap">
                  <BookOpen size={22} weight="bold" />
                  <h3>Section-Wise Performance</h3>
                </div>

                <div className="category-performance-grid">
                  {Object.values(data.attempt.categoryBreakdown).map((cat) => (
                    <div className="cat-card" key={cat.category}>
                      <div className="cat-card-header">
                        <span className="cat-name">{cat.category}</span>
                        <span className="cat-score">{cat.correct} / {cat.total} ({cat.percentage}%)</span>
                      </div>
                      <div className="cat-bar-bg">
                        <div
                          className="cat-bar-fill"
                          style={{
                            width: `${Math.min(100, Math.max(0, cat.percentage))}%`,
                            backgroundColor: cat.percentage >= 70 ? "#10b981" : cat.percentage >= 40 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* DETAILED QUESTION REVIEW */}
            <section className="mcq-questions-review">
              <div className="section-title-wrap">
                <CheckSquare size={22} weight="bold" />
                <h3>Question Breakdown & Explanations</h3>
              </div>

              <div className="review-list">
                {(data.fullQuestions || []).map((q: SqlMcqQuestion) => {
                  const studentAns = data.answers[q.id]?.option || "";
                  const isCorrect = studentAns === q.correctOption;
                  const isUnanswered = !studentAns;

                  let statusBadgeClass = "correct";
                  let statusText = "Correct (+1)";
                  if (isUnanswered) {
                    statusBadgeClass = "unanswered";
                    statusText = "Unanswered (0)";
                  } else if (!isCorrect) {
                    statusBadgeClass = "wrong";
                    statusText = "Incorrect (0)";
                  }

                  return (
                    <div className={`review-card ${statusBadgeClass}`} key={q.id}>
                      <div className="review-card-header">
                        <div className="q-badge">Question {q.id}</div>
                        <span className="q-category-tag">{q.category}</span>
                        <div className={`status-pill ${statusBadgeClass}`}>
                          {isCorrect && <CheckCircle size={16} weight="fill" />}
                          {!isCorrect && !isUnanswered && <XCircle size={16} weight="fill" />}
                          {isUnanswered && <WarningCircle size={16} weight="fill" />}
                          <span>{statusText}</span>
                        </div>
                      </div>

                      <p className="review-prompt">{q.prompt}</p>

                      <div className="review-options-grid">
                        {(["A", "B", "C", "D"] as const).map((key) => {
                          const optionText = q.options[key];
                          const isSelectedByStudent = studentAns === key;
                          const isTheCorrectOption = q.correctOption === key;

                          let optionClass = "";
                          if (isTheCorrectOption) optionClass = "correct-choice";
                          if (isSelectedByStudent && !isTheCorrectOption) optionClass = "wrong-choice";

                          return (
                            <div key={key} className={`review-option-item ${optionClass}`}>
                              <span className="key-badge">{key}</span>
                              <span className="text">{optionText}</span>
                              {isSelectedByStudent && <span className="your-tag">Your Choice</span>}
                              {isTheCorrectOption && <span className="correct-tag">Correct Answer</span>}
                            </div>
                          );
                        })}
                      </div>

                      <div className="explanation-box">
                        <div className="exp-title">
                          <Sparkle size={18} weight="fill" color="#3b82f6" />
                          <span>Explanation</span>
                        </div>
                        <p className="exp-body">{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* SUBMIT CONFIRMATION MODAL */}
        {confirmSubmit && (
          <div className="mcq-modal-overlay">
            <div className="mcq-modal-card">
              <div className="modal-icon">
                <PaperPlaneTilt size={32} weight="fill" color="#3b82f6" />
              </div>
              <h2>Submit SQL MCQ Assessment?</h2>
              <p>Are you sure you want to finish your attempt? Once submitted, your answers will be calculated automatically and cannot be modified.</p>

              <div className="modal-summary">
                <div className="summary-row">
                  <span>Total Questions:</span>
                  <strong>45</strong>
                </div>
                <div className="summary-row">
                  <span>Answered:</span>
                  <strong style={{ color: "#10b981" }}>{answeredCount}</strong>
                </div>
                <div className="summary-row">
                  <span>Unanswered:</span>
                  <strong style={{ color: unansweredCount > 0 ? "#ef4444" : "#6b7280" }}>{unansweredCount}</strong>
                </div>
                <div className="summary-row">
                  <span>Flagged:</span>
                  <strong style={{ color: "#f59e0b" }}>{flaggedCount}</strong>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div className="modal-warning">
                  <WarningCircle size={18} color="#ef4444" />
                  <span>You still have {unansweredCount} unanswered question{unansweredCount > 1 ? "s" : ""}.</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="mcq-btn secondary"
                  disabled={submitting}
                  onClick={() => setConfirmSubmit(false)}
                >
                  Return to Exam
                </button>
                <button
                  className="mcq-btn submit"
                  disabled={submitting}
                  onClick={() => void submitExam()}
                >
                  {submitting ? "Submitting..." : "Yes, Submit Now"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
