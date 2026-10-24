import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Lock,
  Sparkles,
} from 'lucide-react'
import CountdownTimer from './CountdownTimer.jsx'
import Feedback from './Feedback.jsx'

export default function PuzzleView({
  levelIndex,
  questionIndex = 0,
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

  const activeQ = question || level?.questions?.[questionIndex] || level?.questions?.[0]
  const qNum = questionIndex + 1
  const totalQ = level?.questions?.length || 2

  // Reset and focus input field whenever level or question index changes
  useEffect(() => {
    setAnswer('')
    inputRef.current?.focus()
  }, [levelIndex, questionIndex])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!answer.trim()) return
    onSubmit(answer, user)
  }

  const isExpired = countdown === 0

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Top row: Level label + Countdown timer ── */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold tracking-[2px] text-cyber-cyan">
            LEVEL {String(levelIndex + 1).padStart(2, '0')} // {level.title.toUpperCase()}
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-[10px] tracking-[1.5px] text-cyber-muted">
            <span className="rounded bg-[#0e273c] px-2 py-0.5 text-cyber-cyan">
              QUESTION {qNum} OF {totalQ}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-cyber-cyan" />
              TIME LIMIT: {Math.floor(level.timeLimit / 60)} MIN
            </span>
          </div>
        </div>

        <CountdownTimer
          countdown={countdown}
          timeLimit={level.timeLimit}
          running={timerRunning}
        />
      </div>

      {/* ── 2-Step Question Progress Pills ── */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {level?.questions?.map((q, idx) => {
          const isCurrent = idx === questionIndex
          const isDone = idx < questionIndex
          let pillStyle = 'border-[#16405d] bg-[#071524] text-cyber-muted'
          let IconComponent = Lock

          if (isDone) {
            pillStyle = 'border-cyber-green/60 bg-[#092920] text-cyber-green'
            IconComponent = Check
          } else if (isCurrent) {
            pillStyle = 'border-cyber-cyan bg-[#00d9ff14] text-cyber-cyan shadow-[0_0_12px_#00d9ff20]'
            IconComponent = Sparkles
          }

          return (
            <div
              key={q.id || idx}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] transition-all ${pillStyle}`}
            >
              <IconComponent className="size-3.5 shrink-0" />
              <div className="min-w-0 flex-1 truncate">
                <span className="block text-[9px] tracking-[1.5px] opacity-75">
                  PART {idx + 1}
                </span>
                <span className="truncate font-semibold">{q.title}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Question Box ── */}
      <div
        className={`mb-4 rounded-[10px] border p-5 font-mono text-[clamp(17px,2vw,22px)] leading-[1.55] shadow-[inset_0_0_20px_#00bce908] transition-colors ${
          isExpired
            ? 'border-red-700 bg-red-950/20'
            : 'border-[#126b94] bg-[#03101e]'
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span
            className={`flex items-center gap-1.5 text-[10px] tracking-[2px] ${
              isExpired ? 'text-red-400' : 'text-cyber-mint'
            }`}
          >
            {isExpired ? (
              <>
                <AlertTriangle className="size-3.5 text-red-400" />
                TIME EXPIRED — MISSION FAILED
              </>
            ) : (
              `ENCRYPTED CHALLENGE [${qNum}/${totalQ}]`
            )}
          </span>
          <span className="font-mono text-[10px] tracking-wider text-cyber-muted">
            {activeQ?.title?.toUpperCase()}
          </span>
        </div>
        <div className={isExpired ? 'opacity-40' : ''}>{activeQ?.question}</div>
      </div>


      {/* ── Answer Input & Submit Button ── */}
      <label htmlFor="answerInput" className="mb-2 block text-[11px] tracking-[1.5px] text-[#a6cbe2]">
        OPERATIVE ANSWER [PART {qNum}]
      </label>
      <div className="flex gap-2 max-sm:flex-col">
        <input
          id="answerInput"
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoComplete="off"
          placeholder={isExpired ? 'Time has expired...' : `Enter answer for part ${qNum}...`}
          disabled={isExpired}
          className={`input-cyber ${isExpired ? 'cursor-not-allowed opacity-50' : ''}`}
        />
        <button
          type="submit"
          disabled={isExpired}
          className={`btn btn-primary flex items-center justify-center gap-1.5 whitespace-nowrap max-sm:w-full ${
            isExpired ? 'cursor-not-allowed opacity-40' : ''
          }`}
        >
          <span>VERIFY PART {qNum}</span>
          <ArrowRight className="size-4" />
        </button>
      </div>

      <Feedback feedback={feedback} />
    </form>
  )
}
