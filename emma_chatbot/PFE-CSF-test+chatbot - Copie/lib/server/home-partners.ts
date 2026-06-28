import { prisma } from "@/lib/server/prisma"
import { collaborations, partners } from "@/lib/data/partners"

export async function getHomePartnersData() {
  try {
    const [dbCollaborations, dbPartners] = await Promise.all([
      prisma.collaboration.findMany({
        orderBy: [{ id: "asc" }],
      }),
      prisma.partnerLogo.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
    ])

    return {
      collaborations:
        dbCollaborations.length > 0
          ? dbCollaborations.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              image: item.backgroundImage,
            }))
          : collaborations,
      partners:
        dbPartners.length > 0
          ? dbPartners.map((item) => ({
              id: item.id,
              name: item.name,
              logo: item.logoPath,
            }))
          : partners,
    }
  } catch (error) {
    console.error("Failed to fetch partners data from DB, using fallback:", error)
    return { collaborations, partners }
  }
}
