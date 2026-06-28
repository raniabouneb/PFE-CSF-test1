"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

export type AuthModalMode = "login" | "signup"

type AuthModalContextValue = {
  isOpen: boolean
  mode: AuthModalMode
  openLogin: () => void
  openSignup: () => void
  close: () => void
  setMode: (m: AuthModalMode) => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthModalMode>("login")

  const openLogin = useCallback(() => {
    setMode("login")
    setIsOpen(true)
  }, [])

  const openSignup = useCallback(() => {
    setMode("signup")
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({ isOpen, mode, openLogin, openSignup, close, setMode }),
    [isOpen, mode, openLogin, openSignup, close],
  )

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
}

/** Valeur sûre si le provider manque (hydratation / arbre partiel) — évite un crash runtime. */
const AUTH_MODAL_FALLBACK: AuthModalContextValue = {
  isOpen: false,
  mode: "login",
  openLogin: () => {},
  openSignup: () => {},
  close: () => {},
  setMode: () => {},
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext)
  if (!ctx) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[useAuthModal] AuthModalProvider introuvable — modal auth désactivée. Le layout racine doit envelopper l’app avec <AppProviders> (voir app/layout.tsx).",
      )
    }
    return AUTH_MODAL_FALLBACK
  }
  return ctx
}
