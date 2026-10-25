import { forwardRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { ACCESS_CODE_TIME_LIMIT } from '../../data/levels.js'
import EliminatedView from './EliminatedView.jsx'
import GateView from './GateView.jsx'
import PuzzleView from './PuzzleView.jsx'
import SuccessView from './SuccessView.jsx'

function panelMeta(view, levelNumber) {
  switch (view) {
    case 'puzzle':
      return {
        title: `LEVEL ${levelNumber} // CHALLENGE`,
        pill: 'ACTIVE',
      }
    case 'success':
      return { title: 'MISSION COMPLETE', pill: 'CLEARED' }
    case 'eliminated':
      return { title: 'TEAM ELIMINATED', pill: 'FAILED' }
    default:
      return { title: `LEVEL ${levelNumber} // ACCESS GATE`, pill: 'AUTH REQUIRED' }
  }
}

const GamePanel = forwardRef(function GamePanel({ game, accessInputRef }, ref) {
  const { user } = useAuth()
  const {
    view,
    current,
    level,
    question,
    gateFeedback,
    answerFeedback,
    countdown,
    timerRunning,
    elapsed,
    eliminatedInfo,
    submitted,
    access,
    submit,
    reset,
  } = game
  const levelNumber = current + 1
  const { title, pill } = panelMeta(view, levelNumber)

  // Pill colour variant
  const pillClass =
    view === 'eliminated'
      ? 'pill bg-red-950/50 text-red-400 border-red-700/50'
      : 'pill'

  return (
    <section ref={ref} className="surface p-4 sm:p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-[#16405d] pb-3">
        <h2 className={`m-0 text-sm sm:text-base font-bold tracking-[1.5px] truncate ${view === 'eliminated' ? 'text-red-400' : ''}`}>
          {title}
        </h2>
        <span className={`${pillClass} shrink-0 text-[11px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 font-semibold`}>
          {pill}
        </span>
      </div>

      {view === 'gate' && (
        <GateView
          key={current}
          ref={accessInputRef}
          levelNumber={levelNumber}
          feedback={gateFeedback}
          countdown={countdown}
          timeLimit={ACCESS_CODE_TIME_LIMIT}
          timerRunning={timerRunning}
          onAccess={access}
        />
      )}

      {view === 'puzzle' && (
        <PuzzleView
          key={current}
          levelIndex={current}
          level={level}
          question={question}
          feedback={answerFeedback}
          countdown={countdown}
          timerRunning={timerRunning}
          onSubmit={submit}
          user={user}
        />
      )}

      {view === 'success' && (
        <SuccessView finalTime={elapsed} onReplay={reset} submitted={submitted} />
      )}

      {view === 'eliminated' && (
        <EliminatedView
          levelNumber={eliminatedInfo?.levelNumber || levelNumber}
          questionNumber={eliminatedInfo?.questionNumber || 1}
          isGate={eliminatedInfo?.isGate}
          onRetry={reset}
        />
      )}
    </section>
  )
})

export default GamePanel
