"use client"

import { createContext, useContext, type ReactNode } from "react"

export type AuthUser = {
  id: string
  email: string
  name: string | null
  role?: string | null
}

const AuthUserContext = createContext<AuthUser | null>(null)

export function AuthUserProvider({
  children,
  user = null,
}: {
  children: ReactNode
  user?: AuthUser | null
}) {
  return <AuthUserContext.Provider value={user}>{children}</AuthUserContext.Provider>
}

export function useAuthUser(): AuthUser | null {
  return useContext(AuthUserContext)
}
