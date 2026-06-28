import { ReconversionDynamicSlugRoutePage } from "@/components/sections/website/reconversion-topic/reconversion-dynamic-slug-route-page"

export const dynamic = "force-dynamic"

export default async function ReconversionDynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ReconversionDynamicSlugRoutePage slug={slug} />
}
