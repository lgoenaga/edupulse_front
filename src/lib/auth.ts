export type UserRole = 'ADMIN' | 'ESTUDIANTE'

export type AuthSession = {
  token: string
  role: UserRole
  fullName: string
}

const STORAGE_KEY = 'edupulse.session'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    const normalized = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    return JSON.parse(atob(normalized)) as Record<string, unknown>
  } catch {
    return null
  }
}

function isTokenExpired(token: string) {
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') {
    return true
  }

  return payload.exp * 1000 <= Date.now()
}

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

    if (isTokenExpired(parsed.token)) {
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