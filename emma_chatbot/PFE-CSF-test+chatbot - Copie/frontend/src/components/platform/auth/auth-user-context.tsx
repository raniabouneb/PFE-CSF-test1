"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { AuthUserHydrator } from "@/components/platform/auth/auth-user-hydrator"

export type AuthUser = {
  id: string
  email: string
  name: string | null
  role?: string | null
  photoUrl?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}

type AuthUserContextValue = {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  logout: () => Promise<void>
}

const AuthUserContext = createContext<AuthUserContextValue | null>(null)

export function AuthUserProvider({
  children,
  user: initialUser = null,
}: {
  children: ReactNode
  user?: AuthUser | null
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const queryClient = useQueryClient()
  const suppressHydrateRef = useRef(false)

  useEffect(() => {
    if (initialUser?.id) {
      suppressHydrateRef.current = false
    }
    setUser(initialUser)
  }, [initialUser?.id, initialUser?.email])

  const applyUser = useCallback((next: AuthUser | null) => {
    if (next !== null && suppressHydrateRef.current) return
    setUser(next)
  }, [])

  const logout = useCallback(async () => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    if (!res.ok) throw new Error("logout")
    suppressHydrateRef.current = true
    setUser(null)
    queryClient.clear()
    // Navigation complète : évite que le layout /dashboard relance redirect → connexion
    window.location.replace("/")
  }, [queryClient])

  const value = useMemo(
    () => ({ user, setUser, logout }),
    [user, logout],
  )

  return (
    <AuthUserContext.Provider value={value}>
      {children}
      <AuthUserHydrator sessionUser={initialUser} onUser={applyUser} />
    </AuthUserContext.Provider>
  )
}

function useAuthContext(): AuthUserContextValue {
  const ctx = useContext(AuthUserContext)
  if (!ctx) {
    throw new Error("useAuthUser doit être utilisé dans AuthUserProvider")
  }
  return ctx
}

export function useAuthUser(): AuthUser | null {
  return useAuthContext().user
}

export function useLogout(): () => Promise<void> {
  return useAuthContext().logout
}

export function useSetAuthUser(): (user: AuthUser | null) => void {
  return useAuthContext().setUser
}
