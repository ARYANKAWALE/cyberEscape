/**
 * CyberEscape Room – Backend API
 * Stores player results in SQLite and can export to Excel (.xlsx).
 *
 * Routes:
 *   POST /api/results        – save a completed game session
 *   GET  /api/results        – get all sessions (for admin/leaderboard)
 *   GET  /api/results/export – download full data as .xlsx
 */

const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./db.js')
const { exportToExcel } = require('./exporter.js')

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' })) // Vite dev server
app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/results
 * Body: {
 *   userId: string,
 *   userName: string,
 *   completedAt: ISO string,
 *   levels: [{ title, solved, timeTakenSeconds }]
 * }
 */
app.post('/api/results', (req, res) => {
  const { userId, userName, completedAt, levels } = req.body

  if (!userId || !userName || !Array.isArray(levels)) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  try {
    const sessionId = db.insertSession({ userId, userName, completedAt })
    for (const lvl of levels) {
      db.insertLevelResult({
        sessionId,
        title: lvl.title,
        solved: lvl.solved ? 1 : 0,
        timeTakenSeconds: lvl.timeTakenSeconds ?? null,
      })
    }
    res.status(201).json({ sessionId })
  } catch (err) {
    console.error('Error saving result:', err)
    res.status(500).json({ error: 'Failed to save result.' })
  }
})

/**
 * GET /api/results
 * Returns all sessions with their per-level data.
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
})
