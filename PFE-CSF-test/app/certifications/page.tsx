import { CertificationsPageContent } from "@/app/certifications/certifications-page-content"
import { Footer } from "@/components/layout/footer"
import { PartenairesSection } from "@/components/shared/sections/partenaires-section"

export default async function CertificationsPage() {
  return (
    <>
      <CertificationsPageContent />
      <PartenairesSection />
      <Footer />
    </>
  )
}
