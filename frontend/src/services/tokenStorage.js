const KEY = 'internflow_auth'

export function loadAuth() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const auth = JSON.parse(raw)
    if (!auth.token || !auth.user || Date.now() > auth.expiresAt) {
      localStorage.removeItem(KEY)
      return null
    }
    return auth
  } catch {
    return null
  }
}

export function saveAuth(auth) {
  try {
    localStorage.setItem(KEY, JSON.stringify(auth))
  } catch {
    // storage unavailable: the user just has to log in again after a refresh
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}