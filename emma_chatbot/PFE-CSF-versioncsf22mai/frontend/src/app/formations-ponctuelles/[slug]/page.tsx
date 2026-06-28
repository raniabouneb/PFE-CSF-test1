import { notFound, permanentRedirect } from "next/navigation"
import {
  fetchPonctuelleFormationBySlug,
  normalizePonctuellePathSlug,
} from "@/lib/server/ponctuelle-formation"
import { slugFingerprint } from "@/lib/slug-fingerprint"
import { PonctuelleFormationDetail } from "@/components/sections/website/formations-ponctuelles"
import { TrackPageVisit } from "@/components/tracking/track-page-visit"
import { Footer } from "@/components/layout/website/footer"
import { PartenairesSectionWithData } from "@/components/sections/website/accueil/sections/partenaires-section-with-data"

export const dynamic = "force-dynamic"

function decodeSlugSegment(segment: string): string {
  const s = (segment ?? "").trim()
  if (!s) return ""
  try {
    return decodeURIComponent(s).trim()
  } catch {
    return s
  }
}

export default async function PonctuelleFormationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: slugParam } = await params
  const slugDecoded = decodeSlugSegment(slugParam)
  const slugNorm = normalizePonctuellePathSlug(slugParam)
  const data = await fetchPonctuelleFormationBySlug(slugParam)
  if (!data) {
    notFound()
  }

  const canonical = (data.slug ?? "").trim()
  const canonicalSeg =
    slugFingerprint(canonical) ||
    canonical
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "")
  const urlFp = slugNorm || slugFingerprint(slugDecoded) || slugDecoded
  if (canonicalSeg && urlFp && canonicalSeg !== urlFp) {
    permanentRedirect(`/formations-ponctuelles/${encodeURIComponent(canonicalSeg)}`)
  }

  return (
    <>
      <TrackPageVisit title={data.titre ?? data.slug} />
      <PonctuelleFormationDetail data={data} />
      <PartenairesSectionWithData />
      <Footer />
    </>
  )
}
