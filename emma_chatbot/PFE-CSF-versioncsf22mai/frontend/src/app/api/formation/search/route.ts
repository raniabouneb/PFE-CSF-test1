import { NextResponse } from "next/server"
import {
  sanitizeCertificationSearchHref,
  sanitizePonctuelleModuleSearchHref,
  sanitizePonctuelleTopicHref,
  sanitizeReconversionTopicHref,
} from "@/lib/formation-topic-cards-shared"
import { getApiV1BaseUrl } from "@/lib/server/backend"

export const dynamic = "force-dynamic"

type FormationSearchApiItem = {
  id: string
  kind: string
  label: string
  subtitle?: string
  href: string
}

function sanitizeSearchHref(item: FormationSearchApiItem): string {
  const k = (item.kind ?? "").toLowerCase()
  if (k === "reconversion" || k === "reconversion_module") {
    return sanitizeReconversionTopicHref(item.href)
  }
  if (k === "ponctuelle" || k === "ponctuelle_module") {
    if (k === "ponctuelle_module") {
      return sanitizePonctuelleModuleSearchHref(item.href, item.id)
    }
    return sanitizePonctuelleTopicHref(item.href)
  }
  if (k === "certification") {
    return sanitizeCertificationSearchHref(item.href)
  }
  if (k === "certification_category") {
    return (item.href ?? "/certifications").toString()
  }
  return item.href
}

/** Relais vers FastAPI `GET /api/v1/formation/search` (barre recherche page /formation). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const url = `${getApiV1BaseUrl()}/formation/search?${new URLSearchParams({ q }).toString()}`

  try {
    console.log("NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL)
    console.log("Next.js Proxy appelle :", url)
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error("[formation/search]", res.status, text)
      return NextResponse.json({ suggestions: [] as FormationSearchApiItem[] }, { status: 200 })
    }
    const data = (await res.json()) as { suggestions?: FormationSearchApiItem[] }
    const raw = Array.isArray(data.suggestions) ? data.suggestions : []
    return NextResponse.json({
      suggestions: raw.map((s) => ({ ...s, href: sanitizeSearchHref(s) })),
    })
  } catch (e) {
    console.error("Erreur Proxy :", e)
    console.error("[formation/search]", e)
    return NextResponse.json({ suggestions: [] as FormationSearchApiItem[] }, { status: 200 })
  }
}
