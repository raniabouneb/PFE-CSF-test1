import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { parseCookieValue } from "@/lib/csf-chat-guest-cookie"
import { resolveLearnerBackendUrl } from "@/lib/learner/resolve-backend-url"

type RouteCtx = { params: Promise<{ path?: string[] }> }

async function forwardLearner(
  req: NextRequest,
  method: string,
  segments: string[],
): Promise<NextResponse> {
  const token = parseCookieValue(req.headers.get("cookie"), SESSION_COOKIE)
  if (!token) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  const subpath = segments.length ? segments.join("/") : ""
  const url = new URL(req.url)
  const qs = url.searchParams.toString()
  const target = resolveLearnerBackendUrl(subpath, qs)

  const headers: HeadersInit = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }

  let body: ArrayBuffer | undefined
  if (method !== "GET" && method !== "HEAD") {
    const ct = req.headers.get("content-type")
    if (ct) (headers as Record<string, string>)["Content-Type"] = ct
    body = await req.arrayBuffer()
  }

  const fetchInit: RequestInit = {
    method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
    cache: "no-store",
  }

  let res: Response
  try {
    res = await fetch(target, fetchInit)
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 180))
    try {
      res = await fetch(target, fetchInit)
    } catch {
      return NextResponse.json(
        { error: "Backend indisponible temporairement. Réessayez dans 1-2 secondes." },
        { status: 503 },
      )
    }
  }

  const outHeaders = new Headers()
  const passCt = res.headers.get("Content-Type")
  if (passCt) outHeaders.set("Content-Type", passCt)

  const buf = await res.arrayBuffer()
  return new NextResponse(buf, { status: res.status, headers: outHeaders })
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return forwardLearner(req, "GET", path ?? [])
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return forwardLearner(req, "POST", path ?? [])
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return forwardLearner(req, "PATCH", path ?? [])
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return forwardLearner(req, "DELETE", path ?? [])
}
