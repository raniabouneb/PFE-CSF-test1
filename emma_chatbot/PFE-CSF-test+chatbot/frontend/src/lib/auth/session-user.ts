import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { AuthUser } from "@/components/platform/auth/auth-user-context"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { normalizeUserRole } from "@/lib/auth/roles"
import { getAuthSecret } from "@/lib/auth/secret"

/**
 * Utilisateur dérivé du JWT de session uniquement (pas d’appel HTTP).
 * Utilisé dans le layout racine pour ne pas bloquer chaque navigation sur /auth/me.
 */
export async function getAuthUserFromSession(): Promise<AuthUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getAuthSecret())
    const id = typeof payload.sub === "string" ? payload.sub : ""
    const email = typeof payload.email === "string" ? payload.email : ""
    if (!id || !email) return null

    const role =
      typeof payload.role === "string" && payload.role.trim() !== ""
        ? normalizeUserRole(payload.role.trim())
        : null

    const nameFromEmail = email.split("@")[0] || null

    return {
      id,
      email,
      name: nameFromEmail,
      role,
      photoUrl: null,
    }
  } catch {
    return null
  }
}
