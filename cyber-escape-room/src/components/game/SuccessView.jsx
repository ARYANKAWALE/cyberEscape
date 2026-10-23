import { formatElapsed } from '../../lib/time.js'

export default function SuccessView({ finalTime, onReplay }) {
  return (
    <div className="px-2.5 py-6 text-center">
      <div className="text-[65px] text-cyber-mint [text-shadow:0_0_35px_#35f4d055]">⬡</div>
      <div className="eyebrow">// ALL SECURITY GATES BYPASSED</div>
      <h3 className="my-2 text-[clamp(28px,4vw,42px)] tracking-[2px] text-cyber-mint">
        ESCAPED THE ROOM
      </h3>
      <p className="leading-relaxed text-cyber-muted">
        Excellent work, operative. Every puzzle has been solved and the final lock is open.
      </p>
      <div className="mb-[22px] mt-2.5 flex flex-wrap justify-center gap-2.5">
        <div className="rounded-[7px] border border-[#168d7a] px-3.5 py-[9px] font-mono tracking-[3px] text-cyber-mint">
          MISSION STATUS: COMPLETE
        </div>
        {finalTime !== null && finalTime !== undefined && (
          <div className="rounded-[7px] border border-[#168d7a] px-3.5 py-[9px] font-mono tracking-[3px] text-cyber-mint">
            FINAL DECRYPTION: {formatElapsed(finalTime)}
          </div>
        )}
      </div>
      {/* <button type="button" className="btn btn-primary" onClick={onReplay}>
        ↻ RESTART MISSION
      </button> */}
    </div>
  )
}
