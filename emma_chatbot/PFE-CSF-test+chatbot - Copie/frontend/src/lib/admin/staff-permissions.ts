export const STAFF_SECTIONS = [
  "dashboard",
  "apprenants",
  "catalogue",
  "planning",
  "validation",
  "journal",
] as const

export type StaffSectionId = (typeof STAFF_SECTIONS)[number]

export type SectionPermission = { read: boolean; write: boolean }

export type StaffPermissionsMap = Record<StaffSectionId, SectionPermission>

export const SECTION_LABELS: Record<StaffSectionId, string> = {
  dashboard: "Tableau de bord",
  apprenants: "Gestion des apprenants",
  catalogue: "Catalogue de formation",
  planning: "Planning et séances",
  validation: "Centre de validation",
  journal: "Journal d'activité",
}

const DEFAULT_ASSISTANT: StaffPermissionsMap = {
  dashboard: { read: true, write: false },
  apprenants: { read: true, write: true },
  catalogue: { read: true, write: false },
  planning: { read: true, write: true },
  validation: { read: true, write: false },
  journal: { read: true, write: false },
}

const FULL_ACCESS: StaffPermissionsMap = {
  dashboard: { read: true, write: true },
  apprenants: { read: true, write: true },
  catalogue: { read: true, write: true },
  planning: { read: true, write: true },
  validation: { read: true, write: true },
  journal: { read: true, write: true },
}

function normalizeSection(raw: unknown, fallback: SectionPermission): SectionPermission {
  if (!raw || typeof raw !== "object") return { ...fallback }
  const o = raw as { read?: unknown; write?: unknown }
  return {
    read: typeof o.read === "boolean" ? o.read : fallback.read,
    write: typeof o.write === "boolean" ? o.write : fallback.write,
  }
}

export function resolveStaffPermissions(
  role: string | null | undefined,
  raw?: Partial<Record<string, SectionPermission>> | null,
): StaffPermissionsMap {
  const base =
    (role ?? "").toLowerCase() === "admin" ? { ...FULL_ACCESS } : { ...DEFAULT_ASSISTANT }
  if (!raw) return base
  for (const section of STAFF_SECTIONS) {
    if (raw[section]) {
      base[section] = normalizeSection(raw[section], base[section])
    }
  }
  return base
}

export function emptyStaffPermissions(): StaffPermissionsMap {
  return Object.fromEntries(
    STAFF_SECTIONS.map((s) => [s, { read: false, write: false }]),
  ) as StaffPermissionsMap
}
