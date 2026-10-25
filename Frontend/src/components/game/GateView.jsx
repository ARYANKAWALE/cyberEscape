import { forwardRef, useState } from 'react'
import { KeyRound, ShieldAlert } from 'lucide-react'
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
      <div className="mb-3 flex justify-center text-cyber-cyan">
        <ShieldAlert className="size-12 [filter:drop-shadow(0_0_15px_#00d9ff88)]" />
      </div>
      <h3 className="m-0 mb-2.5 text-[23px]">Access Required</h3>
      <p className="mb-[22px] text-[13px] leading-relaxed text-cyber-muted">
        Initialize the mission, then enter the access code to breach Gate 1 and reveal the challenges.
      </p>

      <input
        ref={ref}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoComplete="off"
        placeholder="ENTER ACCESS CODE (0808)"
        aria-label="Access code"
        className="input-cyber mb-3 text-center font-mono tracking-[2px]"
      />
      <button type="submit" className="btn btn-primary flex w-full items-center justify-center gap-2">
        <KeyRound className="size-4" />
        UNLOCK LEVEL 1
      </button>

      <Feedback feedback={feedback} />
    </form>
  )
})

export default GateView
