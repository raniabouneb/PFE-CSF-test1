import { Suspense } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { PartenairesSection } from "@/components/shared/sections/partenaires-section"
import { LandingHero } from "@/components/pages/formation/landing/landing-hero"
import { FormatsSection } from "@/components/pages/formation/landing/formats-section"

export function FormationPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <LandingHero />
      <Suspense fallback={<div className="min-h-[28rem] bg-gray-50" aria-hidden />}>
        <FormatsSection />
      </Suspense>
      <PartenairesSection />
      <Footer />
    </main>
  )
}
