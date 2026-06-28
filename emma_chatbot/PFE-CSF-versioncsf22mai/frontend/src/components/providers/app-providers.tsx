"use client"

import type { ReactNode } from "react"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "sonner"
import { AuthModal } from "@/components/platform/auth/auth-modal"
import { AuthModalProvider } from "@/components/platform/auth/auth-modal-context"
import {
  AuthUserProvider,
  type AuthUser,
} from "@/components/platform/auth/auth-user-context"
import { LearnerNotificationPopupHost } from "@/components/platform/dashboard/LearnerNotificationPopupHost"
import { ChatbotWidget } from "@/components/shared/chatbot/chatbot-widget"
import { CsfClientDiagnostics } from "@/components/providers/csf-client-diagnostics"
import { AppHashScroll } from "@/components/website/app-hash-scroll"
import { QueryProvider } from "@/components/providers/query-provider"
import { LearnerPlatformWarmup } from "@/components/platform/dashboard/learner-platform-warmup"

export function AppProviders({
  children,
  user = null,
}: {
  children: ReactNode
  user?: AuthUser | null
}) {
  return (
    <QueryProvider>
      <AuthUserProvider user={user}>
        <LearnerPlatformWarmup userId={user?.id} />
        <AuthModalProvider>
          {children}
          <CsfClientDiagnostics />
          <AppHashScroll />
          <AuthModal />
          <ChatbotWidget />
          <LearnerNotificationPopupHost />
          <Toaster richColors position="top-center" />
        </AuthModalProvider>
      </AuthUserProvider>
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryProvider>
  )
}
