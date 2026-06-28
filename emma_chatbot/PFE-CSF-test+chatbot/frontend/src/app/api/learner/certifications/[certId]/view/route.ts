import { cookies } from "next/headers"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { getBackendUrl } from "@/lib/server/backend"

type RouteCtx = { params: Promise<{ certId: string }> }

export async function GET(_req: Request, ctx: RouteCtx) {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) {
    return new Response("Non authentifié", { status: 401 })
  }

  const { certId } = await ctx.params
  const target = `${getBackendUrl()}/api/v1/learner/certifications/${certId}/view`
  const res = await fetch(target, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(text || "Certificat non disponible", { status: res.status })
  }

  const html = await res.text()
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
