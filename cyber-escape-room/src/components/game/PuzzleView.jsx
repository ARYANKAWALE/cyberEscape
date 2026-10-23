import { useEffect, useRef, useState } from 'react'
import Feedback from './Feedback.jsx'
import Stopwatch from './Stopwatch.jsx'

export default function PuzzleView({ levelIndex, level, feedback, elapsed, timerRunning, onSubmit }) {
  const [answer, setAnswer] = useState('')
  const inputRef = useRef(null)

  // Original behaviour: focus the answer field whenever a puzzle is revealed.
  useEffect(() => {
    inputRef.current?.focus()
  }, [levelIndex])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(answer)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-2.5 flex flex-wrap items-start justify-between gap-3">
        <div className="text-xs tracking-[2px] text-cyber-cyan">
          LEVEL {String(levelIndex + 1).padStart(2, '0')} // {level.title.toUpperCase()}
          {level.timed && (
            <span className="mt-1.5 block text-[10px] tracking-[2px] text-cyber-muted">
              TIMED // DECRYPTION CLOCK RUNNING
            </span>
          )}
        </div>
        {elapsed !== null && <Stopwatch seconds={elapsed} running={timerRunning} />}
      </div>

      <div className="mb-[18px] rounded-[10px] border border-[#126b94] bg-[#03101e] p-5 font-mono text-[clamp(18px,2.2vw,24px)] leading-[1.55] shadow-[inset_0_0_20px_#00bce908]">
        <span className="mb-[9px] block text-[10px] tracking-[2px] text-cyber-mint">
          ENCRYPTED CHALLENGE
        </span>
        <span>{level.question}</span>
      </div>

      <p className="mb-5 text-xs leading-relaxed text-cyber-muted">{level.hint}</p>

      <label htmlFor="answerInput" className="mb-2 block text-[11px] tracking-[1.5px] text-[#a6cbe2]">
        YOUR DECODED ANSWER
      </label>
      <div className="flex gap-2 max-sm:flex-col">
        <input
          id="answerInput"
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoComplete="off"
          placeholder="Type your answer..."
          className="input-cyber"
        />
        <button type="submit" className="btn btn-primary whitespace-nowrap max-sm:w-full">
          VERIFY →
        </button>
      </div>

      <Feedback feedback={feedback} />
    </form>
  )
}
