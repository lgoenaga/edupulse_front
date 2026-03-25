export type UserRole = 'ADMIN' | 'ESTUDIANTE'

export type AuthSession = {
  token: string
  role: UserRole
  fullName: string
}

const STORAGE_KEY = 'edupulse.session'

export function getAuthSession(): AuthSession | null {
  const rawValue = localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AuthSession>
    if (!parsed.token || !parsed.role || !parsed.fullName) {
      clearAuthSession()
      return null
    }

    return {
      token: parsed.token,
      role: parsed.role,
      fullName: parsed.fullName,
    }
  } catch {
    clearAuthSession()
    return null
  }
}

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getDefaultRouteForRole(role: UserRole) {
  return role === 'ADMIN' ? '/app/admin/dashboard' : '/app/student/encuesta'
}