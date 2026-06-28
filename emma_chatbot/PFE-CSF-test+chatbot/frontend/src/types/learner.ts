/**
 * TypeScript types mirroring the backend Pydantic schemas
 * from app.schemas.learner (LMS learner endpoints).
 */

export type ModuleProgression = {
  module_id: string
  titre: string
  duree_minutes: number | null
  minutes_validees: number
  progress_percent: number
}

export type PackModuleProgression = {
  module_id: string
  titre: string
  ordre: number
  statut: "locked" | "open" | "done"
  unlocked_at: string | null
  completed_at: string | null
}

export type Formation = {
  enrollment_id: string
  groupe_id: string
  groupe_nom: string
  type: "ponctuelle" | "reconversion"
  groupe_statut: string
  progress_percent: number
  modules: ModuleProgression[]
  pack_modules: PackModuleProgression[]
}

export type SupportItem = {
  id: string
  file_name: string
  url: string
}

export type ModuleDetail = {
  id: string
  titre: string
  description: string | null
  duree_minutes: number | null
  pdf_url: string | null
  minutes_validees: number
  statut: string | null
  sessions: SessionPlanifiee[]
  supports: SupportItem[]
}

export type SessionPlanifiee = {
  session_id: string
  titre: string
  date: string
  heure_debut: string | null
  duree_minutes: number | null
  lieu: string | null
  statut: string
  module_titre: string | null
  groupe_nom: string | null
}
