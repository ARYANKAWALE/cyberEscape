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
    <aside className="surface h-max p-[18px] lg:sticky lg:top-4">
      <div className="mb-3.5 mt-[3px] flex items-center justify-between text-[11px] tracking-[2px] text-cyber-muted">
        <span className="flex items-center gap-1.5">
          <Layers className="size-3.5 text-cyber-cyan" />
          SEQUENCE
        </span>
        <span className="text-[10px] text-cyber-cyan">2 Q/LEVEL</span>
      </div>

      <div className="grid grid-cols-5 gap-[5px] lg:block">
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
                'my-1 w-full cursor-pointer rounded-[9px] border px-1 py-[9px] text-center text-cyber-muted transition',
                'lg:flex lg:items-center lg:gap-[11px] lg:px-[9px] lg:py-3 lg:text-left',
                isActive
                  ? 'border-cyber-cyan bg-[#00d9ff12] shadow-[0_0_18px_#00d9ff15]'
                  : 'border-transparent hover:border-[#245577]',
              ].join(' ')}
            >
              <span
                className={[
                  'mx-auto mb-1.5 grid h-[30px] w-[30px] place-items-center rounded-lg border font-bold lg:mx-0 lg:mb-0',
                  isActive
                    ? 'border-cyber-cyan bg-cyber-cyan text-[#00111e]'
                    : isCleared
                      ? 'border-cyber-green text-cyber-green'
                      : 'border-[#245577]',
                ].join(' ')}
              >
                {isCleared ? (
                  <Check className="size-4 stroke-[3]" />
                ) : (
                  String(i + 1).padStart(2, '0')
                )}
              </span>
              <span className="block min-w-0">
                <b className="block text-[11px] text-cyber-text lg:text-[13px]">LEVEL {i + 1}</b>
                <small className="mt-1 hidden text-[9px] text-cyber-muted md:flex md:items-center md:gap-1 lg:text-[10px]">
                  <span>{label}</span>
                  <span>•</span>
                  <Clock className="size-2.5 inline" />
                  <span>{Math.floor(lvl.timeLimit / 60)}m</span>
                </small>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 hidden justify-between border-t border-[#16405d] pt-[15px] text-[11px] text-cyber-muted lg:flex">
        <span>{TOTAL_LEVELS} LEVELS ({TOTAL_QUESTIONS} CHALLENGES)</span>
        <span className="text-cyber-mint">
          {clearedCount} / {TOTAL_LEVELS} SOLVED
        </span>
      </div>
    </aside>
  )
}
