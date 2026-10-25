import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react'
import CountdownTimer from './CountdownTimer.jsx'
import Feedback from './Feedback.jsx'

export default function PuzzleView({
  levelIndex,
  level,
  question,
  feedback,
  countdown,
  timerRunning,
  onSubmit,
  user,
}) {
  const [answer, setAnswer] = useState('')
  const inputRef = useRef(null)

  const activeQ = question || level?.questions?.[0]

  // Reset and focus input field whenever level changes
  useEffect(() => {
    setAnswer('')
    inputRef.current?.focus()
  }, [levelIndex])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!answer.trim()) return
    onSubmit(answer, user)
  }

  const isExpired = countdown === 0

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Top row: Level label + Countdown timer ── */}
      <div className="mb-4 flex items-center justify-between gap-2.5 sm:gap-4 border-b border-[#16405d]/40 pb-3">
        <div className="min-w-0 pr-1">
          <div className="truncate text-xs sm:text-sm md:text-base font-bold tracking-[1.5px] text-cyber-cyan">
            LEVEL {String(levelIndex + 1).padStart(2, '0')}: {level.title.toUpperCase()}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[11px] sm:text-xs text-cyber-muted">
            {level.difficulty && (
              <span className="rounded border border-[#16405d] bg-[#071524] px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-[#35f4d0]">
                {level.difficulty.toUpperCase()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="size-3 sm:size-3.5 text-cyber-cyan" />
              {Math.floor(level.timeLimit / 60)} MIN LIMIT
            </span>
          </div>
        </div>

        <CountdownTimer
          countdown={countdown}
          timeLimit={level.timeLimit}
          running={timerRunning}
        />
      </div>

      {/* ── Question Box ── */}
      <div
        className={`mb-5 rounded-[12px] border p-4 sm:p-5 md:p-6 font-mono text-[clamp(15px,1.4vw,18px)] leading-[1.7] shadow-[inset_0_0_25px_#00bce908] transition-colors ${
          isExpired
            ? 'border-red-700 bg-red-950/20'
            : 'border-[#126b94] bg-[#03101e]'
        }`}
      >
        <div className="mb-3 flex items-center justify-between border-b border-[#16405d]/40 pb-2.5 gap-2">
          <span
            className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold tracking-[1.5px] shrink-0 ${
              isExpired ? 'text-red-400' : 'text-cyber-mint'
            }`}
          >
            {isExpired ? (
              <>
                <AlertTriangle className="size-3.5 sm:size-4 text-red-400" />
                TIME EXPIRED — MISSION FAILED
              </>
            ) : (
              'ENCRYPTED CHALLENGE'
            )}
          </span>
          <span className="font-mono text-[11px] sm:text-xs tracking-wider text-cyber-muted truncate text-right">
            {activeQ?.title?.toUpperCase()}
          </span>
        </div>
        <div className={`whitespace-pre-wrap text-[#e2f0fb] ${isExpired ? 'opacity-40' : ''}`}>
          {activeQ?.question}
        </div>
      </div>

      {/* ── Answer Input & Submit Button ── */}
      <label htmlFor="answerInput" className="mb-2 block text-xs sm:text-sm font-semibold tracking-[1.5px] text-[#b3d9f0]">
        TEAM ANSWER / DECRYPTION KEY
      </label>
      <div className="flex gap-2.5 max-sm:flex-col">
        <input
          id="answerInput"
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoComplete="off"
          placeholder={isExpired ? 'Time has expired...' : 'Enter decryption answer...'}
          disabled={isExpired}
          className={`input-cyber text-base sm:text-lg font-mono ${isExpired ? 'cursor-not-allowed opacity-50' : ''}`}
        />
        <button
          type="submit"
          disabled={isExpired}
          className={`btn btn-primary flex items-center justify-center gap-2 whitespace-nowrap text-base max-sm:w-full ${
            isExpired ? 'cursor-not-allowed opacity-40' : ''
          }`}
        >
          <span>SUBMIT ANSWER</span>
          <ArrowRight className="size-4.5" />
        </button>
      </div>

      <Feedback feedback={feedback} />
    </form>
  )
}
