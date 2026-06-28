/** Aligné sur `users.role` côté API (valeurs normalisées en minuscules). */

export type UserRole = "apprenant" | "visiteur" | "admin" | "assistant"

const STAFF: ReadonlySet<string> = new Set(["admin", "assistant"])

const ROLE_ALIASES: Record<string, UserRole> = {
  administrator: "admin",
  administrateur: "admin",
  superadmin: "admin",
  super_admin: "admin",
  root: "admin",
}

export function normalizeUserRole(role: string | null | undefined): UserRole {
  let r = (role ?? "apprenant").trim().toLowerCase().replace(/^['"]|['"]$/g, "")
  r = (ROLE_ALIASES[r] ?? r) as string
  if (r === "visiteur" || r === "admin" || r === "assistant") return r
  return "apprenant"
}

export function isStaffRole(role: string | null | undefined): boolean {
  return STAFF.has(normalizeUserRole(role))
}

export function isAssistantOnly(role: string | null | undefined): boolean {
  return normalizeUserRole(role) === "assistant"
}

/**
 * Après connexion : staff → `/admin` ; sinon chemin demandé s’il est interne et non-admin, sinon `/dashboard`.
 */
export function getPostLoginPath(options: {
  role: string | null | undefined
  /** Ex. `/dashboard` depuis `?redirect=` */
  requestedPath?: string | null
}): string {
  if (isStaffRole(options.role)) return "/admin"
  const p = options.requestedPath?.trim()
  if (p?.startsWith("/") && !p.startsWith("//") && !p.startsWith("/admin")) {
    return p
  }
  return "/dashboard"
}
