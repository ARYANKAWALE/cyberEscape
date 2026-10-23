import { forwardRef, useState } from 'react'
import Feedback from './Feedback.jsx'

const GateView = forwardRef(function GateView({ levelNumber, feedback, onAccess }, ref) {
  const [code, setCode] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const ok = onAccess(code)
    if (ok) setCode('')
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[540px] py-[15px] text-center">
      <div className="mb-3 text-[38px] text-cyber-cyan [text-shadow:0_0_20px_#00d9ff65]">⛨</div>
      <h3 className="m-0 mb-2.5 text-[23px]">Access Required</h3>
      <p className="mb-[22px] text-[13px] leading-relaxed text-cyber-muted">
        Initialize the mission, then enter the access code for Level {levelNumber} to reveal the
        {levelNumber === 1 ? ' first' : ' next'} puzzle.
      </p>

      <input
        ref={ref}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoComplete="off"
        placeholder="ENTER ACCESS CODE"
        aria-label="Access code"
        className="input-cyber mb-3 text-center font-mono tracking-[2px]"
      />
      <button type="submit" className="btn btn-primary w-full">
        UNLOCK LEVEL {levelNumber}
      </button>

      <Feedback feedback={feedback} />
    </form>
  )
})

export default GateView
