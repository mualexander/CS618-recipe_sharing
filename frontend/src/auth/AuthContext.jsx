import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useQueryClient } from '@tanstack/react-query'
import { getStoredToken, setStoredToken } from './tokenStorage.js'

const AuthContext = createContext(null)

// Returns { id, username } for a valid, unexpired token, otherwise null.
function decode(token) {
  if (!token) return null
  try {
    const { sub, username, exp } = jwtDecode(token)
    if (exp && exp * 1000 < Date.now()) return null
    return { id: sub, username }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => {
    const stored = getStoredToken()
    if (stored && !decode(stored)) {
      setStoredToken(null)
      return null
    }
    return stored
  })

  const login = useCallback(
    (newToken) => {
      setStoredToken(newToken)
      setToken(newToken)
      queryClient.invalidateQueries()
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    setStoredToken(null)
    setToken(null)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo(() => ({ token, user: decode(token), login, logout }), [token, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
