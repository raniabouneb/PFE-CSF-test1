import type { AuthUser } from "@/components/platform/auth/auth-user-context"
import type { ProfileUser } from "@/lib/auth/learner-profile-types"

export function mapMeToAuthUser(data: ProfileUser, fallback?: AuthUser | null): AuthUser {
  const firstName = data.firstName ?? null
  const lastName = data.lastName ?? null
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    (data.name ?? "").trim() ||
    fallback?.name ||
    null

  return {
    id: data.id,
    email: data.email,
    name: fullName,
    role: data.role ?? fallback?.role,
    photoUrl: data.photoUrl ?? fallback?.photoUrl ?? null,
    firstName,
    lastName,
    phone: data.phone ?? null,
  }
}
