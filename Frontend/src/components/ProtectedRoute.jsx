import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/** Renders child routes only for authenticated users; otherwise sends them to /register (or /login for admin). */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const target = location.pathname.startsWith('/admin') ? '/login' : '/register'
    return <Navigate to={target} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
