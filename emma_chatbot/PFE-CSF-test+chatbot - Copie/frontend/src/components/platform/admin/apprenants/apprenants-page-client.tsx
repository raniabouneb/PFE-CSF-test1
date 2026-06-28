"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import SessionsColumn from "@/components/platform/admin/apprenants/SessionsColumn"
import InscriptionsColumn from "@/components/platform/admin/apprenants/InscriptionsColumn"
import SessionManageModal from "@/components/platform/admin/apprenants/SessionManageModal"
import StudentProfileModal from "@/components/platform/admin/apprenants/StudentProfileModal"
import type { ModuleSessionSummary } from "@/lib/admin/apprenants-api"

export function ApprenantsPageClient() {
  const qc = useQueryClient()
  const [selectedSession, setSelectedSession] = useState<ModuleSessionSummary | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  const invalidateLists = () => {
    void qc.invalidateQueries({ queryKey: ["module-sessions"] })
    void qc.invalidateQueries({ queryKey: ["active-enrollments"] })
  }

  return (
    <>
      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SessionsColumn onManage={setSelectedSession} />
          <InscriptionsColumn onStudentSelect={setSelectedStudent} />
        </div>
      </main>

      {selectedSession ? (
        <SessionManageModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      ) : null}
      {selectedStudent ? (
        <StudentProfileModal
          studentId={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onChanged={invalidateLists}
        />
      ) : null}
    </>
  )
}
