import { forwardRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import GateView from './GateView.jsx'
import PuzzleView from './PuzzleView.jsx'
import SuccessView from './SuccessView.jsx'

function panelMeta(view, levelNumber) {
  switch (view) {
    case 'puzzle':
      return { title: `CHALLENGE // LEVEL ${levelNumber}`, pill: 'GATE ACTIVE' }
    case 'success':
      return { title: 'MISSION COMPLETE', pill: 'ESCAPE SUCCESSFUL' }
    default:
      return { title: `ACCESS GATE // LEVEL ${levelNumber}`, pill: 'AUTHENTICATION REQUIRED' }
  }
}

const GamePanel = forwardRef(function GamePanel({ game, accessInputRef }, ref) {
  const { user } = useAuth()
  const {
    view,
    current,
    level,
    gateFeedback,
    answerFeedback,
    elapsed,
    timerRunning,
    access,
    submit,
    reset,
  } = game
  const levelNumber = current + 1
  const { title, pill } = panelMeta(view, levelNumber)

  return (
    <section ref={ref} className="surface p-[22px] max-sm:p-[17px]">
      <div className="mb-5 flex items-center justify-between gap-2.5 border-b border-[#16405d] pb-[15px]">
        <h3 className="m-0 text-[15px] tracking-[1.5px]">{title}</h3>
        <span className="pill">{pill}</span>
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
          key={current}
          levelIndex={current}
          level={level}
          feedback={answerFeedback}
          elapsed={elapsed}
          timerRunning={timerRunning}
          onSubmit={submit}
          user={user}
        />
      )}

      {view === 'success' && <SuccessView finalTime={elapsed} onReplay={reset} />}
    </section>
  )
})

export default GamePanel
