"use client"

import { useState } from "react"
import FormationsCard, { type ModuleProgressBar } from "@/components/platform/dashboard/cards/FormationsCard"
import CertificationsCard from "@/components/platform/dashboard/cards/CertificationsCard"
import PresenceAssiduiteCard from "@/components/platform/dashboard/formations/PresenceAssiduiteCard"

interface DashboardKpiSectionProps {
  count?: number
  moduleBars: ModuleProgressBar[]
  certObtained?: number
  certTotal?: number
}

export default function DashboardKpiSection({
  count = 0,
  moduleBars,
  certObtained = 0,
  certTotal = 0,
}: DashboardKpiSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const safeIndex =
    moduleBars.length > 0 ? Math.min(selectedIndex, moduleBars.length - 1) : 0
  const selectedBar = moduleBars[safeIndex]
  const presenceData = selectedBar?.presenceData

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <FormationsCard
        count={count}
        moduleBars={moduleBars}
        selectedIndex={safeIndex}
        onSelectionChange={setSelectedIndex}
      />
      <PresenceAssiduiteCard
        presentHours={presenceData?.presentHours ?? 0}
        absentHours={presenceData?.absentHours ?? 0}
        attendancePercent={presenceData?.attendancePercent ?? 0}
        formationTitle={selectedBar?.title ?? null}
      />
      <CertificationsCard obtained={certObtained} total={certTotal} />
    </div>
  )
}
