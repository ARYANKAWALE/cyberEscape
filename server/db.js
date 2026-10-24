/**
 * SQLite database layer for CyberEscape results.
 *
 * Schema:
 *   sessions   – one row per completed game run
 *   level_results – one row per level per session
 */

const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, 'cyberEscape.db')
const db = new Database(DB_PATH)

// Enable WAL mode for better concurrent reads
db.pragma('journal_mode = WAL')

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       TEXT    NOT NULL,
    user_name     TEXT    NOT NULL,
    completed_at  TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS level_results (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id         INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    level_title        TEXT    NOT NULL,
    solved             INTEGER NOT NULL DEFAULT 0,  -- 0 | 1
    time_taken_seconds INTEGER             -- NULL for non-timed levels
  );
`)

// ── Prepared statements ───────────────────────────────────────────────────────
const stmtInsertSession = db.prepare(`
  INSERT INTO sessions (user_id, user_name, completed_at)
  VALUES (@userId, @userName, @completedAt)
`)

const stmtInsertLevel = db.prepare(`
  INSERT INTO level_results (session_id, level_title, solved, time_taken_seconds)
  VALUES (@sessionId, @title, @solved, @timeTakenSeconds)
`)

const stmtGetSessions = db.prepare(`
  SELECT id, user_id, user_name, completed_at FROM sessions ORDER BY id DESC
`)

const stmtGetLevelsForSession = db.prepare(`
  SELECT level_title, solved, time_taken_seconds
  FROM level_results
  WHERE session_id = ?
  ORDER BY id
`)

// ── Exported helpers ──────────────────────────────────────────────────────────

/**
 * Insert a new session and return its auto-incremented id.
 */
function insertSession({ userId, userName, completedAt }) {
  const { lastInsertRowid } = stmtInsertSession.run({ userId, userName, completedAt })
  return lastInsertRowid
}

/**
 * Insert one level result row.
 */
function insertLevelResult({ sessionId, title, solved, timeTakenSeconds }) {
  stmtInsertLevel.run({ sessionId, title, solved, timeTakenSeconds })
}

/**
 * Return every session, each enriched with its level results.
 */
function getAllSessions() {
  const sessions = stmtGetSessions.all()
  return sessions.map((s) => ({
    id: s.id,
    userId: s.user_id,
    userName: s.user_name,
    completedAt: s.completed_at,
    levels: stmtGetLevelsForSession.all(s.id).map((l) => ({
      title: l.level_title,
      solved: Boolean(l.solved),
      timeTakenSeconds: l.time_taken_seconds,
    })),
  }))
}

module.exports = { insertSession, insertLevelResult, getAllSessions }
