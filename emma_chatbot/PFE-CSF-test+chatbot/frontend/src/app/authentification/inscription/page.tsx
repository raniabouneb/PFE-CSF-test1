import type { Metadata } from "next"
import { InscriptionPageView } from "@/components/sections/platform/authentification/inscription-page"

export const metadata: Metadata = {
  title: "Inscription",
  description: "Créez un compte.",
}

export default function InscriptionPage() {
  return <InscriptionPageView />
}
