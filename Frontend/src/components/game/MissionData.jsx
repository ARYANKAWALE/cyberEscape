import { TOTAL_LEVELS } from '../../data/levels.js'

function Stat({ label, children, last = false }) {
  return (
    <div
      className={`flex justify-between py-3 text-sm sm:text-base ${last ? '' : 'border-b border-[#15344c]'}`}
    >
      <span className="text-cyber-muted">{label}</span>
      <b className="text-cyber-text">{children}</b>
    </div>
  )
}

export default function MissionData({ clearedCount, current, status, progress }) {
  const percent = Math.round(progress * 100)

  return (
    <section className="surface p-[22px] max-sm:p-[17px]">
      <div className="mb-5 flex items-center justify-between gap-2.5 border-b border-[#16405d] pb-[15px]">
        <h3 className="m-0 text-base sm:text-lg font-bold tracking-[1.5px]">MISSION DATA</h3>
        <span className="pill">LIVE</span>
      </div>

      <Stat label="Levels cleared">
        {clearedCount} / {TOTAL_LEVELS}
      </Stat>
      <Stat label="Current level">
        {String(Math.min(current + 1, TOTAL_LEVELS)).padStart(2, '0')}
      </Stat>
      <Stat label="Security status" last>
        <span className="text-cyber-mint">{status}</span>
      </Stat>

      <div
        className="mb-[8px] mt-4 h-[8px] overflow-hidden rounded-[9px] bg-[#112a3e]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-full bg-gradient-to-r from-cyber-blue to-cyber-mint transition-[width] duration-[400ms]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs sm:text-[13px] font-semibold text-cyber-muted">{percent}% SYSTEM BREACHED</div>
    </section>
  )
}
