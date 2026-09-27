import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  ArrowLeft,
  ArrowRight,
  Flag,
  CheckCircle,
  Clock,
  PaperPlaneTilt,
  Database,
  ArrowClockwise,
  FloppyDisk,
  Check,
  XCircle,
  Code,
  Table as TableIcon,
  WarningCircle,
  Sparkle,
  Trophy,
  CaretRight,
  CaretDown,
  Eye,
  FileCode,
} from "@phosphor-icons/react";
import { Shell, ErrorBox, Loading } from "@/components/exam-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { DB_SCHEMAS, SQL_EXAM_NAME, MARKS_PER_QUESTION, TOTAL_MARKS } from "@/lib/sql-exam-questions";
import { executeSqlQuery } from "@/lib/sql-engine";
import { checkSqlSecurity } from "@/lib/sql-exam-types";
import type { SqlExamAnswer, SqlExamAttempt, SqlExamPayload, SqlQueryResult, TableSchema } from "@/lib/sql-exam-types";

export const Route = createFileRoute("/sql-exam")({
  head: () => ({
    meta: [
      { title: "SQL Coding Assessment (30 Mins) | MySQL Exam Studio" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SqlExamWrapper,
});

function SqlExamWrapper() {
  return (
    <ProtectedRoute>
      <SqlExamPage />
    </ProtectedRoute>
  );
}

// Client API Helper
async function sqlApi<T>(body?: unknown, id?: string): Promise<T> {
  const url = id ? `/api/sql-exam?id=${encodeURIComponent(id)}` : "/api/sql-exam";
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

function SqlExamPage() {
  const [data, setData] = useState<SqlExamPayload | null>(null);
  const [answers, setAnswers] = useState<Record<number, SqlExamAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(1800);
  const [saveState, setSaveState] = useState("All changes saved");
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  
  // Execution state for current query editor
  const [runResult, setRunResult] = useState<SqlQueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"problem" | "schema" | "nav">("problem");
  const [previewTable, setPreviewTable] = useState<TableSchema | null>(null);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({ customers: true });

  const pendingSaves = useRef<Map<number, SqlExamAnswer>>(new Map());
  const savingRef = useRef<Promise<void> | null>(null);
  const clockOffset = useRef(0);
  const isFinishing = useRef(false);

  // Load exam payload
  const loadExam = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // First check local URL for attempt ID
      const queryId = new URLSearchParams(window.location.search).get("id");
      const result = await sqlApi<SqlExamPayload>(undefined, queryId ?? undefined);

      if (!result.attempt) {
        // Start attempt if none exists
        const startResult = await sqlApi<SqlExamPayload>({ action: "start" });
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
          await sqlApi({
            action: "save",
            id: data.attempt.id,
            entries: items.map(([questionId, a]) => ({
              questionId,
              code: a.code,
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
        setSaveState("Not saved");
        setError((e as Error).message);
        throw e;
      }
    })();

    savingRef.current = task;
    try {
      await task;
    } finally {
      savingRef.current = null;
    }
  }, [data]);

  // Finish and evaluate exam
  const finishExam = useCallback(
    async (expired = false) => {
      if (!data || isFinishing.current) return;
      isFinishing.current = true;
      setSubmitting(true);
      setError("");

      try {
        if (!expired) {
          await flushAnswers();
        } else if (savingRef.current) {
          await savingRef.current.catch(() => {});
        }

        const result = await sqlApi<SqlExamPayload>({
          action: "submit",
          id: data.attempt.id,
        });

        setData(result);
        setAnswers(result.answers);
      } catch (e) {
        setError((e as Error).message);
        setSubmitting(false);
        setConfirmSubmit(false);
        isFinishing.current = false;
      }
    },
    [data, flushAnswers]
  );

  // Countdown timer & autosave loop
  useEffect(() => {
    if (!data || data.attempt.status === "submitted") return;

    const timer = setInterval(() => {
      const now = Date.now() + clockOffset.current;
      const left = Math.max(0, Math.ceil((data.attempt.deadline - now) / 1000));
      setRemainingSeconds(left);
      if (left === 0 && !isFinishing.current) {
        void finishExam(true);
      }
    }, 1000);

    const saveTimer = setInterval(() => {
      if (navigator.onLine) {
        void flushAnswers().catch(() => {});
      }
    }, 3000);

    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSaves.current.size || savingRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      clearInterval(timer);
      clearInterval(saveTimer);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [data, flushAnswers, finishExam]);

  // Patch student answer for a question
  function updateCode(qid: number, code: string) {
    if (data?.attempt.status === "submitted") return;
    setAnswers((prev) => {
      const current = prev[qid] ?? { code: "", flagged: false, updatedAt: Date.now() };
      const next = { ...current, code, updatedAt: Date.now() };
      pendingSaves.current.set(qid, next);
      return { ...prev, [qid]: next };
    });
    setSaveState("Unsaved changes");
  }

  function toggleFlag(qid: number) {
    if (data?.attempt.status === "submitted") return;
    setAnswers((prev) => {
      const current = prev[qid] ?? { code: "", flagged: false, updatedAt: Date.now() };
      const next = { ...current, flagged: !current.flagged, updatedAt: Date.now() };
      pendingSaves.current.set(qid, next);
      return { ...prev, [qid]: next };
    });
    setSaveState("Unsaved changes");
  }

  function handleRunQuery(sqlCode: string) {
    setRunning(true);
    setRunResult(null);
    setTimeout(() => {
      const res = executeSqlQuery(sqlCode);
      setRunResult(res);
      setRunning(false);
    }, 120);
  }

  function handleResetCode(qid: number) {
    const q = data?.questions.find((item) => item.id === qid);
    if (q) {
      updateCode(qid, q.initialCode);
      setRunResult(null);
    }
  }

  const activeQuestion = data?.questions[currentIndex];
  const currentAnswer = activeQuestion ? answers[activeQuestion.id] ?? { code: activeQuestion.initialCode, flagged: false, updatedAt: 0 } : null;
  const answeredCount = Object.values(answers).filter((a) => a.code.trim().length > 0).length;
  const flaggedCount = Object.values(answers).filter((a) => a.flagged).length;

  if (loading) {
    return (
      <Shell active="sql-exam">
        <Loading label="Initializing isolated SQL exam database" />
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell active="sql-exam">
        <main className="content-wrap page-pad">
          <ErrorBox message={error || "Could not load the 30-minute SQL exam."} retry={() => void loadExam()} />
        </main>
      </Shell>
    );
  }

  // RENDER REPORT CARD IF EXAM SUBMITTED
  if (data.attempt.status === "submitted") {
    return <SqlExamReportCard data={data} />;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timerUrgent = remainingSeconds < 300;

  return (
    <Shell active="sql-exam">
      <main className="sql-exam-layout content-wrap">
        {/* TOP BAR */}
        <header className="sql-exam-header">
          <div className="header-left">
            <div className="exam-badge">
              <Database size={18} weight="duotone" />
              <span>SQL CODING ASSESSMENT</span>
            </div>
            <h1>{SQL_EXAM_NAME}</h1>
          </div>

          <div className="header-center">
            <div className={`countdown-timer ${timerUrgent ? "urgent" : ""}`} role="timer">
              <Clock size={20} weight="bold" />
              <div>
                <span className="timer-label">TIME REMAINING</span>
                <strong className="timer-value">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </strong>
              </div>
            </div>
            <span className="save-indicator">
              <FloppyDisk size={15} />
              {saveState}
            </span>
          </div>

          <div className="header-right">
            <button className="submit-header-btn" onClick={() => setConfirmSubmit(true)} disabled={submitting}>
              <PaperPlaneTilt size={17} weight="bold" />
              <span>Submit Exam</span>
            </button>
          </div>
        </header>

        {error && <ErrorBox message={error} retry={() => void flushAnswers()} />}

        {/* WORKSPACE MAIN CONTAINER */}
        <div className="sql-ide-container">
          {/* LEFT PANEL: QUESTION PROMPT & SCHEMA */}
          <section className="sql-left-pane">
            <nav className="pane-tabs">
              <button
                className={activeTab === "problem" ? "active" : ""}
                onClick={() => setActiveTab("problem")}
              >
                <Code size={16} /> Problem ({currentIndex + 1}/8)
              </button>
              <button
                className={activeTab === "schema" ? "active" : ""}
                onClick={() => setActiveTab("schema")}
              >
                <Database size={16} /> Schema Explorer (5 Tables)
              </button>
              <button
                className={activeTab === "nav" ? "active" : ""}
                onClick={() => setActiveTab("nav")}
              >
                <TableIcon size={16} /> Overview ({answeredCount}/8)
              </button>
            </nav>

            <div className="pane-content">
              {activeTab === "problem" && activeQuestion && (
                <div className="problem-statement-box">
                  <div className="problem-meta">
                    <span className="category-pill">{activeQuestion.category}</span>
                    <span className="points-pill">{activeQuestion.points} Marks</span>
                  </div>

                  <h2 className="question-title">{activeQuestion.title}</h2>
                  <div className="question-prompt-text">
                    <p>{activeQuestion.prompt}</p>
                  </div>

                  <div className="quick-schema-preview">
                    <h4>Target Tables for this query:</h4>
                    <div className="schema-chips">
                      {DB_SCHEMAS.map((table) => (
                        <button
                          key={table.name}
                          className="table-chip"
                          onClick={() => {
                            setActiveTab("schema");
                            setExpandedTables({ ...expandedTables, [table.name]: true });
                          }}
                        >
                          <TableIcon size={14} />
                          <span>{table.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="guidance-box">
                    <Sparkle size={16} />
                    <span>
                      Write valid <strong>MySQL</strong> syntax. Use the "Run Query" button to verify your SQL execution against the isolated sample database.
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "schema" && (
                <div className="schema-explorer-box">
                  <div className="schema-header">
                    <h3>Database Schema & Sample Data</h3>
                    <p className="muted">5 tables seeded in your isolated assessment sandbox.</p>
                  </div>

                  <div className="tables-accordion">
                    {DB_SCHEMAS.map((table) => {
                      const isOpen = expandedTables[table.name];
                      return (
                        <div className="table-schema-card" key={table.name}>
                          <button
                            className="table-card-header"
                            onClick={() =>
                              setExpandedTables((prev) => ({ ...prev, [table.name]: !prev[table.name] }))
                            }
                          >
                            <div className="table-title-row">
                              {isOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
                              <TableIcon size={16} className="table-icon" />
                              <strong className="table-name">{table.name}</strong>
                              <span className="column-count">({table.columns.length} columns)</span>
                            </div>
                            <button
                              className="preview-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTable(table);
                              }}
                              title="View sample rows"
                            >
                              <Eye size={14} />
                              <span>Sample Rows</span>
                            </button>
                          </button>

                          {isOpen && (
                            <div className="table-columns-list">
                              <p className="table-desc">{table.description}</p>
                              <table className="mini-schema-table">
                                <thead>
                                  <tr>
                                    <th>Column</th>
                                    <th>Type</th>
                                    <th>Key</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {table.columns.map((col) => (
                                    <tr key={col.name}>
                                      <td className="col-name">{col.name}</td>
                                      <td className="col-type">{col.type}</td>
                                      <td className="col-key">
                                        {col.isPrimary && <span className="pk-tag">PK</span>}
                                        {col.isForeign && <span className="fk-tag" title={`FK -> ${col.references}`}>FK</span>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "nav" && (
                <div className="question-nav-overview">
                  <h3>Assessment Progress</h3>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar" style={{ width: `${(answeredCount / 8) * 100}%` }} />
                  </div>
                  <p className="muted">{answeredCount} of 8 questions answered.</p>

                  <div className="questions-grid">
                    {data.questions.map((q, idx) => {
                      const ans = answers[q.id];
                      const isAnswered = ans && ans.code.trim().length > 0;
                      const isFlagged = ans?.flagged;
                      const isActive = currentIndex === idx;

                      return (
                        <button
                          key={q.id}
                          className={`nav-grid-btn ${isActive ? "active" : ""} ${isAnswered ? "answered" : ""} ${isFlagged ? "flagged" : ""}`}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setActiveTab("problem");
                          }}
                        >
                          <span className="q-num">Q{q.id}</span>
                          {isFlagged && <Flag size={12} weight="fill" className="flag-icon" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT PANEL: SQL CODE EDITOR & RESULT RUNNER */}
          <section className="sql-right-pane">
            <div className="editor-toolbar">
              <div className="editor-title">
                <FileCode size={18} />
                <span>MySQL Query Editor</span>
              </div>

              <div className="editor-actions">
                <button
                  className={`flag-btn ${currentAnswer?.flagged ? "active" : ""}`}
                  onClick={() => activeQuestion && toggleFlag(activeQuestion.id)}
                  title="Flag for review"
                >
                  <Flag size={15} weight={currentAnswer?.flagged ? "fill" : "regular"} />
                  <span>{currentAnswer?.flagged ? "Flagged" : "Flag"}</span>
                </button>

                <button
                  className="reset-btn"
                  onClick={() => activeQuestion && handleResetCode(activeQuestion.id)}
                  title="Reset to template"
                >
                  <ArrowClockwise size={15} />
                  <span>Reset</span>
                </button>

                <button
                  className="run-btn"
                  onClick={() => currentAnswer && handleRunQuery(currentAnswer.code)}
                  disabled={running}
                >
                  <Play size={15} weight="fill" />
                  <span>{running ? "Running..." : "Run Query"}</span>
                </button>
              </div>
            </div>

            {/* CUSTOM CODE EDITOR */}
            <div className="sql-code-editor-wrapper">
              <SqlTextEditor
                value={currentAnswer?.code || ""}
                onChange={(newCode) => activeQuestion && updateCode(activeQuestion.id, newCode)}
              />
            </div>

            {/* QUERY RESULT DRAWER / OUTPUT PANEL */}
            <div className="query-output-panel">
              <div className="output-header">
                <span>QUERY OUTPUT</span>
                {runResult?.success && (
                  <span className="badge-success">
                    {runResult.rowCount !== undefined ? `${runResult.rowCount} rows returned` : `${runResult.affectedRows} rows affected`}
                    {runResult.executionTimeMs !== undefined && ` (${runResult.executionTimeMs}ms)`}
                  </span>
                )}
                {runResult && !runResult.success && (
                  <span className="badge-error">Execution Error</span>
                )}
              </div>

              <div className="output-body">
                {!runResult && !running && (
                  <div className="output-empty">
                    <Play size={24} />
                    <p>Click <strong>Run Query</strong> to execute your SQL code against the sample database.</p>
                  </div>
                )}

                {running && <div className="output-loading">Executing SQL statement...</div>}

                {runResult && !runResult.success && (
                  <div className="output-error-box">
                    <WarningCircle size={20} />
                    <pre>{runResult.error}</pre>
                  </div>
                )}

                {runResult && runResult.success && (
                  <div className="output-table-container">
                    {runResult.rows && runResult.rows.length > 0 ? (
                      <table className="sql-result-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            {runResult.columns?.map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {runResult.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              <td className="row-num">{rIdx + 1}</td>
                              {runResult.columns?.map((col) => (
                                <td key={col}>{row[col] !== null && row[col] !== undefined ? String(row[col]) : <em className="null-val">NULL</em>}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="output-empty">
                        <CheckCircle size={24} />
                        <p>Query executed successfully with no returned rows.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM NAVIGATION CONTROLS */}
            <footer className="editor-footer-nav">
              <button
                className="nav-prev-btn"
                onClick={() => {
                  setCurrentIndex((prev) => Math.max(0, prev - 1));
                  setRunResult(null);
                }}
                disabled={currentIndex === 0}
              >
                <ArrowLeft size={16} /> Previous
              </button>

              <span className="nav-counter">
                Question {currentIndex + 1} of 8
              </span>

              {currentIndex < 7 ? (
                <button
                  className="nav-next-btn"
                  onClick={() => {
                    setCurrentIndex((prev) => Math.min(7, prev + 1));
                    setRunResult(null);
                  }}
                >
                  Next Question <ArrowRight size={16} />
                </button>
              ) : (
                <button className="nav-finish-btn" onClick={() => setConfirmSubmit(true)}>
                  Finish Exam <Check size={16} />
                </button>
              )}
            </footer>
          </section>
        </div>

        {/* SUBMIT CONFIRMATION MODAL */}
        {confirmSubmit && (
          <dialog className="submit-dialog" open aria-labelledby="submit-modal-heading">
            <PaperPlaneTilt size={40} weight="duotone" />
            <h2 id="submit-modal-heading">Submit SQL Assessment?</h2>
            <p>Your answers will be evaluated using hidden test cases against the expected database output.</p>
            
            <div className="submit-counts">
              <span><strong>{answeredCount}</strong> Answered</span>
              <span><strong>{8 - answeredCount}</strong> Unanswered</span>
              <span><strong>{flaggedCount}</strong> Flagged</span>
            </div>

            {8 - answeredCount > 0 && (
              <p className="small warning-text">Unanswered questions will receive 0 marks.</p>
            )}

            <div className="dialog-actions">
              <button onClick={() => setConfirmSubmit(false)} disabled={submitting}>
                Keep Working
              </button>
              <button className="confirm-submit" onClick={() => void finishExam()} disabled={submitting}>
                {submitting ? "Evaluating..." : "Confirm & Submit"}
              </button>
            </div>
          </dialog>
        )}

        {/* SAMPLE DATA MODAL */}
        {previewTable && (
          <dialog className="sample-data-dialog" open>
            <div className="modal-header">
              <h3>Sample Data: <code>{previewTable.name}</code></h3>
              <button className="close-btn" onClick={() => setPreviewTable(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <table className="sql-result-table">
                <thead>
                  <tr>
                    {previewTable.columns.map((c) => (
                      <th key={c.name}>{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewTable.sampleData.map((row, i) => (
                    <tr key={i}>
                      {previewTable.columns.map((c) => (
                        <td key={c.name}>{String(row[c.name] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </dialog>
        )}
      </main>
    </Shell>
  );
}

// Custom SQL Code Textarea with line numbers and indent handling
function SqlTextEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lines = value.split("\n");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const nextValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(nextValue);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="sql-text-editor">
      <div className="line-numbers">
        {lines.map((_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        placeholder="-- Type your MySQL query here..."
      />
    </div>
  );
}

// FINAL REPORT CARD COMPONENT FOR SUBMITTED EXAM
function SqlExamReportCard({ data }: { data: SqlExamPayload }) {
  const attempt = data.attempt;
  const totalScore = attempt.totalScore ?? 0;
  const maxScore = attempt.maxScore ?? TOTAL_MARKS;
  const percentage = Math.round((totalScore / maxScore) * 100);
  const passed = percentage >= 60;
  const evaluations = data.evaluations || {};
  const fullQuestions = data.fullQuestions || [];

  return (
    <Shell active="reports">
      <main className="sql-report-card content-wrap">
        <header className="report-header">
          <div className="report-badge">
            <Trophy size={20} weight="duotone" />
            <span>OFFICIAL REPORT CARD</span>
          </div>
          <h1>{SQL_EXAM_NAME}</h1>
          <p className="report-meta">
            Submitted by <strong>{attempt.userName}</strong> on {new Date(attempt.submittedAt || Date.now()).toLocaleString()}
          </p>
        </header>

        {/* SUMMARY SCORE STRIP */}
        <section className="score-summary-card">
          <div className="score-circle-col">
            <div className={`score-badge ${passed ? "pass" : "fail"}`}>
              <span className="big-percent">{percentage}%</span>
              <span className="pass-status">{passed ? "PASSED" : "FAILED"}</span>
            </div>
          </div>

          <div className="score-details-col">
            <h2>Overall Score: {totalScore} / {maxScore} Marks</h2>
            <p className="score-subtext">
              Pass threshold: 60%. Answered: {Object.keys(attempt.answers).length} / 8 questions.
            </p>

            <div className="score-breakdown-pills">
              <span className="pill-correct">
                <CheckCircle size={16} /> {Object.values(evaluations).filter((e) => e.isCorrect).length} Correct
              </span>
              <span className="pill-incorrect">
                <XCircle size={16} /> {Object.values(evaluations).filter((e) => !e.isCorrect).length} Incorrect
              </span>
            </div>
          </div>
        </section>

        {/* DETAILED QUESTION EVALUATION BREAKDOWN */}
        <section className="questions-evaluation-section">
          <h2>Detailed Question Breakdown & Answer Key</h2>
          <p className="muted">Solutions and test case comparisons are now revealed.</p>

          <div className="evaluations-list">
            {fullQuestions.map((q) => {
              const ev = evaluations[q.id];
              const isCorrect = ev?.isCorrect ?? false;
              const studentCode = ev?.studentSql || attempt.answers[q.id]?.code || "-- No answer provided";

              return (
                <div key={q.id} className={`eval-card ${isCorrect ? "eval-pass" : "eval-fail"}`}>
                  <div className="eval-card-header">
                    <div className="q-info">
                      <span className="q-id-tag">Question {q.id}</span>
                      <h3>{q.title}</h3>
                    </div>

                    <div className="q-score-tag">
                      <span className={`status-pill ${isCorrect ? "success" : "danger"}`}>
                        {isCorrect ? <CheckCircle size={15} /> : <XCircle size={15} />}
                        {isCorrect ? "Correct" : "Incorrect"}
                      </span>
                      <strong className="marks-display">{ev?.score ?? 0} / {q.points} Marks</strong>
                    </div>
                  </div>

                  <p className="q-prompt">{q.prompt}</p>

                  <div className="code-comparison-grid">
                    <div className="code-block-box">
                      <label>Your Submitted Query:</label>
                      <pre className="code-display"><code>{studentCode}</code></pre>
                    </div>

                    <div className="code-block-box solution-box">
                      <label>Expected Model Solution SQL:</label>
                      <pre className="code-display solution-code"><code>{q.expectedSql}</code></pre>
                    </div>
                  </div>

                  <div className="explanation-box">
                    <strong>Explanation & Feedback:</strong>
                    <p>{ev?.feedback || q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="report-actions">
          <a href="/" className="back-btn">
            <ArrowLeft size={16} /> Return to Dashboard
          </a>
        </div>
      </main>
    </Shell>
  );
}
