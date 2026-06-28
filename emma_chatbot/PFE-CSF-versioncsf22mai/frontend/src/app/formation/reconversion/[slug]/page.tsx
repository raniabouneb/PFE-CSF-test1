import { ReconversionTopicBySlugPage } from "@/components/sections/website/reconversion-topic/reconversion-topic-by-slug-page"

export const dynamic = "force-dynamic"

/** Parcours reconversion : API + repli statique (full-stack, testeur-logiciel, etc.). */
export default async function ReconversionDynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ReconversionTopicBySlugPage slug={slug} />
}
