/**
 * Generates an Excel workbook from session data using ExcelJS.
 *
 * Sheet 1 – "Leaderboard"
 *   Columns: #, Player, Completed At, Levels Solved, Final Level Time
 *
 * Sheet 2 – "Detailed Results"
 *   One row per (session × level):
 *   Player | Completed At | Level | Solved | Time Taken (mm:ss)
 */

const ExcelJS = require('exceljs')

// Helper: seconds → "MM:SS" string (or "—" for null)
function formatTime(seconds) {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Cyberpunk-inspired palette
const COLORS = {
  headerBg: '0D1B2A',     // very dark navy
  headerFg: '35F4D0',     // cyber mint
  altRow:   '0A1628',     // slightly lighter navy
  baseRow:  '071020',     // dark background
  accent:   '1DE9B6',     // bright teal
  solved:   '22C55E',     // green
  unsolved: 'EF4444',     // red
  border:   '16405D',     // blue-grey
}

function applyHeaderStyle(cell) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } }
  cell.font = { name: 'Consolas', bold: true, color: { argb: 'FF' + COLORS.headerFg }, size: 11 }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  cell.border = {
    bottom: { style: 'medium', color: { argb: 'FF' + COLORS.border } },
  }
}

function applyDataStyle(cell, rowIdx, isHighlight = false) {
  const bg = rowIdx % 2 === 0 ? COLORS.baseRow : COLORS.altRow
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } }
  cell.font = {
    name: 'Consolas',
    color: { argb: isHighlight ? 'FF' + COLORS.accent : 'FFCDD9E5' },
    size: 10,
  }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
}

async function exportToExcel(sessions) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'CyberEscape Room'
  workbook.created = new Date()

  // ──────────────────────────────────────────────
  // Sheet 1: Leaderboard
  // ──────────────────────────────────────────────
  const sheet1 = workbook.addWorksheet('Leaderboard', {
    properties: { tabColor: { argb: 'FF' + COLORS.headerFg } },
  })

  sheet1.columns = [
    { header: '#',              key: 'rank',        width: 6  },
    { header: 'Player',         key: 'player',      width: 22 },
    { header: 'Completed At',   key: 'completedAt', width: 22 },
    { header: 'Levels Solved',  key: 'levelsSolved',width: 16 },
    { header: 'Final Level Time',key:'finalTime',   width: 18 },
  ]

  // Style header row
  const h1 = sheet1.getRow(1)
  h1.height = 24
  h1.eachCell((cell) => applyHeaderStyle(cell))

  // Data rows
  sessions.forEach((s, i) => {
    const solved = s.levels.filter((l) => l.solved).length
    const timedLevel = s.levels.find((l) => l.timeTakenSeconds != null)
    const row = sheet1.addRow({
      rank: i + 1,
      player: s.userName,
      completedAt: new Date(s.completedAt).toLocaleString(),
      levelsSolved: `${solved} / ${s.levels.length}`,
      finalTime: timedLevel ? formatTime(timedLevel.timeTakenSeconds) : '—',
    })
    row.height = 20
    row.eachCell((cell, colNum) => applyDataStyle(cell, i, colNum === 2))
  })

  sheet1.getRow(1).font = { name: 'Consolas', bold: true, color: { argb: 'FF' + COLORS.headerFg }, size: 11 }

  // ──────────────────────────────────────────────
  // Sheet 2: Detailed Results
  // ──────────────────────────────────────────────
  const sheet2 = workbook.addWorksheet('Detailed Results', {
    properties: { tabColor: { argb: 'FF1B75BC' } },
  })

  sheet2.columns = [
    { header: 'Player',        key: 'player',    width: 22 },
    { header: 'Completed At',  key: 'completedAt',width: 22 },
    { header: 'Level',         key: 'level',     width: 24 },
    { header: 'Solved',        key: 'solved',    width: 10 },
    { header: 'Time Taken',    key: 'timeTaken', width: 14 },
  ]

  const h2 = sheet2.getRow(1)
  h2.height = 24
  h2.eachCell((cell) => applyHeaderStyle(cell))

  let rowIdx = 0
  for (const s of sessions) {
    for (const lvl of s.levels) {
      const row = sheet2.addRow({
        player: s.userName,
        completedAt: new Date(s.completedAt).toLocaleString(),
        level: lvl.title,
        solved: lvl.solved ? 'YES' : 'NO',
        timeTaken: formatTime(lvl.timeTakenSeconds),
      })
      row.height = 20

      row.eachCell((cell, colNum) => {
        applyDataStyle(cell, rowIdx, colNum === 1)
        if (colNum === 4) {
          // Colour YES/NO differently
          cell.font = {
            name: 'Consolas',
            bold: true,
            color: { argb: lvl.solved ? 'FF' + COLORS.solved : 'FF' + COLORS.unsolved },
            size: 10,
          }
        }
      })
      rowIdx++
    }
  }

  // Export to buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

module.exports = { exportToExcel }
