import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Renders child routes only for admin users.
 * - Not logged in  → redirect to /login
 * - Logged in but not admin → redirect to / with an "access denied" message
 */
export default function AdminRoute() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" replace state={{ adminDenied: true }} />
  }

  return <Outlet />
}
