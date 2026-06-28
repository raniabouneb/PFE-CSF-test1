import { getPostLoginPath as resolvePostLoginPath } from "@/lib/auth/roles"

export const POST_LOGIN_REDIRECT_STORAGE_KEY = "csf_after_login_redirect"
export const POST_LOGIN_ACTION_STORAGE_KEY = "csf_after_login_action"

export function sanitizeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith("/")) return null
  if (value.startsWith("//")) return null
  return value
}

type PostLoginPathArgs = {
  role?: string | null
  requestedPath?: string | null
}

export function getPostLoginPath({ role, requestedPath }: PostLoginPathArgs): string {
  return resolvePostLoginPath({ role, requestedPath })
}
