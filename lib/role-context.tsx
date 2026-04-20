'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { User, UserRole } from './types'

interface RoleContextValue {
  currentUser: User | null
  currentRole: UserRole
  users: User[]
  switchUser: (userId: string) => void
  isLoggedIn: boolean
  login: (role: UserRole) => void
  logout: () => void
  loading: boolean
}

const RoleContext = createContext<RoleContextValue>({
  currentUser: null,
  currentRole: 'employee',
  users: [],
  switchUser: () => {},
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  loading: true,
})

const STORAGE_KEY = 'ipk-current-user-id'
const ROLE_KEY = 'ipk-login-role'

export function RoleProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loginRole, setLoginRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore login role from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem(ROLE_KEY) as UserRole | null
    if (savedRole === 'boss' || savedRole === 'employee' || savedRole === 'lead') {
      setLoginRole(savedRole)
    }
    setLoading(false)
  }, [])

  // Fetch users once logged in
  useEffect(() => {
    if (!loginRole) return
    fetch('/api/users')
      .then(r => r.json())
      .then((data: User[]) => {
        if (!Array.isArray(data)) return
        setUsers(data)
        // Pick the first user matching the login role, or first user overall
        const savedId = localStorage.getItem(STORAGE_KEY)
        const saved = data.find(u => u.id === savedId && u.role === loginRole)
        const roleMatch = data.find(u => u.role === loginRole)
        setCurrentUser(saved || roleMatch || data[0] || null)
      })
  }, [loginRole])

  const switchUser = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setCurrentUser(user)
      localStorage.setItem(STORAGE_KEY, userId)
    }
  }, [users])

  const login = useCallback((role: UserRole) => {
    setLoginRole(role)
    localStorage.setItem(ROLE_KEY, role)
  }, [])

  const logout = useCallback(() => {
    setLoginRole(null)
    setCurrentUser(null)
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <RoleContext.Provider value={{
      currentUser,
      currentRole: loginRole ?? 'employee',
      users,
      switchUser,
      isLoggedIn: !!loginRole,
      login,
      logout,
      loading,
    }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
