/** Formats a second count as MM:SS (minutes keep growing past 59, e.g. 125:07). */
export function formatElapsed(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
