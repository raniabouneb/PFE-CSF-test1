import { notFound } from "next/navigation"
import { slugFingerprint } from "@/lib/slug-fingerprint"
import { fetchReconversionTopicFromDb } from "@/lib/server/reconversion-topic"
import { ReconversionTopicPage } from "./reconversion-topic-page"

function decodeTopicSlugSegment(segment: string): string {
  let t = (segment ?? "").trim().replace(/\+/g, " ")
  if (!t) return ""
  try {
    return decodeURIComponent(t).trim()
  } catch {
    return t.trim()
  }
}

/**
 * Route dynamique `/formation/reconversion/[slug]` : données API uniquement (404 si absent en BD).
 */
export async function ReconversionDynamicSlugRoutePage({ slug }: { slug: string }) {
  const raw = decodeTopicSlugSegment(slug)
  const forApi =
    slugFingerprint(raw) ||
    raw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "") ||
    raw
  if (!forApi) {
    notFound()
  }
  const data = await fetchReconversionTopicFromDb(forApi)
  if (!data) {
    notFound()
  }
  return <ReconversionTopicPage data={data} />
}
