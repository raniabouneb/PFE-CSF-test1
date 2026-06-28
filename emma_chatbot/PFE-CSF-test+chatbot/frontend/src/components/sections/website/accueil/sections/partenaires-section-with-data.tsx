import { getHomePartnersData } from "@/lib/server/home-partners"
import { PartenairesSection } from "./partenaires-section"

/** Même source que l’accueil : `GET /api/v1/home/partners-data` (logos BD / Cloudinary). */
export async function PartenairesSectionWithData() {
  const { partners } = await getHomePartnersData()
  return <PartenairesSection partners={partners} />
}
