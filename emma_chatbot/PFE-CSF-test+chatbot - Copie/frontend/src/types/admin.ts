/**
 * TypeScript types mirroring the backend Pydantic schemas
 * from app.domains.admin.apprenants.schemas
 */

export type ModuleFormat = "reconversion" | "ponctuelle" | "sur_mesure"
export type GroupStatus = "pending" | "active" | "terminee" | "suspendue"
export type MemberStatus = "pending" | "linked" | "active" | "archived"
export type AccessKind =
  | "reconversion_topic"
  | "reconversion_pack"
  | "ponctuelle_formation"
  | "reconversion_module"
  | "ponctuelle_module"
export type SessionStatus = "planned" | "completed" | "cancelled"
export type AttendanceStatus = "present" | "absent" | "excused" | "pending"
export type ProgressStatus = "not_started" | "in_progress" | "completed"

export type Groupe = {
  id: string
  name: string
  description: string | null
  formationLabel: string
  format: ModuleFormat
  status: GroupStatus
  startDate: string | null
  endDate: string | null
  reconversionTopicSlug: string | null
  reconversionTopicLabel: string | null
  reconversionPackId: string | null
  reconversionPackLabel: string | null
  ponctuelleFormationSlug: string | null
  ponctuelleFormationLabel: string | null
  ponctuelleFormationSlugs: string[]
  ponctuelleFormationLabels: string[]
  memberCount: number
  progressAverage: number
  accessCount: number
}

export type Apprenant = {
  id: string
  groupId: string
  userId: string | null
  email: string
  firstName: string | null
  lastName: string | null
  fullName: string
  status: MemberStatus
  pointsTotal: number
  linkedAt: string | null
  attendanceRate: number
  progressAverage: number
  notesCount: number
}

export type GroupAccess = {
  id: string
  groupId: string
  accessKind: AccessKind
  targetRef: string
  label: string
  kindLabel: string
  targetLabel: string
  formationLabel: string | null
}

export type GroupSession = {
  id: string
  groupId: string
  accessId: string | null
  targetRef: string | null
  targetKind: string | null
  targetLabel: string | null
  title: string
  scheduledAt: string
  durationMinutes: number
  status: SessionStatus
  notes: string | null
  attendanceSummary: {
    total: number
    present: number
    absent: number
    excused: number
    pending: number
  }
  attendance: {
    memberId: string
    status: AttendanceStatus
    note: string | null
  }[]
}

export type GroupDetail = {
  group: Groupe
  members: Apprenant[]
  accesses: GroupAccess[]
  sessions: GroupSession[]
}

export type GroupCreateBody = {
  name: string
  description?: string | null
  format: ModuleFormat
  reconversionTopicSlug?: string | null
  reconversionPackId?: string | null
  ponctuelleFormationSlug?: string | null
  ponctuelleModuleRefs?: string[]
  startDate?: string | null
  endDate?: string | null
  status?: GroupStatus
}

export type GroupPatchBody = {
  name?: string | null
  description?: string | null
  reconversionTopicSlug?: string | null
  reconversionPackId?: string | null
  ponctuelleFormationSlug?: string | null
  ponctuelleModuleRefs?: string[] | null
  startDate?: string | null
  endDate?: string | null
  status?: GroupStatus | null
}

export type GroupMemberCreateBody = {
  email: string
  firstName?: string | null
  lastName?: string | null
}


// ── LMS Sessions (new UUID-based schema) ─────────────────────────────────

export type LmsSessionStatut = "planifiee" | "en_cours" | "terminee" | "annulee"

export type LmsModuleRef = {
  id: string
  titre: string
  duree_minutes: number | null
}

export type LmsGroupeRef = {
  id: string
  nom: string
  type: "ponctuelle" | "reconversion"
  statut: string
}

export type ApprenantInSession = {
  apprenant_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  enrollment_type: string
}

export type SessionWithGroups = {
  id: string
  module_id: string | null
  titre: string
  date: string
  heure_debut: string | null
  duree_minutes: number | null
  lieu: string | null
  statut: LmsSessionStatut
  created_at: string | null
  module: LmsModuleRef | null
  groupes: LmsGroupeRef[]
}

export type SessionDetail = SessionWithGroups & {
  apprenants: ApprenantInSession[]
}

export type AttendanceRecord = {
  apprenant_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  enrollment_type: string
  present: boolean
  marked_at: string | null
}

export type SessionCreateBody = {
  module_id?: string | null
  titre: string
  date: string
  heure_debut?: string | null
  duree_minutes?: number | null
  lieu?: string | null
  group_ids: string[]
}

export type SessionPatchBody = {
  titre?: string | null
  date?: string | null
  heure_debut?: string | null
  duree_minutes?: number | null
  lieu?: string | null
  statut?: LmsSessionStatut | null
  module_id?: string | null
}
