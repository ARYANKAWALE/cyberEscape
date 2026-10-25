import { forwardRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import EliminatedView from './EliminatedView.jsx'
import GateView from './GateView.jsx'
import PuzzleView from './PuzzleView.jsx'
import SuccessView from './SuccessView.jsx'

function panelMeta(view, levelNumber, questionIndex) {
  switch (view) {
    case 'puzzle':
      return {
        title: `CHALLENGE // LEVEL ${levelNumber} • PART ${questionIndex + 1} OF 2`,
        pill: 'CHALLENGE ACTIVE',
      }
    case 'success':
      return { title: 'MISSION COMPLETE', pill: 'ESCAPE SUCCESSFUL' }
    case 'eliminated':
      return { title: 'OPERATIVE ELIMINATED', pill: 'MISSION FAILED' }
    default:
      return { title: `ACCESS GATE // LEVEL ${levelNumber}`, pill: 'AUTHENTICATION REQUIRED' }
  }
}

const GamePanel = forwardRef(function GamePanel({ game, accessInputRef }, ref) {
  const { user } = useAuth()
  const {
    view,
    current,
    questionIndex = 0,
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
  const { title, pill } = panelMeta(view, levelNumber, questionIndex)

  // Pill colour variant
  const pillClass =
    view === 'eliminated'
      ? 'pill bg-red-950/50 text-red-400 border-red-700/50'
      : 'pill'

  return (
    <section ref={ref} className="surface p-[22px] max-sm:p-[17px]">
      <div className="mb-5 flex items-center justify-between gap-2.5 border-b border-[#16405d] pb-[15px]">
        <h3 className={`m-0 text-[15px] tracking-[1.5px] ${view === 'eliminated' ? 'text-red-400' : ''}`}>
          {title}
        </h3>
        <span className={pillClass}>{pill}</span>
      </div>

      {view === 'gate' && (
        <GateView
          key={current}
          ref={accessInputRef}
          levelNumber={levelNumber}
          feedback={gateFeedback}
          onAccess={access}
        />
      )}

      {view === 'puzzle' && (
        <PuzzleView
          key={`${current}_${questionIndex}`}
          levelIndex={current}
          questionIndex={questionIndex}
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
          onRetry={reset}
        />
      )}
    </section>
  )
})

export default GamePanel
