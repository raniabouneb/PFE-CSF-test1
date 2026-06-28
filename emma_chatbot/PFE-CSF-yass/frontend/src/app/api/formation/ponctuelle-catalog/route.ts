import { fetchPonctuelleFormationBySlug, listPonctuelleFormations } from "@/lib/server/ponctuelle-formation"
import { getFormationTopicCardsForFormats } from "@/lib/server/formation-topic-cards"

type CatalogModule = {
  id: string
  title: string
  imageUrl: string
  description: string
}

type CatalogFormation = {
  slug: string
  title: string
  cardTitle: string
  modules: CatalogModule[]
}

export async function GET() {
  try {
    const list = await listPonctuelleFormations()
    const cards = await getFormationTopicCardsForFormats()
    const cardTitleBySlug = new Map<string, string>()
    for (const c of cards?.ponctuelle ?? []) {
      const href = (c.href || "").trim()
      const m = href.match(/^\/formations-ponctuelles\/([^/?#]+)/i)
      if (!m) continue
      const slug = decodeURIComponent(m[1] || "").trim()
      if (!slug) continue
      cardTitleBySlug.set(slug.toLowerCase(), c.title)
    }

    const formations = await Promise.all(
      list.map(async (row): Promise<CatalogFormation> => {
        const detail = await fetchPonctuelleFormationBySlug(row.slug)
        const modules: CatalogModule[] =
          detail?.modules?.map((m) => ({
            id: m.id,
            title: m.title,
            imageUrl: m.imageUrl,
            description: m.description,
          })) ?? []
        const cardTitle = cardTitleBySlug.get(row.slug.toLowerCase()) || row.title
        return {
          slug: row.slug,
          title: row.title,
          cardTitle,
          modules,
        }
      }),
    )
    return Response.json({ ok: true, formations })
  } catch {
    return Response.json(
      { ok: false, error: "Impossible de charger le catalogue des formations ponctuelles." },
      { status: 500 },
    )
  }
}
