import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { getAuthSecret } from "@/lib/auth/secret"
import type { ProfileUser } from "@/lib/auth/learner-profile-types"
import { getBackendUrl } from "@/lib/server/backend"

async function roleFromSessionJwt(token: string): Promise<string | undefined> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret())
    const r = payload.role
    return typeof r === "string" && r.trim() !== "" ? r.trim() : undefined
  } catch {
    return undefined
  }
}

export async function getCurrentUser(): Promise<ProfileUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const jwtRole = await roleFromSessionJwt(token)

  let user: ProfileUser
  try {
    const res = await fetch(`${getBackendUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    user = (await res.json()) as ProfileUser
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[getCurrentUser] Backend injoignable (${getBackendUrl()}). Lance l’API FastAPI ou vérifie BACKEND_URL dans .env.local — session ignorée jusqu’à ce que /auth/me réponde.`
      )
    }
    return null
  }

  const apiRole =
    typeof user.role === "string" && user.role.trim() !== "" ? user.role.trim() : undefined
  const mergedRole = apiRole ?? jwtRole
  if (mergedRole !== undefined && mergedRole !== user.role) {
    return { ...user, role: mergedRole }
  }
  return user
}
