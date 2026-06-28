"use client"

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"
import {
  resolveStaffPermissions,
  type StaffPermissionsMap,
  type StaffSectionId,
} from "@/lib/admin/staff-permissions"
import { isAssistantOnly } from "@/lib/auth/roles"

type AdminViewerValue = {
  isAssistant: boolean
  permissions: StaffPermissionsMap
  canRead: (section: string) => boolean
  canWrite: (section: string) => boolean
}

const AdminViewerContext = createContext<AdminViewerValue>({
  isAssistant: false,
  permissions: resolveStaffPermissions("admin"),
  canRead: () => true,
  canWrite: () => true,
})

export function AdminViewerProvider({
  role,
  staffPermissions,
  children,
}: {
  role: string | null | undefined
  staffPermissions?: Partial<Record<string, { read: boolean; write: boolean }>> | null
  children: ReactNode
}) {
  const isAssistant = isAssistantOnly(role)
  const permissions = useMemo(
    () => resolveStaffPermissions(role, staffPermissions ?? undefined),
    [role, staffPermissions],
  )

  const canRead = useCallback(
    (section: string) => permissions[section as StaffSectionId]?.read ?? true,
    [permissions],
  )

  const canWrite = useCallback(
    (section: string) => permissions[section as StaffSectionId]?.write ?? false,
    [permissions],
  )

  const value = useMemo(
    () => ({ isAssistant, permissions, canRead, canWrite }),
    [isAssistant, permissions, canRead, canWrite],
  )

  return <AdminViewerContext.Provider value={value}>{children}</AdminViewerContext.Provider>
}

export function useAdminViewer(): AdminViewerValue {
  return useContext(AdminViewerContext)
}
