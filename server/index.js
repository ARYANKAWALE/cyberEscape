/**
 * CyberEscape Room – Backend API
 * Stores player results in MongoDB and automatically syncs to Excel (.xlsx).
 *
 * Routes:
 *   POST /api/users                  – register / sync an operative account
 *   POST /api/users/sync             – bulk sync registered accounts from localStorage
 *   POST /api/results                – update question timings & mission completion status
 *   GET  /api/results                – get all registered accounts and sessions (for admin leaderboard)
 *   GET  /api/results/status/:userId – check if operative already completed final submission
 *   GET  /api/results/export         – download full data as .xlsx
 *   DELETE /api/users/:userId        – delete operative and game records
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const db = require('./db.js')
const { exportToExcel, syncExcelFile } = require('./exporter.js')

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors()) // allow requests from any origin (local or deployed Vercel frontend)
app.use(express.json())

// Ensure MongoDB is connected for every request (essential for serverless)
app.use(async (req, _res, next) => {
  try {
    await db.connectDB()
  } catch (err) {
    console.error('Database connection error:', err.message)
  }
  next()
})

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/users
 * Registers an operative account so it immediately appears in leaderboard and Excel.
 * Body: { id, name, email, createdAt }
 */
app.post('/api/users', async (req, res) => {
  const { id, name, email, createdAt } = req.body
  if (!id || !name) {
    return res.status(400).json({ error: 'Missing user id or name.' })
  }

  try {
    await db.upsertUser({ id, name, email, createdAt })
    const sessions = await db.getAllSessions()
    syncExcelFile(sessions).catch((e) =>
      console.warn('Could not auto-sync Excel on disk:', e),
    )
    res.status(201).json({ success: true })
  } catch (err) {
    console.error('Error upserting user:', err)
    res.status(500).json({ error: 'Failed to save user.' })
  }
})

/**
 * POST /api/users/sync
 * Bulk sync registered users from localStorage into MongoDB and Excel.
 * Body: { users: [{ id, name, email, createdAt }] }
 */
app.post('/api/users/sync', async (req, res) => {
  const { users } = req.body
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'Expected array of users.' })
  }

  try {
    for (const u of users) {
      if (u && u.id && u.name) {
        await db.upsertUser(u)
      }
    }
    const sessions = await db.getAllSessions()
    syncExcelFile(sessions).catch((e) =>
      console.warn('Could not auto-sync Excel on disk:', e),
    )
    res.json({ success: true, count: users.length })
  } catch (err) {
    console.error('Error syncing users:', err)
    res.status(500).json({ error: 'Failed to sync users.' })
  }
})

/**
 * POST /api/results
 * Progressively updates question timings after EVERY submission, or records final completion.
 *
 * Body: {
 *   userId: string,
 *   userName: string,
 *   email?: string,
 *   status?: 'COMPLETE' | 'INCOMPLETE',
 *   completedAt?: ISO string,
 *   levels: [{ title, solved, timeTakenSeconds }]
 * }
 */
app.post('/api/results', async (req, res) => {
  const { userId, userName, email, completedAt, status, levels } = req.body

  if (!userId || !userName || !Array.isArray(levels)) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  try {
    const existing = await db.getSessionByUserId(userId)

    // If team has already finalized their single submission, preserve complete status
    if (existing && existing.status === 'COMPLETE' && status !== 'COMPLETE') {
      return res.status(409).json({
        error: 'Team has already completed final submission. Further modifications are locked.',
        sessionId: existing.id,
        status: 'COMPLETE',
      })
    }

    const effectiveStatus =
      status || (levels.every((l) => l.solved) ? 'COMPLETE' : 'INCOMPLETE')

    const sessionId = await db.upsertSession({
      userId,
      userName,
      email,
      completedAt: effectiveStatus === 'COMPLETE' ? (completedAt || new Date().toISOString()) : null,
      status: effectiveStatus,
      levels,
    })

    // Auto-update the Excel file on disk immediately with the latest question breakdown
    const sessions = await db.getAllSessions()
    syncExcelFile(sessions).catch((e) =>
      console.warn('Could not auto-sync Excel on disk:', e),
    )

    res.status(200).json({ success: true, sessionId, status: effectiveStatus })
  } catch (err) {
    console.error('Error saving result:', err)
    res.status(500).json({ error: 'Failed to save result.' })
  }
})

/**
 * GET /api/results/status/:userId
 * Checks if a user has already submitted a final completed session.
 */
app.get('/api/results/status/:userId', async (req, res) => {
  try {
    const session = await db.getSessionByUserId(req.params.userId)
    const isSubmitted = Boolean(session && session.status === 'COMPLETE')
    res.json({ submitted: isSubmitted, session: session || null })
  } catch (err) {
    console.error('Error checking user submission status:', err)
    res.status(500).json({ error: 'Failed to check submission status.' })
  }
})

/**
 * DELETE /api/users/:userId
 * Permanently removes a user, their session, and all level results.
 */
app.delete('/api/users/:userId', async (req, res) => {
  const { userId } = req.params
  if (!userId) return res.status(400).json({ error: 'Missing userId.' })

  try {
    await db.deleteUser(userId)
    const sessions = await db.getAllSessions()
    syncExcelFile(sessions).catch((e) =>
      console.warn('Could not auto-sync Excel after delete:', e),
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting user:', err)
    res.status(500).json({ error: 'Failed to delete user.' })
  }
})

/**
 * GET /api/results
 * Returns all registered accounts and sessions (both COMPLETE and INCOMPLETE)
 * with their question timing timeline.
 */
app.get('/api/results', async (_req, res) => {
  try {
    const sessions = await db.getAllSessions()
    res.json(sessions)
  } catch (err) {
    console.error('Error fetching results:', err)
    res.status(500).json({ error: 'Failed to fetch results.' })
  }
})

/**
 * GET /api/results/export
 * Streams an Excel workbook download.
 */
app.get('/api/results/export', async (_req, res) => {
  try {
    const sessions = await db.getAllSessions()
    const buffer = await exportToExcel(sessions)

    const filename = `cyberEscape_results_${new Date().toISOString().slice(0, 10)}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (err) {
    console.error('Error exporting Excel:', err)
    res.status(500).json({ error: 'Failed to export Excel.' })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`✅  CyberEscape API running at http://localhost:${PORT}`)
    try {
      await db.connectDB()
      const sessions = await db.getAllSessions()
      syncExcelFile(sessions).catch((e) =>
        console.warn('Initial Excel sync warning:', e),
      )
    } catch (err) {
      console.warn('Startup sync notice:', err.message)
    }
  })
}

module.exports = app
