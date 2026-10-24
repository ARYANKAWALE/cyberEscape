import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TOTAL_LEVELS, levels } from '../data/levels.js'
import { saveResult } from '../lib/api.js'
import { formatElapsed } from '../lib/time.js'

const MAX_LOG_LINES = 8

const INITIAL_LOG = [
  { text: 'Secure channel established' },
  { text: 'Waiting for operative...' },
  { text: 'No access granted', dim: true },
]

const NO_FEEDBACK = { text: '', kind: '' }

/**
 * All game state and transitions for the escape room.
 * `view` is one of: 'gate' | 'puzzle' | 'success'.
 */
export function useEscapeRoom() {
  const [current, setCurrent] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [cleared, setCleared] = useState(() => new Set())
  const [initialized, setInitialized] = useState(false)
  const [view, setView] = useState('gate')
  const [log, setLog] = useState(INITIAL_LOG)
  const [gateFeedback, setGateFeedback] = useState(NO_FEEDBACK)
  const [answerFeedback, setAnswerFeedback] = useState(NO_FEEDBACK)
  /**
   * Stopwatch for timed puzzles. `elapsed` is seconds since the puzzle was
   * revealed (null when the current level isn't timed); `timerRunning` is
   * false once the answer lands so the final time stays frozen on screen.
   */
  const [elapsed, setElapsed] = useState(null)
  const [timerRunning, setTimerRunning] = useState(false)

  /**
   * Records per-level timing and solved status so the full session can be
   * persisted to the backend once the player escapes.
   * Shape: { [levelIndex]: { timeTakenSeconds: number|null } }
   */
  const [levelTimings, setLevelTimings] = useState({})

  const timerRef = useRef(null)
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const addLog = useCallback((text, dim = false) => {
    setLog((prev) => [...prev, { text, dim }].slice(-MAX_LOG_LINES))
  }, [])

  const showGate = useCallback((levelIndex) => {
    setCurrent(levelIndex)
    setUnlocked(false)
    setView('gate')
    setElapsed(null)
    setTimerRunning(false)
    setGateFeedback(NO_FEEDBACK)
    setAnswerFeedback(NO_FEEDBACK)
  }, [])

  // Stopwatch tick: count up once per second for as long as the timer is running.
  useEffect(() => {
    if (!timerRunning) return undefined
    const id = setInterval(() => setElapsed((t) => (t === null ? 0 : t + 1)), 1000)
    return () => clearInterval(id)
  }, [timerRunning])

  /** "INITIALIZE MISSION" button in the hero. */
  const start = useCallback(() => {
    setInitialized(true)
    setGateFeedback({ text: 'Mission initialized. Enter access code 0808.', kind: 'good' })
    addLog('Mission initialized; awaiting Level 1 credentials')
  }, [addLog])

  /** Access-code gate submit. */
  const access = useCallback(
    (rawCode) => {
      if (!initialized) {
        setInitialized(true)
        addLog('Mission initialized')
      }

      const code = rawCode.trim().toLowerCase()
      if (code === levels[current].code.toLowerCase()) {
        const { timed } = levels[current]
        setUnlocked(true)
        setView('puzzle')
        setAnswerFeedback(NO_FEEDBACK)
        setElapsed(timed ? 0 : null)
        setTimerRunning(Boolean(timed))
        addLog(`Level ${current + 1} access granted; puzzle decrypted`)
        if (timed) addLog('Stopwatch engaged: decryption time is being recorded')
        return true
      }

      setGateFeedback({ text: 'ACCESS DENIED — incorrect access code.', kind: 'bad' })
      addLog(`Authentication failed at Level ${current + 1}`)
      return false
    },
    [addLog, current, initialized],
  )

  /** Puzzle answer submit. */
  const submit = useCallback(
    (rawAnswer, user) => {
      const answer = rawAnswer.trim().toLowerCase()
      if (answer !== levels[current].answer.toLowerCase()) {
        setAnswerFeedback({ text: 'INCORRECT ANSWER — inspect the clue and try again.', kind: 'bad' })
        addLog(`Incorrect answer at Level ${current + 1}`)
        return false
      }

      // Record this level's timing before clearing
      const levelTime = elapsed
      setLevelTimings((prev) => ({ ...prev, [current]: { timeTakenSeconds: levelTime } }))

      setCleared((prev) => new Set(prev).add(current))
      setTimerRunning(false) // freeze the stopwatch the moment the answer lands
      setAnswerFeedback({ text: 'CORRECT — challenge cleared.', kind: 'good' })
      addLog(`Level ${current + 1} puzzle solved`)
      if (elapsed !== null) addLog(`Decryption time recorded: ${formatElapsed(elapsed)}`)

      clearTimeout(timerRef.current)
      if (current === TOTAL_LEVELS - 1) {
        timerRef.current = setTimeout(() => {
          setUnlocked(true)
          setView('success')
          addLog('MISSION COMPLETE // OPERATIVE ESCAPED')

          // Persist completed session to backend
          if (user) {
            const allTimings = { ...levelTimings, [current]: { timeTakenSeconds: levelTime } }
            const levelPayload = levels.map((lvl, idx) => ({
              title: lvl.title,
              solved: idx <= current,  // all previous + current are solved
              timeTakenSeconds: allTimings[idx]?.timeTakenSeconds ?? null,
            }))
            saveResult({
              userId: user.id,
              userName: user.name,
              completedAt: new Date().toISOString(),
              levels: levelPayload,
            }).catch((err) => console.warn('Could not save result to server:', err))
          }
        }, 650)
      } else {
        const next = current + 1
        timerRef.current = setTimeout(() => {
          showGate(next)
          addLog(`Next gate ready: Level ${next + 1}`)
        }, 700)
      }
      return true
    },
    [addLog, current, elapsed, levelTimings, showGate],
  )

  /** Sidebar level navigation. */
  const selectLevel = useCallback(
    (index) => {
      if (index > current) {
        addLog('Access denied: clear current gate first')
        return
      }
      showGate(index)
      addLog(`Level ${index + 1} selected`)
    },
    [addLog, current, showGate],
  )

  const reset = useCallback(() => {
    clearTimeout(timerRef.current)
    setCleared(new Set())
    setLevelTimings({})
    setInitialized(false)
    setLog(INITIAL_LOG)
    showGate(0)
  }, [showGate])

  const clearedCount = cleared.size
  const finished = clearedCount === TOTAL_LEVELS && view === 'success'

  const status = useMemo(() => {
    if (clearedCount === TOTAL_LEVELS) return 'ESCAPED'
    return unlocked ? 'ACTIVE' : 'LOCKED'
  }, [clearedCount, unlocked])

  return {
    // state
    current,
    level: levels[current],
    initialized,
    unlocked,
    cleared,
    clearedCount,
    progress: clearedCount / TOTAL_LEVELS,
    status,
    finished,
    view,
    log,
    gateFeedback,
    answerFeedback,
    elapsed,
    timerRunning,
    // actions
    start,
    access,
    submit,
    selectLevel,
    reset,
  }
}
