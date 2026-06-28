import { getReconversionTopicPageData } from "@/lib/server/reconversion-topic"
import { ReconversionTopicPage } from "./reconversion-topic-page"
import { FormationReconversionPlaceholderPage } from "./reconversion-placeholder-page"

function hasReconversionPageContent(data: {
  fullPacks: unknown[]
  miniPacks: unknown[]
  stats: unknown[]
  packDetailModules?: unknown[]
  horsPackModules: unknown[]
}) {
  return (
    data.fullPacks.length > 0 ||
    data.miniPacks.length > 0 ||
    data.stats.length > 0 ||
    (data.packDetailModules?.length ?? 0) > 0 ||
    data.horsPackModules.length > 0
  )
}

export async function ReconversionTopicBySlugPage({ slug }: { slug: string }) {
  const data = await getReconversionTopicPageData(slug)
  if (!hasReconversionPageContent(data)) {
    return <FormationReconversionPlaceholderPage title={data.hero.title} />
  }
  return <ReconversionTopicPage data={data} />
}
