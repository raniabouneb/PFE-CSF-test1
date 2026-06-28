"use client"

import type { ReactNode } from "react"
import { QueryProvider } from "@/components/providers/query-provider"

/** React Query pour /admin (layout serveur → boundary client dédiée). */
export function AdminProviders({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>
}
