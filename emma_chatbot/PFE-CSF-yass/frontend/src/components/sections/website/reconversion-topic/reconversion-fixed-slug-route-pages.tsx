import { ReconversionTopicBySlugPage } from "./reconversion-topic-by-slug-page"

/** Routes dédiées avec fallback / données API (`getReconversionTopicPageData`). */

export async function ReconversionFullStackRoutePage() {
  return <ReconversionTopicBySlugPage slug="full-stack" />
}

export async function ReconversionTesteurLogicielRoutePage() {
  return <ReconversionTopicBySlugPage slug="testeur-logiciel" />
}
