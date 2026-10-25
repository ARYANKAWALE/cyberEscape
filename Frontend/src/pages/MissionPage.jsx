import { useEffect, useRef } from 'react'
import Footer from '../components/game/Footer.jsx'
import GamePanel from '../components/game/GamePanel.jsx'
import Header from '../components/game/Header.jsx'
import MissionData from '../components/game/MissionData.jsx'
import Sidebar from '../components/game/Sidebar.jsx'
import { useGame } from '../context/GameContext.jsx'

export default function MissionPage() {
  const game = useGame()
  const panelRef = useRef(null)
  const accessInputRef = useRef(null)

  useEffect(() => {
    if (game.view === 'gate') {
      accessInputRef.current?.focus()
    }
  }, [game.view, game.current])

  return (
    <>
      <Header status={game.status} />

      <div className="relative z-[1] mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-[clamp(14px,3vw,38px)] pb-[38px] pt-[26px] max-sm:pt-[15px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar
          current={game.current}
          unlocked={game.unlocked}
          cleared={game.cleared}
          clearedCount={game.clearedCount}
          onSelect={game.selectLevel}
        />

        <main className="min-w-0">
          <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-[minmax(0,1fr)_260px]">
            <GamePanel ref={panelRef} game={game} accessInputRef={accessInputRef} />

            <aside className="flex flex-col gap-[18px]">
              <MissionData
                clearedCount={game.clearedCount}
                current={game.current}
                status={game.status}
                progress={game.progress}
              />
            </aside>
          </div>
        </main>
      </div>

      <Footer />
    </>
  )
}
