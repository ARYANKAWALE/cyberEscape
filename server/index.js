/**
 * CyberEscape Room – Backend API
 * Stores player results in SQLite and automatically syncs to Excel (.xlsx).
 *
 * Routes:
 *   POST /api/users          – register / sync an operative account
 *   POST /api/users/sync     – bulk sync registered accounts from localStorage
 *   POST /api/results        – update question timings & mission completion status
 *   GET  /api/results        – get all registered accounts and sessions (for admin leaderboard)
 *   GET  /api/results/status/:userId – check if operative already completed final submission
 *   GET  /api/results/export – download full data as .xlsx
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./db.js')
const { exportToExcel, syncExcelFile } = require('./exporter.js')

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/ })) // any localhost port (Vite dev)
app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/users
 * Registers an operative account so it immediately appears in leaderboard and Excel.
 * Body: { id, name, email, createdAt }
 */
app.post('/api/users', (req, res) => {
  const { id, name, email, createdAt } = req.body
  if (!id || !name) {
    return res.status(400).json({ error: 'Missing user id or name.' })
  }

  try {
    db.upsertUser({ id, name, email, createdAt })
    syncExcelFile(db.getAllSessions()).catch((e) =>
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
 * Bulk sync registered users from localStorage into SQLite and Excel.
 * Body: { users: [{ id, name, email, createdAt }] }
 */
app.post('/api/users/sync', (req, res) => {
  const { users } = req.body
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: 'Expected array of users.' })
  }

  try {
    for (const u of users) {
      if (u && u.id && u.name) {
        db.upsertUser(u)
      }
    }
    syncExcelFile(db.getAllSessions()).catch((e) =>
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
app.post('/api/results', (req, res) => {
  const { userId, userName, email, completedAt, status, levels } = req.body

  if (!userId || !userName || !Array.isArray(levels)) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  try {
    const existing = db.getSessionByUserId(userId)

    // If operative has already finalized their single submission, preserve complete status
    if (existing && existing.status === 'COMPLETE' && status !== 'COMPLETE') {
      return res.status(409).json({
        error: 'Operative has already completed final submission. Further modifications are locked.',
        sessionId: existing.id,
        status: 'COMPLETE',
      })
    }

    const effectiveStatus =
      status || (levels.every((l) => l.solved) ? 'COMPLETE' : 'INCOMPLETE')

    const sessionId = db.upsertSession({
      userId,
      userName,
      email,
      completedAt: effectiveStatus === 'COMPLETE' ? (completedAt || new Date().toISOString()) : null,
      status: effectiveStatus,
      levels,
    })

    // Auto-update the Excel file on disk immediately with the latest question breakdown
    syncExcelFile(db.getAllSessions()).catch((e) =>
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
app.get('/api/results/status/:userId', (req, res) => {
  try {
    const session = db.getSessionByUserId(req.params.userId)
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
app.delete('/api/users/:userId', (req, res) => {
  const { userId } = req.params
  if (!userId) return res.status(400).json({ error: 'Missing userId.' })

  try {
    db.deleteUser(userId)
    syncExcelFile(db.getAllSessions()).catch((e) =>
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
 * with their full 10-question timing timeline.
 */
app.get('/api/results', (_req, res) => {
  try {
    const sessions = db.getAllSessions()
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
    const sessions = db.getAllSessions()
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
app.listen(PORT, () => {
  console.log(`✅  CyberEscape API running at http://localhost:${PORT}`)
  // Sync Excel file on server launch with current DB state
  try {
    syncExcelFile(db.getAllSessions()).catch((e) =>
      console.warn('Initial Excel sync warning:', e),
    )
  } catch {}
})
