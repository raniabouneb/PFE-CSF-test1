import { FormationsPonctuellesPage } from "@/components/pages/formations-ponctuelles"
import { Footer } from "@/components/layout/footer"
import { PartenairesSection } from "@/components/shared/sections/partenaires-section"

export default async function FormationsPonctuellesRoutePage() {
  return (
    <>
      <FormationsPonctuellesPage />
      <PartenairesSection />
      <Footer />
    </>
  )
}
