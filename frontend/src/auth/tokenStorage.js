const KEY = 'recipe-sharing.token'

export function getStoredToken() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(KEY, token)
    else localStorage.removeItem(KEY)
  } catch {
    // Storage may be unavailable (private mode); the session just won't persist.
  }
}
