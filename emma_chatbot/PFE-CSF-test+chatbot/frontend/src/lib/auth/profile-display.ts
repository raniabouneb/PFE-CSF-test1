import type { ProfileUser } from "@/lib/auth/learner-profile-types"

/** Prénom affiché : champ dédié ou 1er mot de `name`. */
export function profileFirstName(user: ProfileUser): string {
  const fn = (user.firstName ?? "").trim()
  if (fn) return fn
  const n = (user.name ?? "").trim()
  if (!n) return ""
  return n.split(/\s+/).filter(Boolean)[0] ?? ""
}

/** Nom affiché : champ dédié ou reste de `name`. */
export function profileLastName(user: ProfileUser): string {
  const ln = (user.lastName ?? "").trim()
  if (ln) return ln
  const n = (user.name ?? "").trim()
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return ""
  return parts.slice(1).join(" ")
}

export function profileFieldOrDash(value: string | null | undefined): string {
  const v = (value ?? "").trim()
  return v || "—"
}
