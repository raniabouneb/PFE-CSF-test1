"use client"

import { useCallback, useMemo, useState } from "react"
import AdminHero from "@/components/layout/platform/admin-hero"
import GroupsGrid from "@/components/platform/admin/apprenants/GroupsGrid"
import GroupDetailsModal from "@/components/platform/admin/apprenants/GroupDetailsModal"
import StudentProfileModal from "@/components/platform/admin/apprenants/StudentProfileModal"
import ApprenantsKPIs from "@/components/platform/admin/apprenants/ApprenantsKPIs"
import {
  APPRENANT_MOCK_GROUPS,
  filterApprenantGroups,
  type ApprenantsMainFormatFilter,
  type ApprenantsGroupFilters,
} from "@/lib/admin/apprenants-groups-mock"
import type { PonctuelleDomainId, ReconversionParcoursId } from "@/lib/admin/catalogue-mock-data"

export default function ApprenantsPage() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  const [mainFormat, setMainFormat] = useState<ApprenantsMainFormatFilter>("all")
  const [rcParcours, setRcParcours] = useState<"all" | ReconversionParcoursId>("all")
  const [pnDomain, setPnDomain] = useState<"all" | PonctuelleDomainId>("all")

  const filters: ApprenantsGroupFilters = useMemo(
    () => ({ mainFormat, rcParcours, pnDomain }),
    [mainFormat, rcParcours, pnDomain]
  )

  const filteredGroups = useMemo(() => filterApprenantGroups(APPRENANT_MOCK_GROUPS, filters), [filters])

  const filterActive =
    mainFormat !== "all" || rcParcours !== "all" || pnDomain !== "all"

  const setMainFormatAndResetSubs = useCallback((v: ApprenantsMainFormatFilter) => {
    setMainFormat(v)
    setRcParcours("all")
    setPnDomain("all")
  }, [])

  const resetFilters = useCallback(() => {
    setMainFormat("all")
    setRcParcours("all")
    setPnDomain("all")
  }, [])

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <AdminHero activeSubTab="apprenants" />

      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        <div className="space-y-6">
          <ApprenantsKPIs groups={filteredGroups} filterActive={filterActive} />

          <GroupsGrid
            filteredGroups={filteredGroups}
            filters={filters}
            setMainFormatAndResetSubs={setMainFormatAndResetSubs}
            setRcParcours={setRcParcours}
            setPnDomain={setPnDomain}
            resetFilters={resetFilters}
            onGroupSelect={setSelectedGroup}
          />
        </div>
      </main>

      {selectedGroup ? (
        <GroupDetailsModal
          groupId={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onStudentSelect={setSelectedStudent}
        />
      ) : null}

      {selectedStudent ? (
        <StudentProfileModal
          studentId={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      ) : null}
    </div>
  )
}
