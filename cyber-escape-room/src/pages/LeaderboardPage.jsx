import { useEffect, useState } from 'react'
import { fetchResults, getExportUrl } from '../lib/api.js'
import { formatElapsed } from '../lib/time.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

// ── Helpers ──────────────────────────────────────────────────────────────────

function Badge({ children, kind = 'good' }) {
  const colors =
    kind === 'good'
      ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50'
      : 'bg-red-900/40 text-red-400 border border-red-700/50'
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-[10px] tracking-widest ${colors}`}>
      {children}
    </span>
  )
}

function Spinner() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="size-10 animate-spin rounded-full border-4 border-[#16405d] border-t-[#35f4d0]" />
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null) // session id being expanded

  useEffect(() => {
    fetchResults()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleExport() {
    window.open(getExportUrl(), '_blank')
  }

  function toggleExpand(id) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  return (
    <div className="min-h-screen bg-[#071020] text-[#cdd9e5]" style={{ fontFamily: "'Inter', 'Consolas', sans-serif" }}>
      {/* ── Header ── */}
      <header className="border-b border-[#16405d] bg-[#0a1628]/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-[3px] text-[#35f4d0]">
              // CYBER ESCAPE ROOM
            </div>
            <h1 className="mt-0.5 font-mono text-xl font-bold tracking-[2px] text-white">
              ADMIN LEADERBOARD
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] text-[#8baabe] sm:block">
              {user?.name}
            </span>
            <button
              id="exportExcelBtn"
              onClick={handleExport}
              className="flex items-center gap-2 rounded-[7px] border border-[#168d7a] bg-[#0d2a22] px-4 py-2 font-mono text-[11px] tracking-[1.5px] text-[#35f4d0] transition-all hover:bg-[#168d7a]/30 hover:shadow-[0_0_12px_#35f4d040]"
            >
              ⬇ EXPORT XLSX
            </button>
            <button
              id="backToGameBtn"
              onClick={() => navigate('/')}
              className="rounded-[7px] border border-[#16405d] bg-[#0d1f30] px-4 py-2 font-mono text-[11px] tracking-[1.5px] text-[#8baabe] transition hover:border-[#35f4d0]/50 hover:text-[#35f4d0]"
            >
              ← BACK
            </button>
            <button
              id="logoutBtn"
              onClick={() => { logout(); navigate('/login') }}
              className="rounded-[7px] border border-red-900/50 bg-red-950/20 px-4 py-2 font-mono text-[11px] tracking-[1.5px] text-red-400 transition hover:bg-red-900/30"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className="border-b border-[#16405d]/50 bg-[#071020]">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-px">
          {[
            { label: 'TOTAL SESSIONS', value: sessions.length },
            {
              label: 'ESCAPED',
              value: sessions.filter((s) => s.levels.every((l) => l.solved)).length,
            },
            {
              label: 'TIMED LEVELS COMPLETED',
              value: sessions.flatMap((s) => s.levels).filter((l) => l.solved && l.timeTakenSeconds != null).length,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 px-6 py-4"
            >
              <span className="font-mono text-2xl font-bold text-[#35f4d0]">{stat.value}</span>
              <span className="font-mono text-[9px] tracking-[2px] text-[#8baabe]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && <Spinner />}

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/30 p-6 text-center font-mono text-red-400">
            ⚠ Could not connect to the server: {error}
            <p className="mt-2 text-[11px] text-red-600">Make sure the backend is running on port 3001.</p>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="rounded-lg border border-[#16405d] bg-[#0a1628]/60 p-10 text-center font-mono text-[#8baabe]">
            No sessions recorded yet. Complete the escape room to see results here.
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[#16405d]">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_1fr_1fr_1fr_2.5rem] items-center border-b border-[#16405d] bg-[#0d1f30] px-5 py-3 font-mono text-[10px] tracking-[2px] text-[#35f4d0]">
              <span>#</span>
              <span>PLAYER</span>
              <span>COMPLETED AT</span>
              <span>LEVELS SOLVED</span>
              <span>FINAL TIME</span>
              <span />
            </div>

            {sessions.map((s, i) => {
              const solvedCount = s.levels.filter((l) => l.solved).length
              const timedLevel = s.levels.find((l) => l.timeTakenSeconds != null)
              const allSolved = solvedCount === s.levels.length
              const isOpen = expanded === s.id

              return (
                <div key={s.id} className="border-b border-[#16405d]/40 last:border-0">
                  {/* Row */}
                  <div
                    className={`grid cursor-pointer grid-cols-[3rem_1fr_1fr_1fr_1fr_2.5rem] items-center px-5 py-3.5 transition-colors ${isOpen ? 'bg-[#0d2a22]/60' : 'hover:bg-[#0d1f30]/70'}`}
                    onClick={() => toggleExpand(s.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleExpand(s.id)}
                  >
                    <span className="font-mono text-[13px] text-[#8baabe]">{i + 1}</span>
                    <span className="font-mono text-[13px] text-[#35f4d0]">{s.userName}</span>
                    <span className="font-mono text-[11px] text-[#8baabe]">{formatDate(s.completedAt)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px]">
                        {solvedCount} / {s.levels.length}
                      </span>
                      {allSolved && <Badge kind="good">ESCAPED</Badge>}
                    </div>
                    <span className="font-mono text-[13px] text-[#1de9b6]">
                      {timedLevel ? formatElapsed(timedLevel.timeTakenSeconds) : '—'}
                    </span>
                    <span className="text-center font-mono text-[#8baabe]">{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded level detail */}
                  {isOpen && (
                    <div className="border-t border-[#16405d]/30 bg-[#03101e] px-6 py-4">
                      <div className="mb-2 font-mono text-[9px] tracking-[2px] text-[#35f4d0]">
                        // LEVEL BREAKDOWN
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {s.levels.map((lvl) => (
                          <div
                            key={lvl.title}
                            className="flex items-center justify-between gap-3 rounded-lg border border-[#16405d]/50 bg-[#0a1628]/50 px-4 py-3"
                          >
                            <div>
                              <div className="font-mono text-[11px] text-[#cdd9e5]">{lvl.title}</div>
                              {lvl.timeTakenSeconds != null && (
                                <div className="mt-0.5 font-mono text-[10px] text-[#1de9b6]">
                                  ⏱ {formatElapsed(lvl.timeTakenSeconds)}
                                </div>
                              )}
                            </div>
                            <Badge kind={lvl.solved ? 'good' : 'bad'}>
                              {lvl.solved ? 'SOLVED' : 'UNSOLVED'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#16405d]/50 py-4 text-center font-mono text-[10px] tracking-[2px] text-[#8baabe]">
        CYBER ESCAPE ROOM // ADMIN PANEL // DATA STORED IN SQLITE
      </footer>
    </div>
  )
}
