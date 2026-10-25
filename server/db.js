/**
 * MongoDB database layer for CyberEscape results using Mongoose.
 * Replaces SQLite with a robust, production-ready cloud MongoDB store.
 */

const mongoose = require('mongoose')

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

function isAdminAccount(name, email) {
  const normEmail = (email || '').toLowerCase().trim()
  const normName = (name || '').toLowerCase().trim()
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
  return (
    normEmail === 'admin1@gmail.com' ||
    normEmail === 'admin@cyberescape.com' ||
    (adminEmail && normEmail === adminEmail) ||
    normName === 'admin'
  )
}

/**
 * Upsert an operative user account.
 */
async function upsertUser({ id, name, email, createdAt }) {
  if (isAdminAccount(name, email)) {
    return null
  }
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
  if (isAdminAccount(userName, email)) {
    return null
  }
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
  const [rawUsers, rawSessions] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).lean(),
    Session.find({}).sort({ updatedAt: -1 }).lean(),
  ])

  const users = rawUsers.filter((u) => !isAdminAccount(u.name, u.email))
  const sessions = rawSessions.filter((s) => !isAdminAccount(s.userName, s.email))

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

  // Sort: COMPLETE first, then by solved count DESC, then fastest time ASC, then date
  results.sort((a, b) => {
    const aSolved = (a.levels || []).filter((l) => l.solved).length
    const bSolved = (b.levels || []).filter((l) => l.solved).length
    const aComp = a.status === 'COMPLETE' || aSolved >= 5
    const bComp = b.status === 'COMPLETE' || bSolved >= 5

    if (aComp !== bComp) return aComp ? -1 : 1
    if (aSolved !== bSolved) return bSolved - aSolved

    const aTime = (a.levels || []).reduce(
      (acc, l) => (l.timeTakenSeconds != null ? acc + l.timeTakenSeconds : acc),
      0,
    )
    const bTime = (b.levels || []).reduce(
      (acc, l) => (l.timeTakenSeconds != null ? acc + l.timeTakenSeconds : acc),
      0,
    )
    if (aTime > 0 && bTime > 0 && aTime !== bTime) return aTime - bTime
    if (aTime > 0 && bTime === 0) return -1
    if (bTime > 0 && aTime === 0) return 1

    const aDate = a.completedAt ? new Date(a.completedAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0)
    const bDate = b.completedAt ? new Date(b.completedAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0)
    return aDate - bDate
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

// Automatically connect on module load if MONGODB_URI is available
connectDB().catch(() => {})

module.exports = {
  connectDB,
  upsertUser,
  getSessionByUserId,
  upsertSession,
  getAllSessions,
  deleteUser,
}
