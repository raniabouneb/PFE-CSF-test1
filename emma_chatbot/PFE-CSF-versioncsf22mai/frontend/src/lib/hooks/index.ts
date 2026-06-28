/**
 * Re-export all custom React Query hooks from this barrel file.
 *
 * Usage:
 *   import { useGroupes, useSessions, useFormations } from "@/lib/hooks"
 */

// ── Admin: Groupes ───────────────────────────────────────────────────────
export {
  useGroupes,
  useGroupe,
  useCreateGroupe,
  useUpdateGroupe,
  useDeleteGroupe,
} from "./admin/useGroupes"

// ── Admin: Apprenants ────────────────────────────────────────────────────
export {
  useApprenants,
  useAddApprenant,
  useRemoveApprenant,
} from "./admin/useApprenants"

// ── Admin: Sessions ──────────────────────────────────────────────────────
export {
  useSessions,
  useSession,
  useCreateSession,
  useUpdateSession,
  useAddGroupeToSession,
  useRemoveGroupeFromSession,
} from "./admin/useSessions"

// ── Admin: Attendance ────────────────────────────────────────────────────
export {
  useAttendance,
  useSaveAttendance,
} from "./admin/useAttendance"

// ── Learner: Formations ──────────────────────────────────────────────────
export {
  useFormations,
  useModuleDetail,
  usePlanning,
} from "./learner/useFormations"

// ── Learner: Dashboard plateforme (v1) ───────────────────────────────────
export {
  useLearnerDashboard,
  useLearnerFormationsPayload,
  useLearnerCertificationsPayload,
  prefetchLearnerPlatformQueries,
  learnerPlatformKeys,
  LEARNER_STALE_MS,
} from "./learner/use-learner-platform"

// ── Learner: Progression ─────────────────────────────────────────────────
export {
  useProgression,
  usePackProgression,
} from "./learner/useProgression"
