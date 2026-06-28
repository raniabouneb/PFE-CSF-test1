import DashboardHero from "@/components/platform/dashboard/dashboard-hero"
import CertificationsSummaryCard from "@/components/platform/dashboard/certifications/CertificationsSummaryCard"
import ReadyCertificatesSidebar from "@/components/platform/dashboard/certifications/ReadyCertificatesSidebar"
import PendingCertificationsTable from "@/components/platform/dashboard/certifications/PendingCertificationsTable"
import LinkedCertificationsGrid from "@/components/platform/dashboard/certifications/LinkedCertificationsGrid"

export default function DashboardCertificationsPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <DashboardHero activeSubTab="certifications" />

      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-4">
          <div className="lg:col-span-8">
            <ReadyCertificatesSidebar />
          </div>
          <div className="lg:col-span-4">
            <CertificationsSummaryCard />
          </div>

          <div className="space-y-8 lg:col-span-12">
            <PendingCertificationsTable />
            <LinkedCertificationsGrid />
          </div>
        </div>
      </main>
    </div>
  )
}
