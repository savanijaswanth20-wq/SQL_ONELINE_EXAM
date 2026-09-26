CREATE TABLE IF NOT EXISTS exam_attempts (
 id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL, student_id TEXT NOT NULL DEFAULT '', cohort TEXT NOT NULL DEFAULT '',
 started_at INTEGER NOT NULL, deadline INTEGER NOT NULL, submitted_at INTEGER,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','submitted')), version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS exam_attempt_owner ON exam_attempts(owner,started_at DESC);
CREATE TABLE IF NOT EXISTS exam_answers (
 attempt_id TEXT NOT NULL REFERENCES exam_attempts(id), question_id INTEGER NOT NULL CHECK(question_id BETWEEN 1 AND 65),
 value TEXT NOT NULL DEFAULT '', correction TEXT NOT NULL DEFAULT '', flagged INTEGER NOT NULL DEFAULT 0,
 review_mark INTEGER, reflection TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL,
 PRIMARY KEY(attempt_id,question_id)
);
CREATE TABLE IF NOT EXISTS exam_start_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL);
