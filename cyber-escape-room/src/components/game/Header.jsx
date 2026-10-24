import { Link } from 'react-router-dom'
import { LogOut, Shield, Trophy } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Header({ status }) {
  const { user, logout } = useAuth()

  return (
    <header className="relative z-[1] flex items-center justify-between gap-2 border-b border-[#12476a] bg-[#030b16dd] px-[clamp(14px,4vw,56px)] py-4 shadow-[0_8px_30px_#0006] sm:gap-4 sm:py-5">
      <Link to="/" className="flex min-w-0 items-center gap-2.5 no-underline sm:gap-3.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyber-cyan text-cyber-cyan shadow-[0_0_18px_#00d9ff2c] sm:h-12 sm:w-12">
          <Shield className="size-5 sm:size-6 text-cyber-cyan" />
        </div>
        <div className="min-w-0">
          <h1 className="m-0 text-[15px] uppercase leading-tight tracking-[1.2px] sm:text-[clamp(18px,2.6vw,27px)] sm:tracking-[3px]">
            Cyber <span className="text-cyber-cyan">Escape Room</span>
          </h1>
          <div className="mt-1 hidden text-[10px] tracking-[3px] text-cyber-muted sm:block">
            THINK / DECODE / ESCAPE
          </div>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <div className="hidden text-right text-xs tracking-[2px] text-cyber-mint sm:block">
          SYSTEM STATUS: <span>{status}</span>
          <small className="mt-1 block text-[10px] text-cyber-muted">
            OPERATIVE // {user?.name?.toUpperCase()}
          </small>
        </div>
        {user?.isAdmin && (
          <Link
            to="/leaderboard"
            id="leaderboardNavBtn"
            className="btn flex items-center gap-1.5 px-2.5 py-2 text-[10px] whitespace-nowrap sm:px-3.5 sm:text-[11px] border-[#168d7a] text-[#35f4d0]"
            title="View admin leaderboard"
          >
            <Trophy className="size-3.5 text-[#35f4d0]" />
            LEADERBOARD
          </Link>
        )}
        <button
          type="button"
          onClick={logout}
          className="btn flex items-center gap-1.5 px-2.5 py-2 text-[10px] whitespace-nowrap sm:px-3.5 sm:text-[11px]"
          title={`Sign out ${user?.email ?? ''}`}
        >
          <LogOut className="size-3.5 text-cyber-muted" />
          LOG OUT
        </button>
      </div>
    </header>
  )
}
