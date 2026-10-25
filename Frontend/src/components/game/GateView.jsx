import { forwardRef, useState } from 'react'
import { Clock, KeyRound, ShieldAlert } from 'lucide-react'
import CountdownTimer from './CountdownTimer.jsx'
import Feedback from './Feedback.jsx'

const GateView = forwardRef(function GateView(
  { levelNumber, feedback, countdown, timeLimit = 300, timerRunning, onAccess },
  ref,
) {
  const [code, setCode] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (countdown === 0) return
    const ok = onAccess(code)
    if (ok) setCode('')
  }

  const isExpired = countdown === 0

  return (
    <div>
      {/* ── Top row: Access Gate label + Countdown timer ── */}
      <div className="mb-4 flex items-center justify-between gap-2.5 sm:gap-4 border-b border-[#16405d]/40 pb-3">
        <div className="min-w-0 pr-1">
          <div className="truncate text-xs sm:text-sm md:text-base font-bold tracking-[1.5px] text-cyber-cyan">
            LEVEL {levelNumber}: ACCESS GATEWAY
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-[11px] sm:text-xs text-cyber-muted">
            <span className="rounded bg-[#0e273c] px-2 py-0.5 text-[10px] sm:text-[11px] text-cyber-cyan font-semibold">
              ACCESS CODE
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3 sm:size-3.5 text-cyber-cyan" />
              {Math.floor(timeLimit / 60)} MIN LIMIT
            </span>
          </div>
        </div>

        <CountdownTimer
          countdown={countdown}
          timeLimit={timeLimit}
          running={timerRunning}
        />
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-[540px] py-[15px] text-center">
        <div className="mb-3 flex justify-center text-cyber-cyan">
          <ShieldAlert className="size-14 [filter:drop-shadow(0_0_15px_#00d9ff88)]" />
        </div>
        <h3 className="m-0 mb-2.5 text-2xl sm:text-3xl font-bold">Access Required</h3>
        <p className="mb-[22px] text-sm sm:text-base leading-relaxed text-[#b3d0e4]">
          Enter the access code before time expires to breach Gate 1 and reveal the challenges.
        </p>

        <input
          ref={ref}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          placeholder={isExpired ? 'Time has expired...' : 'ENTER ACCESS CODE'}
          aria-label="Access code"
          disabled={isExpired}
          className={`input-cyber mb-3 text-center font-mono text-lg tracking-[3px] font-semibold ${
            isExpired ? 'cursor-not-allowed opacity-50' : ''
          }`}
        />
        <button
          type="submit"
          disabled={isExpired}
          className="btn btn-primary flex w-full items-center justify-center gap-2 text-base"
        >
          <KeyRound className="size-5" />
          UNLOCK LEVEL 1
        </button>

        <Feedback feedback={feedback} />
      </form>
    </div>
  )
})

export default GateView
