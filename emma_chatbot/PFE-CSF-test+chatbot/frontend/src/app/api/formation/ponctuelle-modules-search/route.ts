import { NextResponse } from "next/server"
import { searchPonctuelleModules } from "@/lib/server/ponctuelle-modules"

export const dynamic = "force-dynamic"

/** Relais `GET /api/v1/ponctuelle/modules/search` (liste filtrée sur /formation). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const modules = await searchPonctuelleModules(q)
  return NextResponse.json({ modules })
}
