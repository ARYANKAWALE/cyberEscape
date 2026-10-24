/**
 * Generates an Excel workbook from session data using ExcelJS.
 * Supports 2 questions per level (10 total questions).
 *
 * Sheet 1 – "Leaderboard & Timing"
 *   Columns:
 *     Rank | Operative ID | Player | Status (COMPLETE / INCOMPLETE) | Solved |
 *     L1.Q1 | L1.Q2 | L2.Q1 | L2.Q2 | L3.Q1 | L3.Q2 | L4.Q1 | L4.Q2 | L5.Q1 | L5.Q2 |
 *     TOTAL TIME | Completed / Updated At
 *
 * Sheet 2 – "Question Breakdown"
 *   Detailed row per (session × question):
 *     Operative ID | Player | Overall Status | Q# | Challenge Title | Question Status | Solving Time (MM:SS) | Seconds | Last Updated
 */

const ExcelJS = require('exceljs')
const path = require('path')

// Helper: seconds → "MM:SS" string (or "—" for null/undefined)
function formatTime(seconds) {
  if (seconds == null || isNaN(seconds)) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Cyberpunk-inspired palette
const COLORS = {
  headerBg:   '0D1B2A',     // dark navy
  headerFg:   '35F4D0',     // cyber mint
  altRow:     '0A1628',     // navy
  baseRow:    '071020',     // darker navy
  accent:     '1DE9B6',     // bright teal
  totalBg:    '0f2838',     // highlight for totals
  completeFg: '22C55E',     // green
  incompFg:   'F59E0B',     // amber/yellow
  border:     '16405D',     // blue-grey
}

function applyHeaderStyle(cell) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + COLORS.headerBg } }
  cell.font = { name: 'Consolas', bold: true, color: { argb: 'FF' + COLORS.headerFg }, size: 9 }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    left: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    bottom: { style: 'medium', color: { argb: 'FF' + COLORS.border } },
    right: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
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
  cell.border = {
    bottom: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    left: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
    right: { style: 'thin', color: { argb: 'FF' + COLORS.border } },
  }
}

async function buildWorkbook(sessions) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'CyberEscape Room'
  workbook.created = new Date()

  // ──────────────────────────────────────────────
  // Sheet 1: Leaderboard & Timing (10 Questions)
  // ──────────────────────────────────────────────
  const sheet1 = workbook.addWorksheet('Leaderboard & Timing', {
    properties: { tabColor: { argb: 'FF' + COLORS.headerFg } },
  })

  sheet1.columns = [
    { header: '#',                  key: 'rank',         width: 5  },
    { header: 'Operative ID',       key: 'userId',       width: 22 },
    { header: 'Player',             key: 'player',       width: 18 },
    { header: 'Status',             key: 'status',       width: 14 },
    { header: 'Solved',             key: 'levelsSolved', width: 10 },
    { header: 'L1.Q1\nSequence',    key: 'l1q1',         width: 13 },
    { header: 'L1.Q2\nBinary',      key: 'l1q2',         width: 13 },
    { header: 'L2.Q1\nCaesar',      key: 'l2q1',         width: 13 },
    { header: 'L2.Q2\nAtbash',      key: 'l2q2',         width: 13 },
    { header: 'L3.Q1\nLeapSeq',     key: 'l3q1',         width: 13 },
    { header: 'L3.Q2\nVowel',       key: 'l3q2',         width: 13 },
    { header: 'L4.Q1\nSignal',      key: 'l4q1',         width: 13 },
    { header: 'L4.Q2\nHardware',    key: 'l4q2',         width: 13 },
    { header: 'L5.Q1\nReverse',     key: 'l5q1',         width: 13 },
    { header: 'L5.Q2\nBase64',      key: 'l5q2',         width: 13 },
    { header: 'TOTAL SOLVING\nTIME',key: 'totalTime',    width: 16 },
    { header: 'Completed / Updated',key: 'timestamp',    width: 22 },
  ]

  const h1 = sheet1.getRow(1)
  h1.height = 32
  h1.eachCell((cell) => applyHeaderStyle(cell))

  sessions.forEach((s, i) => {
    const solvedCount = (s.levels || []).filter((l) => l.solved).length
    const totalLevels = s.levels?.length || 10

    // Extract time taken by index for up to 10 questions
    const qTimes = []
    for (let idx = 0; idx < 10; idx++) {
      qTimes.push(s.levels?.[idx]?.timeTakenSeconds)
    }

    const totalSeconds = (s.levels || []).reduce((acc, l) => {
      return l.timeTakenSeconds != null ? acc + l.timeTakenSeconds : acc
    }, 0)

    const hasAnyTime = (s.levels || []).some((l) => l.timeTakenSeconds != null)
    const isComplete = s.status === 'COMPLETE' || solvedCount === totalLevels
    const statusText = isComplete ? 'COMPLETE' : 'INCOMPLETE'
    const dateStr = s.completedAt || s.updatedAt
      ? new Date(s.completedAt || s.updatedAt).toLocaleString('en-IN')
      : '—'

    const row = sheet1.addRow({
      rank: i + 1,
      userId: s.userId || '—',
      player: s.userName || 'Operative',
      status: statusText,
      levelsSolved: `${solvedCount} / ${totalLevels}`,
      l1q1: formatTime(qTimes[0]),
      l1q2: formatTime(qTimes[1]),
      l2q1: formatTime(qTimes[2]),
      l2q2: formatTime(qTimes[3]),
      l3q1: formatTime(qTimes[4]),
      l3q2: formatTime(qTimes[5]),
      l4q1: formatTime(qTimes[6]),
      l4q2: formatTime(qTimes[7]),
      l5q1: formatTime(qTimes[8]),
      l5q2: formatTime(qTimes[9]),
      totalTime: hasAnyTime ? formatTime(totalSeconds) : '—',
      timestamp: dateStr,
    })
    row.height = 22

    row.eachCell((cell, colNum) => {
      const isPlayer = colNum === 3
      const isTotal = colNum === 16
      const isStatus = colNum === 4

      applyDataStyle(cell, i, isPlayer || isTotal)

      if (isStatus) {
        cell.font = {
          name: 'Consolas',
          bold: true,
          color: { argb: isComplete ? 'FF' + COLORS.completeFg : 'FF' + COLORS.incompFg },
          size: 10,
        }
      }
      if (isTotal) {
        cell.font = { name: 'Consolas', bold: true, color: { argb: 'FF' + COLORS.accent }, size: 10 }
      }
    })
  })

  // ──────────────────────────────────────────────
  // Sheet 2: Question Breakdown
  // ──────────────────────────────────────────────
  const sheet2 = workbook.addWorksheet('Question Breakdown', {
    properties: { tabColor: { argb: 'FF1B75BC' } },
  })

  sheet2.columns = [
    { header: 'Operative ID',       key: 'userId',       width: 22 },
    { header: 'Player',             key: 'player',       width: 20 },
    { header: 'Overall Status',     key: 'missionStatus',width: 16 },
    { header: 'Q#',                 key: 'qNum',         width: 8  },
    { header: 'Challenge',          key: 'challenge',    width: 32 },
    { header: 'Question Status',    key: 'status',       width: 14 },
    { header: 'Solving Time',       key: 'timeTaken',    width: 16 },
    { header: 'Seconds',            key: 'seconds',      width: 12 },
    { header: 'Timestamp',          key: 'timestamp',    width: 22 },
  ]

  const h2 = sheet2.getRow(1)
  h2.height = 24
  h2.eachCell((cell) => applyHeaderStyle(cell))

  let rowIdx = 0
  for (const s of sessions) {
    const isComplete = s.status === 'COMPLETE' || s.levels?.every((l) => l.solved)
    const missionStatus = isComplete ? 'COMPLETE' : 'INCOMPLETE'
    const dateStr = s.completedAt || s.updatedAt
      ? new Date(s.completedAt || s.updatedAt).toLocaleString('en-IN')
      : '—'

    ;(s.levels || []).forEach((lvl, idx) => {
      const row = sheet2.addRow({
        userId: s.userId || '—',
        player: s.userName || 'Operative',
        missionStatus,
        qNum: `Q${idx + 1}`,
        challenge: lvl.title,
        status: lvl.solved ? 'SOLVED' : 'INCOMPLETE',
        timeTaken: formatTime(lvl.timeTakenSeconds),
        seconds: lvl.timeTakenSeconds ?? '—',
        timestamp: dateStr,
      })
      row.height = 20

      row.eachCell((cell, colNum) => {
        applyDataStyle(cell, rowIdx)
        if (colNum === 3) {
          cell.font = {
            name: 'Consolas',
            bold: true,
            color: { argb: isComplete ? 'FF' + COLORS.completeFg : 'FF' + COLORS.incompFg },
            size: 9,
          }
        }
        if (colNum === 6) {
          cell.font = {
            name: 'Consolas',
            bold: true,
            color: { argb: lvl.solved ? 'FF' + COLORS.completeFg : 'FF8BAABE' },
            size: 9,
          }
        }
      })
      rowIdx++
    })
  }

  return workbook
}

async function exportToExcel(sessions) {
  const workbook = await buildWorkbook(sessions)
  return workbook.xlsx.writeBuffer()
}

async function syncExcelFile(sessions) {
  const workbook = await buildWorkbook(sessions)
  const filePath = path.join(__dirname, 'cyberEscape_results.xlsx')
  await workbook.xlsx.writeFile(filePath)
  console.log(`📊 Excel database updated: ${filePath}`)
}

module.exports = { exportToExcel, syncExcelFile }
