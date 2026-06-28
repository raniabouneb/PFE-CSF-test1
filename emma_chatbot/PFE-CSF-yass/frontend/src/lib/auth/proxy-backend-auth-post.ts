import { NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { getSessionCookieOptions } from "@/lib/auth/session"
import { backendErrorMessage, getBackendUrl } from "@/lib/server/backend"

type AuthBackendPath = "auth/login" | "auth/register"

export async function proxyBackendAuthPost(
  backendPath: AuthBackendPath,
  req: Request,
  logLabel: string
): Promise<Response> {
  try {
    const json = await req.json()
    const r = await fetch(`${getBackendUrl()}/${backendPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    })
    const data = (await r.json().catch(() => ({}))) as {
      ok?: boolean
      user?: { id: string; email: string; name: string | null; role?: string | null }
      access_token?: string
      detail?: unknown
    }
    if (!r.ok) {
      return NextResponse.json({ error: backendErrorMessage(data) }, { status: r.status })
    }
    if (!data.access_token || !data.user) {
      return NextResponse.json({ error: "Réponse serveur invalide." }, { status: 502 })
    }
    const rawRole = (data.user as { role?: unknown }).role
    const role =
      typeof rawRole === "string" && rawRole.trim() !== ""
        ? rawRole.trim()
        : typeof rawRole === "number"
          ? String(rawRole)
          : undefined

    const response = NextResponse.json({
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        ...(role !== undefined ? { role } : {}),
      },
    })
    response.cookies.set(SESSION_COOKIE, data.access_token, getSessionCookieOptions())
    return response
  } catch (e) {
    console.error(`[${logLabel} proxy]`, e)
    const dev = process.env.NODE_ENV === "development"
    return NextResponse.json(
      { error: dev ? String(e) : "Erreur serveur." },
      { status: 500 }
    )
  }
}
