import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(
      new Pool({
        connectionString: (() => {
          const url = process.env.DATABASE_URL
          if (!url) {
            throw new Error(
              "DATABASE_URL manquant: vérifie le fichier .env/.env.local (et surtout qu'il est dans le bon dossier root)."
            )
          }
          return url
        })(),
      }),
    ),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}
