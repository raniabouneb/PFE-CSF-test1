import { notFound } from "next/navigation"
import DashboardHero from "@/components/platform/dashboard/dashboard-hero"
import ModuleHeaderCard from "@/components/platform/dashboard/formations/ModuleHeaderCard"
import CourseListItem from "@/components/platform/dashboard/formations/CourseListItem"
import ModuleStatsSidebar from "@/components/platform/dashboard/formations/ModuleStatsSidebar"
import ModuleAttendanceCalendar from "@/components/platform/dashboard/formations/ModuleAttendanceCalendar"
import { getModuleDetail } from "@/lib/dashboard/formations-module-details"

export function generateStaticParams() {
  return [
    { moduleId: "m1" },
    { moduleId: "m2" },
    { moduleId: "m3" },
    { moduleId: "p1" },
    { moduleId: "p2" },
  ]
}

export default async function DashboardModuleDetailPage({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  const data = getModuleDetail(moduleId)
  if (!data) notFound()

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <DashboardHero activeSubTab="formations" />

      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            <ModuleHeaderCard
              badges={data.badges}
              title={data.title}
              levelLabel={data.levelLabel}
              description={data.description}
            />

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
              <h3 className="mb-5 text-lg font-bold text-[#1a2a3a]">
                Cours du module sélectionné
              </h3>
              <div className="space-y-4">
                {data.courses.map((c) => (
                  <CourseListItem key={c.id} course={c} />
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <ModuleStatsSidebar
              coursPercent={data.stats.coursPercent}
              labsPercent={data.stats.labsPercent}
              testsTotal={data.stats.testsTotal}
              testsPassed={data.stats.testsPassed}
              testsFailed={data.stats.testsFailed}
            />
            <ModuleAttendanceCalendar
              monthLabel="Octobre"
              legend={data.attendanceLegend}
              days={data.attendanceDays}
            />
          </aside>
        </div>
      </main>
    </div>
  )
}
