import { NextResponse } from "next/server"
import { getFormationTopicCardsForFormats } from "@/lib/server/formation-topic-cards"

export const dynamic = "force-dynamic"

/** Relais vers FastAPI — même logique que le SSR de `/formation`, utile pour recharger les grilles côté client. */
export async function GET() {
  const data = await getFormationTopicCardsForFormats()
  return NextResponse.json(data ?? { reconversion: [], ponctuelle: [] })
}
