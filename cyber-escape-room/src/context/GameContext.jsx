import { createContext, useContext } from 'react'
import { useEscapeRoom } from '../hooks/useEscapeRoom.js'

const GameContext = createContext(null)

/**
 * Hosts the escape-room state above the router so progress survives moving
 * between the welcome page (/) and the mission page (/mission).
 */
export function GameProvider({ children }) {
  const game = useEscapeRoom()
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame must be used within a <GameProvider>')
  }
  return ctx
}
