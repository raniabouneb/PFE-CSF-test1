import { randomUUID } from "crypto"

export const CSF_CHAT_GUEST_COOKIE = "csf_chat_guest_session"

export function parseCookieValue(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(";")
  for (const p of parts) {
    const [k, ...rest] = p.trim().split("=")
    if (k === key) {
      const v = rest.join("=").trim()
      return v ? decodeURIComponent(v) : null
    }
  }
  return null
}

export function ensureGuestSessionId(current: string | null | undefined): string {
  const v = (current ?? "").trim()
  return v || randomUUID()
}

export function guestCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  }
}
