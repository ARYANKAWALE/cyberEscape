/**
 * SQLite database layer for CyberEscape results.
 *
 * Schema:
 *   users         – one row per registered operative account
 *   sessions      – one row per operative progress / completed game run
 *   level_results – one row per question per session (10 questions total)
 */

const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, 'cyberEscape.db')
const db = new Database(DB_PATH)

// Enable WAL mode for better concurrent reads
db.pragma('journal_mode = WAL')

// ── Schema Setup & Migrations ─────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       TEXT    NOT NULL,
    user_name     TEXT    NOT NULL,
    completed_at  TEXT
  );

  CREATE TABLE IF NOT EXISTS level_results (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id         INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    level_title        TEXT    NOT NULL,
    solved             INTEGER NOT NULL DEFAULT 0,  -- 0 | 1
    time_taken_seconds INTEGER             -- NULL for unsolved/non-timed
  );
`)

// Safely add missing columns to sessions if table already existed
try {
  db.exec(`ALTER TABLE sessions ADD COLUMN status TEXT DEFAULT 'INCOMPLETE'`)
} catch {}
try {
  db.exec(`ALTER TABLE sessions ADD COLUMN email TEXT`)
} catch {}
try {
  db.exec(`ALTER TABLE sessions ADD COLUMN updated_at TEXT`)
} catch {}

// For existing completed records, ensure status is 'COMPLETE'
try {
  db.exec(`
    UPDATE sessions
    SET status = 'COMPLETE'
    WHERE (status IS NULL OR status = '' OR status = 'INCOMPLETE') AND completed_at IS NOT NULL
  `)
} catch {}

const DEFAULT_QUESTION_TITLES = [
  'L1.Q1: Difference Sequence',
  'L1.Q2: Binary Conversion',
  'L2.Q1: Caesar Shift',
  'L2.Q2: Atbash Cipher',
  'L3.Q1: Variable Leap Sequence',
  'L3.Q2: Vowel Progression',
  'L4.Q1: Character Frequency Riddle',
  'L4.Q2: Hardware Security Riddle',
  'L5.Q1: Reverse Clue Decryption',
  'L5.Q2: Base64 Escape Keyword',
]

// ── Prepared Statements ───────────────────────────────────────────────────────
const stmtInsertUser = db.prepare(`
  INSERT INTO users (id, name, email, created_at)
  VALUES (@id, @name, @email, @createdAt)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    email = COALESCE(excluded.email, users.email)
`)

const stmtFindSessionByUserId = db.prepare(`
  SELECT id, user_id, user_name, email, completed_at, status, updated_at
  FROM sessions
  WHERE user_id = ?
  ORDER BY id DESC
  LIMIT 1
`)

const stmtInsertSession = db.prepare(`
  INSERT INTO sessions (user_id, user_name, email, completed_at, status, updated_at)
  VALUES (@userId, @userName, @email, @completedAt, @status, @updatedAt)
`)

const stmtUpdateSession = db.prepare(`
  UPDATE sessions
  SET user_name = @userName,
      email = COALESCE(@email, email),
      completed_at = @completedAt,
      status = @status,
      updated_at = @updatedAt
  WHERE id = @sessionId
`)

const stmtDeleteLevels = db.prepare(`
  DELETE FROM level_results WHERE session_id = ?
`)

const stmtInsertLevel = db.prepare(`
  INSERT INTO level_results (session_id, level_title, solved, time_taken_seconds)
  VALUES (@sessionId, @title, @solved, @timeTakenSeconds)
`)

const stmtGetLevelsForSession = db.prepare(`
  SELECT level_title, solved, time_taken_seconds
  FROM level_results
  WHERE session_id = ?
  ORDER BY id
`)

// ── Exported Helpers ──────────────────────────────────────────────────────────

/**
 * Register or update a user and ensure they have an initialized session row.
 */
function upsertUser({ id, name, email, createdAt }) {
  const now = createdAt || new Date().toISOString()
  stmtInsertUser.run({ id, name: name.trim(), email: email ? email.trim() : null, createdAt: now })

  // Ensure an initial session exists for this user so they appear in leaderboard & Excel
  const existing = stmtFindSessionByUserId.get(id)
  if (!existing) {
    const { lastInsertRowid: sessionId } = stmtInsertSession.run({
      userId: id,
      userName: name.trim(),
      email: email ? email.trim() : null,
      completedAt: null,
      status: 'INCOMPLETE',
      updatedAt: now,
    })

    for (const title of DEFAULT_QUESTION_TITLES) {
      stmtInsertLevel.run({
        sessionId,
        title,
        solved: 0,
        timeTakenSeconds: null,
      })
    }
  }
}

/**
 * Insert or update a player session with latest question timings.
 */
function upsertSession({ userId, userName, email = null, completedAt = null, status = 'INCOMPLETE', levels = [] }) {
  const now = new Date().toISOString()
  const existing = stmtFindSessionByUserId.get(userId)
  let sessionId

  // Also ensure user row is kept updated
  stmtInsertUser.run({
    id: userId,
    name: userName.trim(),
    email: email ? email.trim() : existing?.email || null,
    createdAt: now,
  })

  if (existing) {
    sessionId = existing.id
    // If already marked COMPLETE, preserve completion timestamp
    const finalCompletedAt = status === 'COMPLETE' ? (completedAt || existing.completed_at || now) : null
    stmtUpdateSession.run({
      sessionId,
      userName: userName.trim(),
      email: email ? email.trim() : existing.email,
      completedAt: finalCompletedAt,
      status,
      updatedAt: now,
    })
  } else {
    const res = stmtInsertSession.run({
      userId,
      userName: userName.trim(),
      email: email ? email.trim() : null,
      completedAt: status === 'COMPLETE' ? (completedAt || now) : null,
      status,
      updatedAt: now,
    })
    sessionId = res.lastInsertRowid
  }

  // Replace level results with the latest question breakdown
  if (Array.isArray(levels) && levels.length > 0) {
    stmtDeleteLevels.run(sessionId)
    for (const lvl of levels) {
      stmtInsertLevel.run({
        sessionId,
        title: lvl.title,
        solved: lvl.solved ? 1 : 0,
        timeTakenSeconds: lvl.timeTakenSeconds != null ? lvl.timeTakenSeconds : null,
      })
    }
  }

  return sessionId
}

/**
 * Find a session for a specific user ID.
 */
function getSessionByUserId(userId) {
  const session = stmtFindSessionByUserId.get(userId)
  if (!session) return null
  return {
    id: session.id,
    userId: session.user_id,
    userName: session.user_name,
    email: session.email,
    completedAt: session.completed_at,
    status: session.status || (session.completed_at ? 'COMPLETE' : 'INCOMPLETE'),
    updatedAt: session.updated_at || session.completed_at,
    levels: stmtGetLevelsForSession.all(session.id).map((l) => ({
      title: l.level_title,
      solved: Boolean(l.solved),
      timeTakenSeconds: l.time_taken_seconds,
    })),
  }
}

/**
 * Return every registered user & session, each enriched with its level results.
 * Shows all registered users even if they have not completed all tasks.
 */
function getAllSessions() {
  const rows = db
    .prepare(`
      SELECT
        s.id AS session_id,
        COALESCE(s.user_id, u.id) AS user_id,
        COALESCE(s.user_name, u.name) AS user_name,
        COALESCE(s.email, u.email) AS email,
        s.completed_at,
        COALESCE(s.status, 'INCOMPLETE') AS status,
        COALESCE(s.updated_at, u.created_at, s.completed_at) AS updated_at
      FROM users u
      LEFT JOIN sessions s ON u.id = s.user_id
      UNION
      SELECT
        s.id AS session_id,
        s.user_id,
        s.user_name,
        s.email,
        s.completed_at,
        COALESCE(s.status, 'INCOMPLETE') AS status,
        COALESCE(s.updated_at, s.completed_at) AS updated_at
      FROM sessions s
      WHERE s.user_id NOT IN (SELECT id FROM users)
      ORDER BY
        CASE WHEN status = 'COMPLETE' THEN 0 ELSE 1 END ASC,
        updated_at DESC
    `)
    .all()

  return rows.map((r) => {
    let levels = []
    if (r.session_id) {
      levels = stmtGetLevelsForSession.all(r.session_id).map((l) => ({
        title: l.level_title,
        solved: Boolean(l.solved),
        timeTakenSeconds: l.time_taken_seconds,
      }))
    }

    // If levels are missing or fewer than 10, fill in placeholders so timeline has all 10 slots
    if (levels.length === 0) {
      levels = DEFAULT_QUESTION_TITLES.map((title) => ({
        title,
        solved: false,
        timeTakenSeconds: null,
      }))
    }

    return {
      id: r.session_id || r.user_id,
      userId: r.user_id,
      userName: r.user_name,
      email: r.email,
      status: r.status,
      completedAt: r.completed_at,
      updatedAt: r.updated_at,
      levels,
    }
  })
}

module.exports = {
  upsertUser,
  upsertSession,
  getSessionByUserId,
  getAllSessions,
  insertSession: upsertSession, // compatibility alias
  insertLevelResult: () => {},  // compatibility alias
}
