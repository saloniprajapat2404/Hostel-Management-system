import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getSession } from '../../utils/auth'
import { canAccessPath, firstAllowedAppPath } from '../../constants/screenPermissions'

export default function ScreenAccessGuard() {
  const location = useLocation()
  const [user, setUser] = useState(() => getSession())

  useEffect(() => {
    const onSessionUpdated = (event) => {
      setUser(event.detail || getSession())
    }
    window.addEventListener('hms:session-updated', onSessionUpdated)
    return () => window.removeEventListener('hms:session-updated', onSessionUpdated)
  }, [])

  if (user && !canAccessPath(user, location.pathname)) {
    const fallback = firstAllowedAppPath(user)
    if (fallback !== location.pathname) {
      return <Navigate to={fallback} replace />
    }
  }

  return <Outlet />
}
