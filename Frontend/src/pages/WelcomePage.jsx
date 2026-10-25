import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/game/Footer.jsx'
import Header from '../components/game/Header.jsx'
import Hero from '../components/game/Hero.jsx'
import MissionBriefModal from '../components/game/MissionBriefModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useGame } from '../context/GameContext.jsx'

export default function WelcomePage() {
  const { user } = useAuth()
  const game = useGame()
  const navigate = useNavigate()
  const [briefOpen, setBriefOpen] = useState(false)

  // If operative has an active mission or already submitted, redirect to where they left off
  useEffect(() => {
    if (game.initialized || game.submitted || game.view === 'puzzle' || game.view === 'eliminated') {
      navigate('/mission', { replace: true })
    }
  }, [game.initialized, game.submitted, game.view, navigate])

  const handleStart = useCallback(() => {
    game.start()
    navigate('/mission')
  }, [game, navigate])

  return (
    <div className="flex min-h-screen flex-col">
      <Header status={game.status} />

      <main className="relative z-[1] mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-[clamp(14px,3vw,38px)] py-[clamp(20px,5vw,48px)]">
        <Hero
          name={user?.name}
          finished={game.finished}
          initialized={game.initialized}
          submitted={game.submitted}
          onStart={handleStart}
          onBrief={() => setBriefOpen(true)}
        />
      </main>

      <Footer />

      <MissionBriefModal open={briefOpen} onClose={() => setBriefOpen(false)} />
    </div>
  )
}
