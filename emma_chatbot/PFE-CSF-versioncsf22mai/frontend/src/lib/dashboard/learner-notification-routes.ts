import type { LearnerNotificationKind } from "@/lib/dashboard/learner-notifications-api"

export function linkForLearnerNotification(kind: LearnerNotificationKind): string {
  if (kind === "doc_validated" || kind === "cert_available") return "/dashboard/certifications"
  if (kind === "session_scheduled") return "/dashboard#seances-csf"
  return "/dashboard"
}
