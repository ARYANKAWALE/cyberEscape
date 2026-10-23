import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  clearSession,
  createUser,
  getSession,
  setSession,
  verifyCredentials,
} from '../lib/authStorage.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession())

  const register = useCallback(async ({ name, email, password }) => {
    const created = await createUser({ name, email, password })
    setSession(created)
    setUser(created)
    return created
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const verified = await verifyCredentials({ email, password })
    if (!verified) {
      throw new Error('ACCESS DENIED — invalid email or password.')
    }
    setSession(verified)
    setUser(verified)
    return verified
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), register, login, logout }),
    [user, register, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
