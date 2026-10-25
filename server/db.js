/**
 * MongoDB database layer for CyberEscape results using Mongoose.
 * Replaces SQLite with a robust, production-ready cloud MongoDB store.
 */

const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')

const DEFAULT_QUESTION_TITLES = [
  'L1: The Encrypted Keyboard',
  'L2: The Firewall Escape',
  "L3: The Hacker's Identity",
  'L4: The Central Server Password',
  'L5: The Final Locker Breach',
]

// ── Mongoose Schemas & Models ────────────────────────────────────────────────

const LevelResultSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    solved: { type: Boolean, default: false },
    timeTakenSeconds: { type: Number, default: null },
  },
  { _id: false },
)

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true },
)

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    email: { type: String, default: null },
    status: { type: String, enum: ['COMPLETE', 'INCOMPLETE'], default: 'INCOMPLETE' },
    completedAt: { type: String, default: null },
    updatedAt: { type: String, default: () => new Date().toISOString() },
    levels: [LevelResultSchema],
  },
  { timestamps: true },
)

const User = mongoose.model('User', UserSchema)
const Session = mongoose.model('Session', SessionSchema)

// ── Connection ───────────────────────────────────────────────────────────────

let isConnecting = false

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('[MongoDB] No MONGODB_URI provided in .env! Database calls will fail.')
    return null
  }

  if (isConnecting) return

  try {
    isConnecting = true
    await mongoose.connect(uri, {
      dbName: 'cyberescape',
      serverSelectionTimeoutMS: 10000,
    })
    console.log('[MongoDB] Connected successfully to database: cyberescape')
    // Attempt automatic migration from SQLite if needed
    await migrateFromSqlite().catch((e) =>
      console.warn('[MongoDB] Auto-migration check finished:', e.message),
    )
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message)
  } finally {
    isConnecting = false
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaultLevels() {
  return DEFAULT_QUESTION_TITLES.map((title) => ({
    title,
    solved: false,
    timeTakenSeconds: null,
  }))
}

function formatSession(s) {
  let levels = Array.isArray(s.levels) && s.levels.length > 0 ? s.levels : buildDefaultLevels()

  return {
    id: s._id ? s._id.toString() : s.userId,
    userId: s.userId,
    userName: s.userName,
    email: s.email || null,
    status: s.status || 'INCOMPLETE',
    completedAt: s.completedAt || null,
    updatedAt: s.updatedAt || s.createdAt || null,
    levels: levels.map((l) => ({
      title: l.title,
      solved: Boolean(l.solved),
      timeTakenSeconds: l.timeTakenSeconds != null ? Number(l.timeTakenSeconds) : null,
    })),
  }
}

// ── CRUD Methods ─────────────────────────────────────────────────────────────

/**
 * Upsert an operative user account.
 */
async function upsertUser({ id, name, email, createdAt }) {
  await connectDB()
  const filter = { userId: id }
  const update = {
    userId: id,
    name,
    email: email || null,
    createdAt: createdAt || new Date().toISOString(),
  }
  return User.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true })
}

/**
 * Get the latest session for a given userId.
 */
async function getSessionByUserId(userId) {
  await connectDB()
  const doc = await Session.findOne({ userId }).sort({ updatedAt: -1 })
  return doc ? formatSession(doc) : null
}

/**
 * Upsert a session and its level results.
 */
async function upsertSession({ userId, userName, email, completedAt, status, levels }) {
  await connectDB()
  const now = new Date().toISOString()
  const effectiveStatus = status || (levels?.every((l) => l.solved) ? 'COMPLETE' : 'INCOMPLETE')

  let session = await Session.findOne({ userId })

  const formattedLevels = (levels || []).map((l) => ({
    title: l.title,
    solved: Boolean(l.solved),
    timeTakenSeconds: l.timeTakenSeconds != null ? Number(l.timeTakenSeconds) : null,
  }))

  if (session) {
    session.userName = userName
    if (email) session.email = email
    session.status = effectiveStatus
    if (effectiveStatus === 'COMPLETE') {
      session.completedAt = completedAt || session.completedAt || now
    }
    session.updatedAt = now
    session.levels = formattedLevels
    await session.save()
  } else {
    session = await Session.create({
      userId,
      userName,
      email: email || null,
      status: effectiveStatus,
      completedAt: effectiveStatus === 'COMPLETE' ? (completedAt || now) : null,
      updatedAt: now,
      levels: formattedLevels.length > 0 ? formattedLevels : buildDefaultLevels(),
    })
  }

  return session._id.toString()
}

/**
 * Returns all registered accounts and sessions for the leaderboard and Excel export.
 */
async function getAllSessions() {
  await connectDB()
  const [users, sessions] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).lean(),
    Session.find({}).sort({ updatedAt: -1 }).lean(),
  ])

  const sessionMap = new Map()
  for (const s of sessions) {
    if (!sessionMap.has(s.userId)) {
      sessionMap.set(s.userId, s)
    }
  }

  const results = []
  const seenUserIds = new Set()

  // 1. Add all registered users
  for (const u of users) {
    seenUserIds.add(u.userId)
    const s = sessionMap.get(u.userId)
    if (s) {
      results.push(formatSession(s))
    } else {
      results.push({
        id: u.userId,
        userId: u.userId,
        userName: u.name,
        email: u.email || null,
        status: 'INCOMPLETE',
        completedAt: null,
        updatedAt: u.createdAt,
        levels: buildDefaultLevels(),
      })
    }
  }

  // 2. Add sessions that didn't have an explicit user record (e.g. legacy sessions)
  for (const s of sessions) {
    if (!seenUserIds.has(s.userId)) {
      results.push(formatSession(s))
      seenUserIds.add(s.userId)
    }
  }

  // Sort: COMPLETE first, then by updatedAt DESC
  results.sort((a, b) => {
    const aComp = a.status === 'COMPLETE' ? 0 : 1
    const bComp = b.status === 'COMPLETE' ? 0 : 1
    if (aComp !== bComp) return aComp - bComp

    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return bTime - aTime
  })

  return results
}

/**
 * Permanently delete a user and all their game sessions.
 */
async function deleteUser(userId) {
  await connectDB()
  await Promise.all([
    User.deleteMany({ userId }),
    Session.deleteMany({ userId }),
  ])
}

// ── SQLite → MongoDB One-Time Auto-Migration ─────────────────────────────────

async function migrateFromSqlite() {
  const sqliteFile = path.join(__dirname, 'cyberEscape.db')
  if (!fs.existsSync(sqliteFile)) return

  // Check if MongoDB already has users or sessions
  const existingCount = await Session.countDocuments()
  if (existingCount > 0) return // already populated

  console.log('[Migration] Migrating existing SQLite database records to MongoDB...')
  let Database
  try {
    Database = require('better-sqlite3')
  } catch {
    return
  }

  const sdb = new Database(sqliteFile)

  try {
    // 1. Migrate Users
    const users = sdb.prepare('SELECT * FROM users').all()
    for (const u of users) {
      await User.findOneAndUpdate(
        { userId: u.id },
        {
          userId: u.id,
          name: u.name,
          email: u.email || null,
          createdAt: u.created_at,
        },
        { upsert: true },
      )
    }

    // 2. Migrate Sessions & Level Results
    const sessions = sdb.prepare('SELECT * FROM sessions').all()
    const stmtLevels = sdb.prepare(
      'SELECT level_title, solved, time_taken_seconds FROM level_results WHERE session_id = ? ORDER BY id ASC',
    )

    for (const s of sessions) {
      const dbLevels = stmtLevels.all(s.id)
      const levels = dbLevels.map((l) => ({
        title: l.level_title,
        solved: Boolean(l.solved),
        timeTakenSeconds: l.time_taken_seconds != null ? Number(l.time_taken_seconds) : null,
      }))

      await Session.findOneAndUpdate(
        { userId: s.user_id },
        {
          userId: s.user_id,
          userName: s.user_name,
          email: s.email || null,
          status: s.status || 'INCOMPLETE',
          completedAt: s.completed_at || null,
          updatedAt: s.updated_at || s.completed_at || new Date().toISOString(),
          levels: levels.length > 0 ? levels : buildDefaultLevels(),
        },
        { upsert: true },
      )
    }

    console.log(`[Migration] Successfully migrated ${users.length} users and ${sessions.length} sessions to MongoDB!`)
  } catch (err) {
    console.error('[Migration] Migration error:', err)
  } finally {
    try {
      sdb.close()
    } catch {}
  }
}

// Automatically connect on module load if MONGODB_URI is available
connectDB().catch(() => {})

module.exports = {
  connectDB,
  upsertUser,
  getSessionByUserId,
  upsertSession,
  getAllSessions,
  deleteUser,
  migrateFromSqlite,
  // Compatibility aliases
  insertSession: upsertSession,
  insertLevelResult: () => {},
}
