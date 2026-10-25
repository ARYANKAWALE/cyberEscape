import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  LogOut,
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

  useEffect(() => {
    // 1. Sync all registered local accounts to backend so every user ID appears
    const localUsers = getUsers()
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

  return (
    <div
      className="min-h-screen bg-[#071020] text-[#cdd9e5]"
      style={{ fontFamily: "'Inter', 'Consolas', sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="border-b border-[#16405d] bg-[#0a1628]/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-[#168d7a] bg-[#0d2a22]">
              <Trophy className="size-5 text-[#35f4d0]" />
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[3px] text-[#35f4d0]">
                // CYBER ESCAPE ROOM
              </div>
              <h1 className="mt-0.5 font-mono text-xl font-bold tracking-[2px] text-white">
                ADMIN LEADERBOARD
              </h1>
            </div>
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
              <Download className="size-3.5" />
              EXPORT XLSX
            </button>
            <button
              id="backToGameBtn"
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 rounded-[7px] border border-[#16405d] bg-[#0d1f30] px-4 py-2 font-mono text-[11px] tracking-[1.5px] text-[#8baabe] transition hover:border-[#35f4d0]/50 hover:text-[#35f4d0]"
            >
              <ArrowLeft className="size-3.5" />
              BACK
            </button>
            <button
              id="logoutBtn"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="flex items-center gap-1.5 rounded-[7px] border border-red-900/50 bg-red-950/20 px-4 py-2 font-mono text-[11px] tracking-[1.5px] text-red-400 transition hover:bg-red-900/30"
            >
              <LogOut className="size-3.5" />
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className="border-b border-[#16405d]/50 bg-[#071020]">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-px">
          {[
            { label: 'REGISTERED TEAMS', value: sessions.length },
            { label: 'COMPLETED', value: completedCount },
            { label: 'INCOMPLETE / IN PROGRESS', value: incompleteCount },
            { label: 'QUESTIONS SOLVED', value: totalQuestionsSolved },
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
          <div className="overflow-x-auto rounded-xl border border-[#16405d]">
            {/* Table header */}
            <div className="grid min-w-[1000px] grid-cols-[2.5rem_minmax(120px,160px)_1.2fr_110px_110px_110px_130px_3rem_2.5rem] items-center border-b border-[#16405d] bg-[#0d1f30] px-5 py-3 font-mono text-[10px] tracking-[2px] text-[#35f4d0]">
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

            {sessions.map((s, i) => {
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
              const isRootAdmin = s.email === ADMIN_EMAIL || s.email === 'admin1@gmail.com' || s.email === 'admin@cyberescape.com'

              return (
                <div key={s.id} className="border-b border-[#16405d]/40 last:border-0">
                  {/* Row */}
                  <div
                    className={`grid min-w-[1000px] cursor-pointer grid-cols-[2.5rem_minmax(120px,160px)_1.2fr_110px_110px_110px_130px_3rem_2.5rem] items-center px-5 py-3.5 transition-colors ${
                      isOpen ? 'bg-[#0d2a22]/60' : 'hover:bg-[#0d1f30]/70'
                    }`}
                    onClick={() => toggleExpand(s.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleExpand(s.id)}
                  >
                    <span className="font-mono text-[13px] text-[#8baabe]">{i + 1}</span>
                    <span className="truncate font-mono text-[11px] text-cyber-muted" title={s.userId}>
                      {s.userId || '—'}
                    </span>
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-mono text-[13px] font-semibold text-[#35f4d0]">
                        {s.userName || 'Team'}
                      </div>
                      {s.email && (
                        <div className="truncate text-[10px] text-[#5e8ca7]">{s.email}</div>
                      )}
                    </div>
                    <div>
                      {isComplete ? (
                        <Badge kind="good">COMPLETE</Badge>
                      ) : (
                        <Badge kind="bad">INCOMPLETE</Badge>
                      )}
                    </div>
                    <div className="font-mono text-[12px]">
                      <span className={solvedCount > 0 ? 'text-[#35f4d0]' : 'text-cyber-muted'}>
                        {solvedCount}
                      </span>{' '}
                      / {totalLevels}
                    </div>
                    <span className="font-mono text-[13px] font-semibold text-[#1de9b6]">
                      {hasAnyTime ? formatElapsed(totalSeconds) : '—'}
                    </span>
                    <span className="font-mono text-[11px] text-[#8baabe]">
                      {formatDate(s.completedAt || s.updatedAt)}
                    </span>

                    {/* Delete action button */}
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        title={isRootAdmin ? 'Root admin cannot be deleted' : `Delete team ${s.userName || targetId}`}
                        disabled={isDeleting || isRootAdmin}
                        onClick={(e) => handleDeleteUser(e, s)}
                        className={`group/del flex h-7 w-7 items-center justify-center rounded border transition-all ${
                          isRootAdmin
                            ? 'cursor-not-allowed border-transparent text-[#355169]/30'
                            : 'border-red-900/40 bg-red-950/20 text-red-400 hover:border-red-600 hover:bg-red-900/40 hover:text-red-300 hover:shadow-[0_0_8px_#ff4d4f40]'
                        }`}
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
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#16405d]/50 py-4 text-center font-mono text-[10px] tracking-[2px] text-[#8baabe]">
        CYBER ESCAPE ROOM // ADMIN PANEL // REAL-TIME PROGRESS SYNCED TO SQLITE & EXCEL
      </footer>
    </div>
  )
}
