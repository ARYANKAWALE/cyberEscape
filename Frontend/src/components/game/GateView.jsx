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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#16405d]/40 pb-3">
        <div>
          <div className="text-xs font-bold tracking-[2px] text-cyber-cyan">
            GATEWAY AUTHENTICATION // LEVEL {levelNumber}
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-[10px] tracking-[1.5px] text-cyber-muted">
            <span className="rounded bg-[#0e273c] px-2 py-0.5 text-cyber-cyan">
              ACCESS CODE
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-cyber-cyan" />
              TIME LIMIT: {Math.floor(timeLimit / 60)} MIN
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
          <ShieldAlert className="size-12 [filter:drop-shadow(0_0_15px_#00d9ff88)]" />
        </div>
        <h3 className="m-0 mb-2.5 text-[23px]">Access Required</h3>
        <p className="mb-[22px] text-[13px] leading-relaxed text-cyber-muted">
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
          className={`input-cyber mb-3 text-center font-mono tracking-[2px] ${
            isExpired ? 'cursor-not-allowed opacity-50' : ''
          }`}
        />
        <button
          type="submit"
          disabled={isExpired}
          className="btn btn-primary flex w-full items-center justify-center gap-2"
        >
          <KeyRound className="size-4" />
          UNLOCK LEVEL 1
        </button>

        <Feedback feedback={feedback} />
      </form>
    </div>
  )
})

export default GateView
