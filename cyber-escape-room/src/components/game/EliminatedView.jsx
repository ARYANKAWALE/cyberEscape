import { AlertOctagon, RotateCcw, ShieldAlert } from 'lucide-react'

/**
 * Shown when the countdown reaches 0 on any question.
 * Gives the player a dramatic "ELIMINATED" screen with a retry option.
 */
export default function EliminatedView({ levelNumber, questionNumber = 1, onRetry }) {
  return (
    <div className="px-2.5 py-8 text-center">
      {/* Big warning glyph */}
      <div
        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-600 text-red-500"
        style={{ boxShadow: '0 0 40px #ef444440, inset 0 0 20px #ef444420' }}
      >
        <AlertOctagon className="size-10 animate-pulse stroke-[2.2]" />
      </div>

      <div className="font-mono text-[10px] tracking-[4px] text-red-500 opacity-80">
        // SECURITY PROTOCOL ACTIVATED
      </div>

      <h3
        className="my-3 font-mono text-[clamp(28px,4vw,42px)] font-bold tracking-[4px] text-red-500"
        style={{ textShadow: '0 0 30px #ef444480' }}
      >
        OPERATIVE ELIMINATED
      </h3>

      <p className="mb-2 leading-relaxed text-[#8baabe]">
        Time expired on{' '}
        <span className="font-mono font-bold text-red-400">
          Level {levelNumber}, Question {questionNumber}
        </span>
        .
        <br />
        Your access has been revoked. The mission must restart from the beginning.
      </p>

      <div className="my-5 inline-flex items-center gap-2 rounded-lg border border-red-800/60 bg-red-950/30 px-6 py-3 font-mono text-[11px] tracking-[2px] text-red-400">
        <ShieldAlert className="size-4 text-red-400" />
        MISSION STATUS: FAILED // TIME LIMIT EXCEEDED
      </div>

      <br />

      {/* <button
        id="retryMissionBtn"
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-2 rounded-[8px] border border-[#35f4d0] bg-[#0d2a22] px-8 py-3 font-mono text-[12px] tracking-[2px] text-[#35f4d0] transition-all hover:bg-[#35f4d0]/20 hover:shadow-[0_0_20px_#35f4d040]"
      > */}
      {/* <RotateCcw className="size-4" />
        RESTART MISSION
      </button> */}
    </div>
  )
}
