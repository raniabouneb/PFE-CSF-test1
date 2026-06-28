"use client"

import MesFormationsIntroCard from "@/components/platform/dashboard/formations/MesFormationsIntroCard"
import FormationCourseCard from "@/components/platform/dashboard/formations/FormationCourseCard"
import { DASHBOARD_COLUMN_GLASS_CLASS } from "@/components/platform/dashboard/formations-glass-card"
import { useLearnerFormationsPayload } from "@/lib/hooks/learner/use-learner-platform"
import { cn } from "@/lib/utils"

export default function DashboardFormationsClient() {
  const { data: formations } = useLearnerFormationsPayload()
  const courses = formations?.courses ?? []
  const enrollmentCount = courses.length

  return (
    <div className="flex min-h-screen flex-col p-2 md:p-2 lg:p-4">
      <main className={cn(DASHBOARD_COLUMN_GLASS_CLASS, "min-w-0 flex-1")}>
        <MesFormationsIntroCard enrollmentCount={enrollmentCount} />

        {courses.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#64748b]">
            Aucune formation inscrite pour le moment.
          </p>
        ) : (
          <div className="space-y-8">
            {courses.map((course) => (
              <FormationCourseCard
                key={`${course.groupId}-${course.accessId}`}
                {...course}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
