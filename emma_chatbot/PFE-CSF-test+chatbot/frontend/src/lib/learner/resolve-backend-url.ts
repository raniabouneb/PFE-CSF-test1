import { getBackendUrl } from "@/lib/server/backend"

/**
 * Routes apprenant : v1 (dashboard, certifications…) vs LMS (/api/learner/formations/…).
 */
export function resolveLearnerBackendUrl(subpath: string, search = ""): string {
  const base = getBackendUrl()
  const qs = search ? (search.startsWith("?") ? search : `?${search}`) : ""
  const p = subpath.replace(/^\/+/, "")

  if (
    p.startsWith("formations/") ||
    p === "formations" ||
    p.startsWith("notifications")
  ) {
    if (p === "formations" || p === "formations/") {
      return `${base}/api/v1/learner/formations${qs}`
    }
    return `${base}/api/learner/${p}${qs}`
  }

  return `${base}/api/v1/learner/${p}${qs}`
}
