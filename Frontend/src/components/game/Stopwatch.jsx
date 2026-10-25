import { formatElapsed } from '../../lib/time.js'

/** Mono count-up badge for timed puzzles. Pulses while running, freezes when stopped. */
export default function Stopwatch({ seconds, running }) {
  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Elapsed time ${formatElapsed(seconds)}`}
      className="flex items-center gap-2 rounded-[7px] border border-[#168d7a] px-3 py-1.5 font-mono text-base tracking-[3px] tabular-nums text-cyber-mint [text-shadow:0_0_14px_#35f4d055]"
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${running ? 'animate-pulse bg-cyber-mint' : 'bg-cyber-muted'}`}
      />
      {formatElapsed(seconds)}
    </div>
  )
}
