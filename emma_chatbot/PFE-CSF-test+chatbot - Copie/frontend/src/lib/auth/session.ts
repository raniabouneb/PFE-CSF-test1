import type { NextResponse } from "next/server"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { getAuthSecret } from "@/lib/auth/secret"

export type SessionPayload = {
  userId: string
  email: string
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  }
}

export async function signSessionToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret())
}

/** À utiliser dans les Route Handlers : le cookie est attaché à la réponse HTTP (recommandé par Next.js). */
export async function appendSessionCookie(response: NextResponse, userId: string, email: string) {
  const token = await signSessionToken(userId, email)
  response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions())
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getAuthSecret())
    const userId = payload.sub as string | undefined
    const email = payload.email as string | undefined
    if (!userId || !email) return null
    return { userId, email }
  } catch {
    return null
  }
}

/** Supprime la session (ex. route logout) — préférer clearSessionCookie sur NextResponse quand possible. */
export async function deleteSession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
