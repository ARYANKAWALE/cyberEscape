import { CheckCircle2, Clock, RotateCcw, Trophy } from 'lucide-react'
import { formatElapsed } from '../../lib/time.js'

export default function SuccessView({ finalTime, onReplay, submitted }) {
  return (
    <div className="px-2.5 py-6 text-center">
      <div className="mb-3 flex justify-center text-cyber-mint">
        <Trophy className="size-16 [filter:drop-shadow(0_0_25px_#35f4d088)]" />
      </div>
      <div className="eyebrow">// ALL 10 SECURITY CHALLENGES BYPASSED</div>
      <h3 className="my-2 text-[clamp(28px,4vw,42px)] tracking-[2px] text-cyber-mint">
        ESCAPED THE ROOM
      </h3>
      <p className="leading-relaxed text-cyber-muted">
        Outstanding performance, operative. Every encrypted puzzle has been cracked and the master lock is disengaged.
      </p>
      <div className="mb-[22px] mt-4 flex flex-wrap justify-center gap-2.5">
        <div className="flex items-center gap-2 rounded-[7px] border border-[#168d7a] px-3.5 py-[9px] font-mono tracking-[2px] text-cyber-mint">
          <CheckCircle2 className="size-4 text-cyber-mint" />
          MISSION STATUS: COMPLETE
        </div>
        {finalTime !== null && finalTime !== undefined && (
          <div className="flex items-center gap-2 rounded-[7px] border border-[#168d7a] px-3.5 py-[9px] font-mono tracking-[2px] text-cyber-mint">
            <Clock className="size-4 text-cyber-mint" />
            TOTAL TIME: {formatElapsed(finalTime)}
          </div>
        )}
      </div>

      {submitted ? (
        <div className="inline-flex items-center gap-2 rounded-[8px] border border-cyber-mint/60 bg-[#092920] px-5 py-2.5 font-mono text-[12px] tracking-[1.5px] text-cyber-mint">
          <CheckCircle2 className="size-4 text-cyber-mint" />
          FINAL SUBMISSION RECORDED // 1 SUBMISSION PER OPERATIVE ID
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-primary inline-flex items-center gap-2"
          onClick={onReplay}
        >
          <RotateCcw className="size-4" />
          REPLAY MISSION
        </button>
      )}
    </div>
  )
}
