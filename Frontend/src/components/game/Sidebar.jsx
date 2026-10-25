import { Check, Clock, Layers } from 'lucide-react'
import { TOTAL_LEVELS, TOTAL_QUESTIONS, levels } from '../../data/levels.js'

function levelStatus({ isCleared, isActive, unlocked, index }) {
  if (isCleared) return 'CLEARED'
  if (isActive && (unlocked || index > 0)) return 'ACTIVE'
  if (index === 0 && !unlocked) return 'GATE LOCKED'
  return 'LOCKED'
}

export default function Sidebar({ current, unlocked, cleared, clearedCount, onSelect }) {
  return (
    <aside className="surface h-max p-3 sm:p-4 lg:p-[18px] lg:sticky lg:top-4">
      <div className="mb-3 mt-[3px] flex items-center justify-between text-xs sm:text-sm tracking-[2px] text-cyber-muted">
        <span className="flex items-center gap-1.5 font-semibold">
          <Layers className="size-4 text-cyber-cyan" />
          SEQUENCE
        </span>
        <span className="rounded bg-[#07241f] px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs font-semibold text-cyber-mint">
          {TOTAL_LEVELS} LEVELS
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1 sm:gap-2 lg:block">
        {levels.map((lvl, i) => {
          const isCleared = cleared.has(i)
          const isActive = i === current
          const label = levelStatus({ isCleared, isActive, unlocked, index: i })

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-current={isActive ? 'step' : undefined}
              className={[
                'w-full cursor-pointer rounded-[9px] border px-0.5 py-1.5 sm:px-1 sm:py-2 text-center text-cyber-muted transition-all duration-200 active:scale-95',
                'lg:my-1 lg:flex lg:items-center lg:gap-[11px] lg:px-3 lg:py-2.5 lg:text-left',
                isActive
                  ? 'border-cyber-cyan bg-[#00d9ff18] shadow-[0_0_15px_#00d9ff20]'
                  : 'border-transparent hover:border-[#245577] hover:bg-[#071d33]/50',
              ].join(' ')}
            >
              <span
                className={[
                  'mx-auto mb-1 grid h-7 w-7 place-items-center rounded-lg border font-mono text-xs font-bold transition-all sm:h-8 sm:w-8 lg:mx-0 lg:mb-0 lg:h-9 lg:w-9 lg:text-sm',
                  isActive
                    ? 'border-cyber-cyan bg-cyber-cyan text-[#00111e] shadow-[0_0_10px_#00d9ff60]'
                    : isCleared
                      ? 'border-cyber-green bg-[#0d2a22] text-cyber-green'
                      : 'border-[#245577] text-cyber-muted',
                ].join(' ')}
              >
                {isCleared ? (
                  <Check className="size-4 stroke-[3]" />
                ) : (
                  String(i + 1).padStart(2, '0')
                )}
              </span>
              <span className="block min-w-0">
                <b className="block text-xs tracking-wider text-cyber-text sm:text-[13px] lg:text-[15px]">
                  LEVEL {i + 1}
                </b>
                <small className="mt-0.5 hidden text-[11px] text-cyber-muted md:flex md:items-center md:gap-1.5 lg:text-xs">
                  <span>{label}</span>
                  <span>•</span>
                  <Clock className="size-3 inline" />
                  <span>{Math.floor(lvl.timeLimit / 60)}m</span>
                </small>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 hidden justify-between border-t border-[#16405d] pt-[15px] text-xs sm:text-sm text-cyber-muted lg:flex">
        <span>{TOTAL_LEVELS} LEVELS ({TOTAL_QUESTIONS} CHALLENGES)</span>
        <span className="text-cyber-mint font-semibold">
          {clearedCount} / {TOTAL_LEVELS} SOLVED
        </span>
      </div>
    </aside>
  )
}
