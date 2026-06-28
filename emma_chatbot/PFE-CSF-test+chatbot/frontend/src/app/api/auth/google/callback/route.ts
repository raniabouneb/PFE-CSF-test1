import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { OAUTH_STATE_COOKIE, SESSION_COOKIE } from "@/lib/auth/constants"
import { migrateGuestChatIfAny } from "@/lib/auth/migrate-guest-chat"
import { getSessionCookieOptions } from "@/lib/auth/session"
import { getPostLoginPath } from "@/lib/auth/roles"
import { backendErrorMessage, getBackendUrl } from "@/lib/server/backend"

function redirectConnexion(request: Request, message: string) {
  const u = new URL("/authentification/connexion", request.url)
  u.searchParams.set("error", message)
  const res = NextResponse.redirect(u)
  res.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return res
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const errParam = url.searchParams.get("error")
  if (errParam) {
    return redirectConnexion(request, "Connexion Google annulée ou refusée.")
  }

  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const jar = await cookies()
  const expected = jar.get(OAUTH_STATE_COOKIE)?.value
  if (!code || !state || !expected || state !== expected) {
    return redirectConnexion(request, "Session OAuth invalide ou expirée. Réessayez.")
  }

  try {
    const r = await fetch(`${getBackendUrl()}/auth/google/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    const data = (await r.json().catch(() => ({}))) as {
      ok?: boolean
      user?: { id: string; email: string; name: string | null; role?: string | null }
      access_token?: string
      detail?: unknown
    }
    if (!r.ok) {
      return redirectConnexion(request, backendErrorMessage(data))
    }
    if (!data.access_token || !data.user) {
      return redirectConnexion(request, "Réponse serveur invalide.")
    }

    const nextPath = getPostLoginPath({
      role: data.user?.role,
      requestedPath: "/dashboard",
    })
    const home = new URL(nextPath, request.url)
    const res = NextResponse.redirect(home)
    res.cookies.set(SESSION_COOKIE, data.access_token, getSessionCookieOptions())
    await migrateGuestChatIfAny(request, data.access_token)
    res.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
    return res
  } catch (e) {
    console.error("[google/callback]", e)
    return redirectConnexion(request, "Erreur lors de la connexion Google.")
  }
}
