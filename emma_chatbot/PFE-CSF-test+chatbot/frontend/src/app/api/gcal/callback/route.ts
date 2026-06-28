import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/server/backend"

/**
 * Point d’entrée OAuth Google Calendar côté navigateur (port 3001).
 * Google redirige ici ; on délègue au backend puis on renvoie la redirection finale (dashboard admin ou apprenant).
 */
export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search
  const backendCallback = `${getBackendUrl()}/api/v1/admin/planning/gcal/callback${qs}`

  try {
    const res = await fetch(backendCallback, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
    })

    const location = res.headers.get("location")
    if (location && res.status >= 300 && res.status < 400) {
      return NextResponse.redirect(location)
    }

    if (res.ok) {
      const text = await res.text()
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": res.headers.get("content-type") ?? "text/plain" },
      })
    }

    const errText = await res.text().catch(() => "")
    console.error("[gcal/callback] backend error", res.status, errText)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
    return NextResponse.redirect(`${appUrl}/dashboard?gcal=error&reason=backend_${res.status}`)
  } catch (err) {
    console.error("[gcal/callback] fetch failed", err)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
    return NextResponse.redirect(`${appUrl}/dashboard?gcal=error&reason=backend_unreachable`)
  }
}
