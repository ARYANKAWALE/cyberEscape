import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AdminRoute from './components/AdminRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PublicOnlyRoute from './components/PublicOnlyRoute.jsx'
import { GameProvider } from './context/GameContext.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MissionPage from './pages/MissionPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import WelcomePage from './pages/WelcomePage.jsx'

function GameShell() {
  return (
    <GameProvider>
      <Outlet />
    </GameProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<GameShell />}>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/mission" element={<MissionPage />} />
        </Route>
        <Route path="/leaderboard" element={<AdminRoute />}>
          <Route index element={<LeaderboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
