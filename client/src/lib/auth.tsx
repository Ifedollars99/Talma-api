/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError, session } from './apiClient'
import type { AuthResponse, User } from '../types'

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: {
    username: string
    email: string
    password: string
    role: 'user' | 'creator'
  }) => Promise<User>
  logout: () => Promise<void>
  updateProfile: (changes: Partial<
    Pick<
      User,
      | 'username'
      | 'region'
      | 'state'
      | 'language'
      | 'timezone'
      | 'bio'
      | 'avatarUrl'
      | 'gender'
      | 'privacyPublic'
      | 'emailNotifications'
    >
  >) => Promise<User>
  refreshUser: () => Promise<User | null>
  deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Restoring the session is shared between callers so React's StrictMode
 * double-invocation (and any concurrent mount) can never trigger two
 * refresh-token rotations — which the API would treat as a replay.
 */
let restorePromise: Promise<User | null> | null = null

function restoreSession(): Promise<User | null> {
  restorePromise ??= (async () => {
    const token = await session.refresh()
    if (!token) return null
    try {
      const data = await api.get<{ user: User }>('/auth/me')
      return data.user
    } catch {
      return null
    }
  })()
  return restorePromise
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /** Restores an existing session from the HttpOnly refresh cookie on boot. */
  useEffect(() => {
    let cancelled = false

    void restoreSession().then((restored) => {
      if (cancelled) return
      setUser(restored)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  /**
   * When a refresh attempt fails the session manager clears the access token.
   * Clearing the user here sends the student back to the sign-in screen
   * instead of leaving the interface in a half-authenticated state.
   */
  useEffect(
    () =>
      session.subscribe((token) => {
        if (!token) {
          setUser(null)
          setIsLoading(false)
        }
      }),
    [],
  )

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthResponse>('/auth/login', { email, password })
    session.set(data.accessToken)
    setUser(data.user)
    restorePromise = null
    return data.user
  }, [])

  const register = useCallback(
    async (input: {
      username: string
      email: string
      password: string
      role: 'user' | 'creator'
    }) => {
      const data = await api.post<AuthResponse>('/auth/register', input)
      session.set(data.accessToken)
      setUser(data.user)
      restorePromise = null
      return data.user
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
    } finally {
      session.set(null)
      setUser(null)
      restorePromise = null
    }
  }, [])

  const updateProfile = useCallback(
    async (
      changes: Partial<
        Pick<
          User,
          | 'username'
          | 'region'
          | 'state'
          | 'language'
          | 'timezone'
          | 'bio'
          | 'avatarUrl'
          | 'gender'
          | 'privacyPublic'
          | 'emailNotifications'
        >
      >,
    ) => {
      const data = await api.patch<{ user: User }>('/users/me', changes)
      setUser(data.user)
      return data.user
    },
    [],
  )

  /** Re-reads the signed-in user (used after creator verification). */
  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>('/auth/me')
      setUser(data.user)
      return data.user
    } catch {
      return null
    }
  }, [])

  const deleteAccount = useCallback(async () => {
    await api.delete('/users/me')
    session.set(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
      deleteAccount,
    }),
    [user, isLoading, login, register, logout, updateProfile, refreshUser, deleteAccount],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>')
  }
  return context
}
