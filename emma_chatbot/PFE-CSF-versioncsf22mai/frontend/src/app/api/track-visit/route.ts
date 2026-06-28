import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/server/backend"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await fetch(`${getBackendUrl()}/api/public/track-visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 204 })
  }
}
