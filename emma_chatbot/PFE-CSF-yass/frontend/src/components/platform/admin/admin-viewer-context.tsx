"use client"

import { createContext, useContext, type ReactNode } from "react"

type AdminViewerValue = {
  /** Compte assistant : export PDF limité / filigrané côté UI. */
  isAssistant: boolean
}

const AdminViewerContext = createContext<AdminViewerValue>({ isAssistant: false })

export function AdminViewerProvider({
  isAssistant,
  children,
}: {
  isAssistant: boolean
  children: ReactNode
}) {
  return (
    <AdminViewerContext.Provider value={{ isAssistant }}>{children}</AdminViewerContext.Provider>
  )
}

export function useAdminViewer(): AdminViewerValue {
  return useContext(AdminViewerContext)
}
