"use client"

import type { ReactNode } from "react"
import { Toaster } from "sonner"
import { AuthModal } from "@/components/platform/auth/auth-modal"
import { AuthModalProvider } from "@/components/platform/auth/auth-modal-context"
import {
  AuthUserProvider,
  type AuthUser,
} from "@/components/platform/auth/auth-user-context"
import { CsfClientDiagnostics } from "@/components/providers/csf-client-diagnostics"
import { AppHashScroll } from "@/components/website/app-hash-scroll"

export function AppProviders({
  children,
  user = null,
}: {
  children: ReactNode
  user?: AuthUser | null
}) {
  return (
    <AuthUserProvider user={user}>
      <AuthModalProvider>
        {children}
        <CsfClientDiagnostics />
        <AppHashScroll />
        <AuthModal />
        <Toaster richColors position="top-center" />
      </AuthModalProvider>
    </AuthUserProvider>
  )
}
