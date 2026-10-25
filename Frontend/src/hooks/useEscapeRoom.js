import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QUESTIONS_PER_LEVEL, TOTAL_LEVELS, TOTAL_QUESTIONS, levels } from '../data/levels.js'
import { checkUserSubmission, saveResult } from '../lib/api.js'
import { formatElapsed } from '../lib/time.js'

const NO_FEEDBACK = { text: '', kind: '' }
const STORAGE_PREFIX = 'cer.progress.'

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'guest'}`
}

function loadSavedProgress(userId) {
  if (!userId) return null
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCurrentProgress(userId, data) {
  if (!userId) return
  try {
    if (data === null) {
      localStorage.removeItem(getStorageKey(userId))
    } else {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(data))
    }
  } catch {}
}

/**
 * Game state hook for CyberEscape Room.
 *
 * Persists user state per operative ID to localStorage so refreshing the page
 * redirects them to exactly where they left off. Enforces 1 submission per user ID.
 */
export function useEscapeRoom(user) {
  const userId = user?.id

  // Initial state loaded from saved progress if present
  const initialSaved = useMemo(() => loadSavedProgress(userId), [userId])

  const [current, setCurrent] = useState(() => initialSaved?.current ?? 0)
  const [questionIndex, setQuestionIndex] = useState(() => initialSaved?.questionIndex ?? 0)
  const [unlocked, setUnlocked] = useState(() => Boolean(initialSaved?.unlocked))
  const [cleared, setCleared] = useState(() => new Set(initialSaved?.cleared || []))
  const [initialized, setInitialized] = useState(() => Boolean(initialSaved?.initialized))
  const [submitted, setSubmitted] = useState(() => Boolean(initialSaved?.submitted))
  const [view, setView] = useState(() => {
    if (initialSaved?.submitted) return 'success'
    return initialSaved?.view || 'gate'
  })
  const [gateFeedback, setGateFeedback] = useState(NO_FEEDBACK)
  const [answerFeedback, setAnswerFeedback] = useState(NO_FEEDBACK)

  // Countdown timer for active question
  const [countdown, setCountdown] = useState(() => {
    if (initialSaved?.submitted) return null
    if (initialSaved?.view === 'eliminated') return 0
    if (initialSaved?.view === 'puzzle' && initialSaved?.targetTime && initialSaved?.timerRunning) {
      return Math.max(0, Math.floor((initialSaved.targetTime - Date.now()) / 1000))
    }
    return initialSaved?.countdown ?? null
  })
  const [timerRunning, setTimerRunning] = useState(() => {
    if (initialSaved?.submitted || initialSaved?.view === 'eliminated') return false
    if (initialSaved?.view === 'puzzle' && initialSaved?.targetTime && initialSaved?.timerRunning) {
      const rem = Math.floor((initialSaved.targetTime - Date.now()) / 1000)
      return rem > 0
    }
    return Boolean(initialSaved?.timerRunning)
  })

  // Total time taken across all completed questions (for success screen)
  const [elapsed, setElapsed] = useState(() => initialSaved?.elapsed ?? null)

  // Level & question elimination info
  const [eliminatedInfo, setEliminatedInfo] = useState(
    () => initialSaved?.eliminatedInfo || { levelNumber: 1, questionNumber: 1 },
  )

  // Timings map: key `${levelIdx}_${questionIdx}` -> seconds taken
  const [questionTimings, setQuestionTimings] = useState(() => initialSaved?.questionTimings || {})
  const timingsRef = useRef(initialSaved?.questionTimings || {})
  const submittedRef = useRef(Boolean(initialSaved?.submitted))

  const timerRef = useRef(null)
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const addLog = useCallback(() => {}, [])

  const currentLevel = levels[current]
  const currentQuestion = currentLevel?.questions?.[questionIndex]

  // Synchronize when switching users or on initial backend check
  useEffect(() => {
    if (!userId) return

    // Verify with backend if this user has already submitted
    checkUserSubmission(userId)
      .then((res) => {
        if (res?.submitted) {
          setSubmitted(true)
          submittedRef.current = true
          setView('success')
          setUnlocked(true)
          setCleared(new Set([0, 1, 2, 3, 4]))
          setTimerRunning(false)
          setCountdown(null)
          if (res.session?.levels) {
            const totalSec = res.session.levels.reduce((acc, l) => acc + (l.timeTakenSeconds || 0), 0)
            setElapsed(totalSec)
          }
        }
      })
      .catch(() => {})
  }, [userId])

  // Save progress continuously to localStorage
  useEffect(() => {
    if (!userId) return

    const targetTime =
      timerRunning && countdown !== null && countdown > 0 ? Date.now() + countdown * 1000 : null

    saveCurrentProgress(userId, {
      current,
      questionIndex,
      unlocked,
      cleared: Array.from(cleared),
      initialized,
      submitted,
      view,
      countdown,
      timerRunning,
      targetTime,
      elapsed,
      questionTimings,
      eliminatedInfo,
    })
  }, [
    userId,
    current,
    questionIndex,
    unlocked,
    cleared,
    initialized,
    submitted,
    view,
    countdown,
    timerRunning,
    elapsed,
    questionTimings,
    eliminatedInfo,
  ])

  const showGate = useCallback((levelIndex) => {
    setCurrent(levelIndex)
    setQuestionIndex(0)
    setUnlocked(false)
    setView('gate')
    setCountdown(null)
    setTimerRunning(false)
    setGateFeedback(NO_FEEDBACK)
    setAnswerFeedback(NO_FEEDBACK)
  }, [])

  // ── Countdown Tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return undefined

    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) return prev
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [timerRunning])

  // Watch for countdown reaching 0 → trigger elimination
  useEffect(() => {
    if (countdown !== 0 || !timerRunning) return

    setTimerRunning(false)
    setEliminatedInfo({ levelNumber: current + 1, questionNumber: questionIndex + 1 })
    setView('eliminated')
    addLog(`⚠ TIME EXPIRED at Level ${current + 1}, Question ${questionIndex + 1} — OPERATIVE ELIMINATED`)
  }, [countdown, timerRunning, current, questionIndex, addLog])

  // Calculate elapsed time on current question
  const elapsedForCurrentQuestion = useCallback(() => {
    const limit = currentLevel?.timeLimit ?? 300
    return countdown !== null ? Math.max(0, limit - countdown) : 0
  }, [countdown, currentLevel])

  // Sync timeline progress to backend after every submission
  const syncProgressToBackend = useCallback(
    (status = 'INCOMPLETE', isFinal = false, overrideUser = null) => {
      const targetUser = overrideUser || user
      if (!targetUser || !targetUser.id) return

      const levelPayload = []
      levels.forEach((lvl, lIdx) => {
        lvl.questions.forEach((q, qIdx) => {
          const key = `${lIdx}_${qIdx}`
          const time = timingsRef.current[key]
          const isSolved = time !== undefined
          levelPayload.push({
            title: `L${lIdx + 1}: ${q.title}`,
            solved: Boolean(isSolved),
            timeTakenSeconds: time ?? null,
          })
        })
      })

      saveResult({
        userId: targetUser.id,
        userName: targetUser.name,
        email: targetUser.email,
        status,
        completedAt: isFinal ? new Date().toISOString() : null,
        levels: levelPayload,
      }).catch((err) => console.warn('Could not sync progress to server:', err))
    },
    [user],
  )

  /** "INITIALIZE MISSION" */
  const start = useCallback(() => {
    if (submitted) return
    setInitialized(true)
    setGateFeedback({ text: 'Mission initialized. Enter access code 0808.', kind: 'good' })
    addLog('Mission initialized; awaiting Level 1 credentials')
    syncProgressToBackend('INCOMPLETE', false)
  }, [addLog, submitted, syncProgressToBackend])

  /** Gate Code Submit */
  const access = useCallback(
    (rawCode) => {
      if (submitted) return false
      if (!initialized) {
        setInitialized(true)
        addLog('Mission initialized')
      }

      const code = rawCode.trim().toLowerCase()
      if (code === levels[0].code.toLowerCase()) {
        const { timeLimit } = levels[0]
        setUnlocked(true)
        setQuestionIndex(0)
        setView('puzzle')
        setAnswerFeedback(NO_FEEDBACK)
        setCountdown(timeLimit)
        setTimerRunning(true)
        addLog('Level 1 access granted; Question 1 decrypted')
        addLog(`Countdown started: ${Math.floor(timeLimit / 60)}m limit`)
        syncProgressToBackend('INCOMPLETE', false)
        return true
      }

      setGateFeedback({ text: 'ACCESS DENIED — incorrect access code.', kind: 'bad' })
      addLog('Authentication failed at Level 1')
      return false
    },
    [addLog, initialized, submitted, syncProgressToBackend],
  )

  /** Puzzle Answer Submit */
  const submit = useCallback(
    (rawAnswer, currentUser) => {
      if (submitted) return false
      const activeQ = levels[current].questions[questionIndex]
      const isCorrect =
        answer === activeQ.answer.toLowerCase() ||
        (Array.isArray(activeQ.acceptedAnswers) &&
          activeQ.acceptedAnswers.map((a) => a.toLowerCase()).includes(answer))

      if (!isCorrect) {
        setAnswerFeedback({ text: 'INCORRECT ANSWER — inspect the clue and try again.', kind: 'bad' })
        addLog(`Incorrect answer at Level ${current + 1}`)
        return false
      }

      // Compute time taken on this question
      const timeTaken = elapsedForCurrentQuestion()
      const timingKey = `${current}_${questionIndex}`
      timingsRef.current[timingKey] = timeTaken
      setQuestionTimings((prev) => ({ ...prev, [timingKey]: timeTaken }))

      setTimerRunning(false)
      addLog(`Level ${current + 1} solved in ${formatElapsed(timeTaken)}`)

      // Check if there is another question in this level
      if (questionIndex < QUESTIONS_PER_LEVEL - 1) {
        // Sync Question immediately to backend and Excel!
        syncProgressToBackend('INCOMPLETE', false, currentUser)

        setAnswerFeedback({ text: 'CORRECT! Question cleared — decrypting next question...', kind: 'good' })
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          setQuestionIndex(questionIndex + 1)
          setAnswerFeedback(NO_FEEDBACK)
          setTimerRunning(true)
          addLog(`Level ${current + 1} Question ${questionIndex + 2} decrypted; timer continues (${countdown ?? 0}s remaining)`)
        }, 800)
        return true
      }

      // Level cleared!
      setCleared((prev) => new Set(prev).add(current))
      setAnswerFeedback({ text: 'CORRECT — LEVEL CLEARED!', kind: 'good' })
      addLog(`Level ${current + 1} completely cleared!`)

      clearTimeout(timerRef.current)
      if (current === TOTAL_LEVELS - 1) {
        // Entire mission completed!
        syncProgressToBackend('COMPLETE', true, currentUser)

        timerRef.current = setTimeout(() => {
          setUnlocked(true)
          setView('success')
          setSubmitted(true)
          submittedRef.current = true
          addLog(`MISSION COMPLETE // ALL ${TOTAL_LEVELS} CHALLENGES BYPASSED`)

          // Calculate total time
          const allSeconds = Object.values(timingsRef.current).reduce((a, b) => a + (b || 0), 0)
          setElapsed(allSeconds)
        }, 700)
      } else {
        // Sync Level cleared immediately to backend and Excel!
        syncProgressToBackend('INCOMPLETE', false, currentUser)

        // Automatically advance to the next level's puzzle without an access code gate
        const next = current + 1
        timerRef.current = setTimeout(() => {
          setCurrent(next)
          setQuestionIndex(0)
          setUnlocked(true)
          setView('puzzle')
          setAnswerFeedback(NO_FEEDBACK)
          const limit = levels[next].timeLimit
          setCountdown(limit)
          setTimerRunning(true)
          addLog(`Level ${next + 1} unlocked; Challenge decrypted`)
          addLog(`Countdown started: ${Math.floor(limit / 60)}m limit`)
        }, 800)
      }
      return true
    },
    [addLog, current, elapsedForCurrentQuestion, questionIndex, submitted, syncProgressToBackend],
  )

  /** Sidebar Level Navigation */
  const selectLevel = useCallback(
    (index) => {
      if (submitted) return
      if (index > current) {
        addLog('Access denied: clear current level first')
        return
      }
      if (index === 0 && !unlocked) {
        showGate(0)
        addLog('Level 1 access gate')
        return
      }
      setCurrent(index)
      setQuestionIndex(0)
      setView('puzzle')
      addLog(`Level ${index + 1} selected`)
    },
    [addLog, current, unlocked, showGate, submitted],
  )

  /** Reset Mission */
  const reset = useCallback(() => {
    if (submittedRef.current || submitted) {
      addLog('Cannot restart: Final mission submission has already been recorded for this operative ID.')
      return
    }
    clearTimeout(timerRef.current)
    timingsRef.current = {}
    setQuestionTimings({})
    setCleared(new Set())
    setElapsed(null)
    setInitialized(false)
    setQuestionIndex(0)
    showGate(0)
    if (userId) {
      saveCurrentProgress(userId, null)
    }
  }, [showGate, submitted, userId, addLog])

  const clearedCount = cleared.size
  const finished = clearedCount === TOTAL_LEVELS && view === 'success'

  const status = useMemo(() => {
    if (submitted || clearedCount === TOTAL_LEVELS) return 'ESCAPED'
    if (view === 'eliminated') return 'ELIMINATED'
    return unlocked ? 'ACTIVE' : 'LOCKED'
  }, [clearedCount, unlocked, view, submitted])

  return {
    // state
    current,
    questionIndex,
    level: currentLevel,
    question: currentQuestion,
    initialized,
    unlocked,
    cleared,
    clearedCount,
    progress: (clearedCount * QUESTIONS_PER_LEVEL + (view === 'puzzle' ? questionIndex : 0)) / TOTAL_QUESTIONS,
    status,
    finished,
    submitted,
    view,
    gateFeedback,
    answerFeedback,
    countdown,
    timerRunning,
    elapsed,
    eliminatedInfo,
    questionTimings,
    // actions
    start,
    access,
    submit,
    selectLevel,
    reset,
  }
}
