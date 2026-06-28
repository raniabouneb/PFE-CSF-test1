import { NextResponse } from "next/server"
import { getCertificationsPageData } from "@/lib/server/certifications-page"

export const dynamic = "force-dynamic"

export async function GET() {
  const data = await getCertificationsPageData()
  const cards = [
    ...data.sections.flatMap((s) => s.cards),
    ...data.orphanCards,
  ]
  const set = new Set<string>()
  for (const c of cards) {
    if (typeof c.category === "string") {
      const v = c.category.trim()
      if (v) set.add(v)
    }
  }
  return NextResponse.json({ categories: Array.from(set).sort((a, b) => a.localeCompare(b)) })
}

