import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  ),
})

async function main() {
  await prisma.collaboration.deleteMany()
  await prisma.partnerLogo.deleteMany()

  await prisma.partnerLogo.createMany({
    data: [
      { name: "TELNET", logoPath: "/partner-logos/telnet.png", sortOrder: 1 },
      { name: "Sofiatech", logoPath: "/partner-logos/sofiatech.png", sortOrder: 2 },
      { name: "Sofrecom", logoPath: "/partner-logos/sofrecom.png", sortOrder: 3 },
      { name: "FOCUS", logoPath: "/partner-logos/focus.png", sortOrder: 4 },
      { name: "Faurecia", logoPath: "/partner-logos/faurecia.png", sortOrder: 5 },
      { name: "Altran", logoPath: "/partner-logos/altran.png", sortOrder: 6 },
      { name: "FST", logoPath: "/partner-logos/fst.png", sortOrder: 7 },
    ],
  })

  await prisma.collaboration.createMany({
    data: [
      {
        title: "collaboration entre CSF, Capgemini Engineering Tunisia et GIZ Tunisie",
        description:
          "une formation spécialisée en architecture et programmation des microcontroleurs STM32 a été organisée afin de renforcer les compétences des ingénieurs en systèmes embarqués.",
        backgroundImage: "/collaborations/collaboration-1.jpg",
        sortOrder: 1,
      },
      {
        title: "collaboration entre CSF, Capgemini Engineering Tunisia et GIZ Tunisie",
        description:
          "une formation spécialisée en architecture et programmation des microcontroleurs STM32 a été organisée afin de renforcer les compétences des ingénieurs en systèmes embarqués.",
        backgroundImage: "/collaborations/collaboration-1.jpg",
        sortOrder: 2,
      },
      {
        title: "collaboration entre CSF, Capgemini Engineering Tunisia et GIZ Tunisie",
        description:
          "une formation spécialisée en architecture et programmation des microcontroleurs STM32 a été organisée afin de renforcer les compétences des ingénieurs en systèmes embarqués.",
        backgroundImage: "/collaborations/collaboration-1.jpg",
        sortOrder: 3,
      },
    ],
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
