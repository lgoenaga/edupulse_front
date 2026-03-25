import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAuthSession, getDefaultRouteForRole, type UserRole } from '../lib/auth'

type RequireAuthProps = {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const location = useLocation()
  const session = getAuthSession()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to={getDefaultRouteForRole(session.role)} replace />
  }

  return <>{children}</>
}