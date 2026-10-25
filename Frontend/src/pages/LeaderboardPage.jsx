import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  ChevronDown,
  ChevronUp,
  Crown,
  Download,
  LogOut,
  Medal,
  Trash2,
  Trophy,
} from 'lucide-react'
import { deleteUserApi, fetchResults, getExportUrl, syncUsersApi } from '../lib/api.js'
import { ADMIN_EMAIL, getUsers, removeUser } from '../lib/authStorage.js'
import { formatElapsed } from '../lib/time.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

// ── Helpers ──────────────────────────────────────────────────────────────────

function Badge({ children, kind = 'good' }) {
  let colors = 'bg-emerald-900/40 text-emerald-300 border border-emerald-600/60'
  if (kind === 'bad') {
    colors = 'bg-amber-950/40 text-amber-400 border border-amber-600/60'
  } else if (kind === 'dim') {
    colors = 'bg-[#0d1f30] text-[#8baabe] border border-[#16405d]'
  }

  return (
    <span className={`inline-block rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest ${colors}`}>
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
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  const [deletingId, setDeletingId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [showOnlyTop3, setShowOnlyTop3] = useState(true)

  useEffect(() => {
    // 1. Sync all registered local accounts to backend (excluding admin)
    const localUsers = getUsers().filter(
      (u) =>
        !u.isAdmin &&
        u.email !== ADMIN_EMAIL &&
        u.email !== 'admin1@gmail.com' &&
        u.email !== 'admin@cyberescape.com' &&
        u.name !== 'Admin',
    )
    const syncPromise =
      Array.isArray(localUsers) && localUsers.length > 0
        ? syncUsersApi(localUsers.map(({ id, name, email, createdAt }) => ({ id, name, email, createdAt })))
        : Promise.resolve()

    syncPromise
      .then(() => fetchResults())
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleExport() {
    window.open(getExportUrl(), '_blank')
  }

  function toggleExpand(id) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  async function handleDeleteUser(e, s) {
    e.stopPropagation()
    const targetId = s.userId || s.id
    const displayName = s.userName || s.email || targetId

    if (
      !window.confirm(
        `Are you sure you want to permanently delete team "${displayName}"?\n\nThis will remove their team account and all game progress from the database and leaderboard.`,
      )
    ) {
      return
    }

    setDeletingId(targetId)
    setActionError(null)

    try {
      // 1. Delete from SQLite server database
      await deleteUserApi(targetId)
      // 2. Delete from localStorage so it does not re-sync on refresh
      removeUser(targetId)
      if (s.userId && s.userId !== targetId) removeUser(s.userId)
      if (s.id && s.id !== targetId) removeUser(s.id)
      // 3. Remove from UI state
      setSessions((prev) =>
        prev.filter((item) => item.userId !== targetId && item.id !== targetId),
      )
    } catch (err) {
      console.error('Failed to delete user:', err)
      setActionError(`Failed to delete team: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const completedCount = sessions.filter(
    (s) => s.status === 'COMPLETE' || s.levels?.every((l) => l.solved),
  ).length
  const incompleteCount = sessions.length - completedCount
  const totalQuestionsSolved = sessions
    .flatMap((s) => s.levels || [])
    .filter((l) => l.solved).length

  // Competitive esports ranking:
  // 1. Completed teams (all 5 levels solved) first
  // 2. Highest number of solved levels
  // 3. Fastest total completion time (lowest seconds)
  // 4. Earliest completion timestamp
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
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
  }, [sessions])

  const top3 = useMemo(() => sortedSessions.slice(0, 3), [sortedSessions])
  const displaySessions = showOnlyTop3 ? top3 : sortedSessions

  return (
    <div
      className="min-h-screen bg-[#071020] text-[#cdd9e5]"
      style={{ fontFamily: "'Inter', 'Consolas', sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="border-b border-[#16405d] bg-[#0a1628]/80 px-4 py-3.5 sm:px-6 sm:py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#168d7a] bg-[#0d2a22]">
              <Trophy className="size-5 text-[#35f4d0]" />
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[3px] text-[#35f4d0]">
                // CYBER ESCAPE ROOM
              </div>
              <h1 className="mt-0.5 font-mono text-lg sm:text-xl font-bold tracking-[2px] text-white">
                ADMIN LEADERBOARD
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <span className="hidden font-mono text-[11px] text-[#8baabe] lg:block">
              {user?.name}
            </span>
            <button
              id="exportExcelBtn"
              onClick={handleExport}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-[7px] border border-[#168d7a] bg-[#0d2a22] px-3.5 py-2 font-mono text-[11px] tracking-[1.5px] text-[#35f4d0] transition-all hover:bg-[#168d7a]/30 hover:shadow-[0_0_12px_#35f4d040] active:scale-95"
            >
              <Download className="size-3.5" />
              <span>EXPORT XLSX</span>
            </button>
            <button
              id="backToGameBtn"
              onClick={() => navigate('/')}
              className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-[7px] border border-[#16405d] bg-[#0d1f30] px-3.5 py-2 font-mono text-[11px] tracking-[1.5px] text-[#8baabe] transition-all hover:border-[#35f4d0]/50 hover:text-[#35f4d0] active:scale-95"
            >
              <ArrowLeft className="size-3.5" />
              <span>BACK</span>
            </button>
            <button
              id="logoutBtn"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-[7px] border border-red-900/50 bg-red-950/20 px-3.5 py-2 font-mono text-[11px] tracking-[1.5px] text-red-400 transition-all hover:bg-red-900/30 active:scale-95"
            >
              <LogOut className="size-3.5" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className="border-b border-[#16405d]/50 bg-[#071020]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-[#16405d]/40 sm:grid-cols-4 sm:divide-y-0">
          {[
            { label: 'REGISTERED TEAMS', value: sessions.length },
            { label: 'COMPLETED', value: completedCount },
            { label: 'INCOMPLETE / IN PROGRESS', value: incompleteCount },
            { label: 'QUESTIONS SOLVED', value: totalQuestionsSolved },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-3 sm:px-6 sm:py-4"
            >
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#35f4d0]">{stat.value}</span>
              <span className="font-mono text-[8px] sm:text-[9px] tracking-[2px] text-[#8baabe] text-center">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {loading && <Spinner />}

        {error && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-red-800 bg-red-950/30 p-6 text-center font-mono text-red-400">
            <AlertTriangle className="size-5 shrink-0 text-red-400" />
            <span>Could not connect to the server: {error}</span>
          </div>
        )}

        {actionError && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-red-800 bg-red-950/40 p-3 text-center font-mono text-xs text-red-400">
            <AlertTriangle className="size-4 shrink-0 text-red-400" />
            <span>{actionError}</span>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="rounded-lg border border-[#16405d] bg-[#0a1628]/60 p-10 text-center font-mono text-[#8baabe]">
            No teams registered yet. Accounts will appear here automatically upon registration.
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <>
            {/* ── Top 3 Podium Showcase ── */}
            {top3.length > 0 && (
              <div className="mb-8">
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs sm:text-sm tracking-[2px] text-[#35f4d0] font-bold">
                    <Crown className="size-4 sm:size-5 text-amber-400" />
                    <span>TOP 3 PODIUM // CURRENT STANDINGS</span>
                  </div>
                  <span className="hidden font-mono text-[11px] text-[#8baabe] sm:block">
                    RANKED BY SOLVED LEVELS & FASTEST TIME
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {top3.map((s, idx) => {
                    const solvedCount = (s.levels || []).filter((l) => l.solved).length
                    const totalSeconds = (s.levels || []).reduce(
                      (acc, l) => (l.timeTakenSeconds != null ? acc + l.timeTakenSeconds : acc),
                      0,
                    )
                    const isComplete = s.status === 'COMPLETE' || solvedCount >= 5

                    const placeConfigs = [
                      {
                        rank: '1ST PLACE',
                        medal: '🥇',
                        border: 'border-amber-400/70',
                        bg: 'bg-gradient-to-b from-amber-500/15 via-[#0a1b2d] to-[#071322]',
                        badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
                        glow: 'shadow-[0_0_25px_#f59e0b20]',
                        titleColor: 'text-amber-300',
                        icon: <Crown className="size-5 text-amber-400" />,
                      },
                      {
                        rank: '2ND PLACE',
                        medal: '🥈',
                        border: 'border-slate-300/60',
                        bg: 'bg-gradient-to-b from-slate-400/10 via-[#0a1b2d] to-[#071322]',
                        badgeBg: 'bg-slate-300/20 text-slate-200 border-slate-300/40',
                        glow: 'shadow-[0_0_20px_#cbd5e115]',
                        titleColor: 'text-slate-100',
                        icon: <Medal className="size-5 text-slate-300" />,
                      },
                      {
                        rank: '3RD PLACE',
                        medal: '🥉',
                        border: 'border-amber-700/60',
                        bg: 'bg-gradient-to-b from-amber-700/10 via-[#0a1b2d] to-[#071322]',
                        badgeBg: 'bg-amber-700/20 text-amber-400 border-amber-700/40',
                        glow: 'shadow-[0_0_20px_#b4530915]',
                        titleColor: 'text-amber-400',
                        icon: <Award className="size-5 text-amber-500" />,
                      },
                    ]

                    const cfg = placeConfigs[idx] || placeConfigs[2]

                    return (
                      <div
                        key={s.id || s.userId}
                        className={`relative overflow-hidden rounded-xl border ${cfg.border} ${cfg.bg} p-4 sm:p-5 ${cfg.glow} transition-all hover:scale-[1.01]`}
                      >
                        <div className="flex items-center justify-between border-b border-[#16405d]/40 pb-2.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wider ${cfg.badgeBg}`}>
                            <span>{cfg.medal}</span>
                            <span>{cfg.rank}</span>
                          </span>
                          {cfg.icon}
                        </div>

                        <div className="mt-3">
                          <div className={`truncate font-mono text-base sm:text-lg font-bold ${cfg.titleColor}`} title={s.userName}>
                            {s.userName || 'Team'}
                          </div>
                          {s.email && (
                            <div className="truncate text-xs text-[#7bb0cb]">{s.email}</div>
                          )}
                        </div>

                        <div className="mt-3.5 flex items-center justify-between border-t border-[#16405d]/40 pt-2.5 text-xs font-mono">
                          <div>
                            <span className="text-cyber-muted">LEVELS: </span>
                            <span className="font-bold text-[#35f4d0]">{solvedCount} / 5</span>
                          </div>
                          <div>
                            <span className="text-cyber-muted">TIME: </span>
                            <span className="font-bold text-[#1de9b6]">
                              {totalSeconds > 0 ? formatElapsed(totalSeconds) : '—'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-right">
                          {isComplete ? (
                            <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400">
                              ● MISSION COMPLETED
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono tracking-wider text-amber-400">
                              ○ IN PROGRESS
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Table Header Controls ── */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 text-xs text-[#8baabe]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-semibold text-[#35f4d0]">
                  {showOnlyTop3 ? `TOP 3 TEAMS (${displaySessions.length})` : `ALL REGISTERED TEAMS (${displaySessions.length})`}
                </span>
                {sessions.length > 3 && (
                  <span className="font-mono text-[11px] text-[#5e8ca7]">
                    ({sessions.length} total recorded)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-[#16405d] bg-[#091728] p-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowOnlyTop3(true)}
                  className={`rounded px-3 py-1 font-semibold transition-all ${
                    showOnlyTop3
                      ? 'bg-[#168d7a] text-white shadow-[0_0_10px_#168d7a88]'
                      : 'text-[#8baabe] hover:text-white'
                  }`}
                >
                  🏆 TOP 3 ONLY
                </button>
                <button
                  type="button"
                  onClick={() => setShowOnlyTop3(false)}
                  className={`rounded px-3 py-1 font-semibold transition-all ${
                    !showOnlyTop3
                      ? 'bg-[#168d7a] text-white shadow-[0_0_10px_#168d7a88]'
                      : 'text-[#8baabe] hover:text-white'
                  }`}
                >
                  ALL TEAMS ({sessions.length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#16405d] shadow-lg">
            {/* Table header */}
            <div className="grid min-w-[1000px] grid-cols-[2.5rem_minmax(120px,160px)_1.2fr_110px_110px_110px_130px_3rem_2.5rem] items-center border-b border-[#16405d] bg-[#0d1f30] px-5 py-3.5 font-mono text-xs tracking-[2px] text-[#35f4d0] font-semibold">
              <span>#</span>
              <span>TEAM ID</span>
              <span>TEAM NAME</span>
              <span>STATUS</span>
              <span>LEVELS</span>
              <span>TOTAL TIME</span>
              <span>LAST ACTIVE</span>
              <span className="text-center">ACTION</span>
              <span />
            </div>

            {displaySessions.map((s, i) => {
              const solvedCount = (s.levels || []).filter((l) => l.solved).length
              const totalLevels = s.levels?.length || 5
              const totalSeconds = (s.levels || []).reduce(
                (acc, l) => (l.timeTakenSeconds != null ? acc + l.timeTakenSeconds : acc),
                0,
              )
              const hasAnyTime = (s.levels || []).some((l) => l.timeTakenSeconds != null)
              const isComplete = s.status === 'COMPLETE' || solvedCount === totalLevels
              const isOpen = expanded === s.id
              const targetId = s.userId || s.id
              const isDeleting = deletingId === targetId

              return (
                <div key={s.id} className="border-b border-[#16405d]/40 last:border-0">
                  {/* Row */}
                  <div
                    className={`grid min-w-[1000px] cursor-pointer grid-cols-[2.5rem_minmax(120px,160px)_1.2fr_110px_110px_110px_130px_3rem_2.5rem] items-center px-5 py-4 transition-colors ${
                      isOpen ? 'bg-[#0d2a22]/60' : 'hover:bg-[#0d1f30]/70'
                    }`}
                    onClick={() => toggleExpand(s.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleExpand(s.id)}
                  >
                    <span className="font-mono text-sm font-semibold text-[#8baabe]">
                      {i === 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                          🥇 1
                        </span>
                      ) : i === 1 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-slate-200">
                          🥈 2
                        </span>
                      ) : i === 2 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                          🥉 3
                        </span>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="truncate font-mono text-xs text-cyber-muted" title={s.userId}>
                      {s.userId || '—'}
                    </span>
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-mono text-[15px] font-bold text-[#35f4d0]">
                        {s.userName || 'Team'}
                      </div>
                      {s.email && (
                        <div className="truncate text-xs text-[#7bb0cb]">{s.email}</div>
                      )}
                    </div>
                    <div>
                      {isComplete ? (
                        <Badge kind="good">COMPLETE</Badge>
                      ) : (
                        <Badge kind="bad">INCOMPLETE</Badge>
                      )}
                    </div>
                    <div className="font-mono text-sm">
                      <span className={solvedCount > 0 ? 'text-[#35f4d0] font-bold' : 'text-cyber-muted'}>
                        {solvedCount}
                      </span>{' '}
                      / {totalLevels}
                    </div>
                    <span className="font-mono text-sm font-bold text-[#1de9b6]">
                      {hasAnyTime ? formatElapsed(totalSeconds) : '—'}
                    </span>
                    <span className="font-mono text-xs text-[#a2c2d6]">
                      {formatDate(s.completedAt || s.updatedAt)}
                    </span>

                    {/* Delete action button */}
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        title={`Delete ${s.userName || targetId}`}
                        disabled={isDeleting}
                        onClick={(e) => handleDeleteUser(e, s)}
                        className="group/del flex h-7 w-7 items-center justify-center rounded border border-red-900/40 bg-red-950/20 text-red-400 transition-all hover:border-red-600 hover:bg-red-900/40 hover:text-red-300 hover:shadow-[0_0_8px_#ff4d4f40]"
                      >
                        {isDeleting ? (
                          <div className="size-3.5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                        ) : (
                          <Trash2 className="size-3.5 transition-transform group-hover/del:scale-110" />
                        )}
                      </button>
                    </div>

                    <span className="flex justify-center text-[#8baabe]">
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </span>
                  </div>

                  {/* Expanded level detail */}
                  {isOpen && (
                    <div className="border-t border-[#16405d]/30 bg-[#03101e] px-6 py-4">
                      <div className="mb-2 font-mono text-[9px] tracking-[2px] text-[#35f4d0]">
                        // LEVEL TIMELINE BREAKDOWN (5 LEVELS TOTAL)
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                        {(s.levels || []).map((lvl, qIdx) => (
                          <div
                            key={lvl.title || qIdx}
                            className={`flex flex-col justify-between gap-1.5 rounded-lg border p-3 ${
                              lvl.solved
                                ? 'border-[#168d7a]/60 bg-[#0a2320]/50'
                                : 'border-[#16405d]/40 bg-[#071524]/60 opacity-70'
                            }`}
                          >
                            <div className="truncate font-mono text-[11px] text-[#cdd9e5]">
                              {lvl.title}
                            </div>
                            <div className="flex items-center justify-between gap-1 pt-1">
                              <Badge kind={lvl.solved ? 'good' : 'dim'}>
                                {lvl.solved ? 'SOLVED' : 'INCOMPLETE'}
                              </Badge>
                              <span className="font-mono text-[10px] text-[#1de9b6]">
                                {lvl.timeTakenSeconds != null
                                  ? formatElapsed(lvl.timeTakenSeconds)
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#16405d]/50 py-4 text-center font-mono text-[10px] tracking-[2px] text-[#8baabe]">
        CYBER ESCAPE ROOM // ADMIN PANEL // REAL-TIME PROGRESS SYNCED TO SQLITE & EXCEL
      </footer>
    </div>
  )
}
