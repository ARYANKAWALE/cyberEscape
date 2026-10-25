/**
 * Countdown timer badge for puzzles.
 *
 * Colour states:
 *   > 50 % remaining  → cyber-mint (green)
 *   25–50 % remaining → amber/yellow
 *   < 25 % remaining  → red, pulses faster
 *   0                 → flashing red "ELIMINATED"
 */

function formatCountdown(seconds) {
  if (seconds === null || seconds === undefined) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CountdownTimer({ countdown, timeLimit, running }) {
  if (countdown === null || timeLimit === null) return null

  const ratio = timeLimit > 0 ? countdown / timeLimit : 0
  const isUrgent = ratio < 0.25
  const isWarning = ratio >= 0.25 && ratio < 0.5
  const isDead = countdown === 0

  let ringColor, textColor, glowColor, dotClass
  if (isDead) {
    ringColor = 'border-red-500'
    textColor = 'text-red-400'
    glowColor = '[text-shadow:0_0_14px_#ef444488]'
    dotClass = 'animate-ping bg-red-500'
  } else if (isUrgent) {
    ringColor = 'border-red-600'
    textColor = 'text-red-400'
    glowColor = '[text-shadow:0_0_14px_#ef444488]'
    dotClass = 'animate-pulse bg-red-500'
  } else if (isWarning) {
    ringColor = 'border-amber-500'
    textColor = 'text-amber-400'
    glowColor = '[text-shadow:0_0_14px_#f59e0b88]'
    dotClass = 'animate-pulse bg-amber-400'
  } else {
    ringColor = 'border-[#168d7a]'
    textColor = 'text-cyber-mint'
    glowColor = '[text-shadow:0_0_14px_#35f4d055]'
    dotClass = running ? 'animate-pulse bg-cyber-mint' : 'bg-cyber-muted'
  }

  // Arc progress — SVG circle
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ratio)

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${formatCountdown(countdown)}`}
      className={`flex items-center gap-2.5 rounded-[7px] border px-3 py-1.5 font-mono text-base tracking-[3px] tabular-nums transition-colors duration-500 ${ringColor} ${textColor} ${glowColor}`}
    >
      {/* SVG arc progress ring */}
      <svg width="32" height="32" className="-rotate-90" aria-hidden="true">
        {/* Background ring */}
        <circle
          cx="16" cy="16" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity="0.15"
        />
        {/* Progress arc */}
        <circle
          cx="16" cy="16" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s linear' }}
        />
      </svg>

      {/* Pulse dot */}
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dotClass}`} />

      {/* Time display */}
      <span className={isDead ? 'animate-pulse' : ''}>{formatCountdown(countdown)}</span>
    </div>
  )
}
