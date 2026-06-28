import type { Metadata } from "next"
import { ConnexionPageView } from "@/components/sections/platform/authentification/connexion-page"

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte.",
}

export default function ConnexionPage() {
  return <ConnexionPageView />
}
