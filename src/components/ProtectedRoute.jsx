import { Navigate, Outlet } from 'react-router-dom'
import { getSession, getToken } from '../utils/auth'

export default function ProtectedRoute({ roles }) {
  const token = getToken()
  const user = getSession()

  if (!token || !user) {
    return <Navigate to="/" replace />
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
