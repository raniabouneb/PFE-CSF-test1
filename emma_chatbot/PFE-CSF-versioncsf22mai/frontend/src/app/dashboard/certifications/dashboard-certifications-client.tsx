"use client"

import CertificationsKpiRow from "@/components/platform/dashboard/certifications/CertificationsKpiRow"
import ReadyCertificatesSidebar from "@/components/platform/dashboard/certifications/ReadyCertificatesSidebar"
import PendingCertificationsTable from "@/components/platform/dashboard/certifications/PendingCertificationsTable"
import { useLearnerCertificationsPayload } from "@/lib/hooks/learner/use-learner-platform"
import { DASHBOARD_COLUMN_GLASS_CLASS } from "@/components/platform/dashboard/formations-glass-card"
import { cn } from "@/lib/utils"

export default function DashboardCertificationsClient() {
  const { data: certifications } = useLearnerCertificationsPayload()

  const readyToPrint = certifications?.summary.readyToPrint ?? 0
  const pendingValidation = certifications?.summary.pendingValidation ?? 0
  const toObtain = certifications?.summary.blocked ?? 0

  return (
    <div className={cn(DASHBOARD_COLUMN_GLASS_CLASS, "mx-auto max-w-[1485px] p-4 pb-16 lg:p-8 lg:pb-20")}>
      <h1 className="text-2xl font-bold tracking-tight text-[#0B264F]">
        Mes Certifications
      </h1>

      <CertificationsKpiRow
        readyToPrint={readyToPrint}
        pendingValidation={pendingValidation}
        toObtain={toObtain}
      />

      <ReadyCertificatesSidebar items={certifications?.readyCertificates ?? []} />

      <PendingCertificationsTable rows={certifications?.pendingRows ?? []} />
    </div>
  )
}
