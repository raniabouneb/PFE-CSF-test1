import { getReconversionTopicPageData } from "@/lib/server/reconversion-topic"
import { ReconversionTopicPage } from "./reconversion-topic-page"

export async function FormationReconversionEmbarquePage() {
  const data = await getReconversionTopicPageData("systeme-embarque")
  return <ReconversionTopicPage data={data} />
}
