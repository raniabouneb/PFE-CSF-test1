import AdminShell from "@/components/layout/platform/admin-shell"
import { AdminPlanningBoard } from "@/components/platform/admin/planning/admin-planning-board"

export default async function AdminPlanningPage() {
  return (
    <AdminShell activeSubTab="planning">
      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        <h1 className="sr-only">Planning et séances — automatisation des rappels</h1>
        <AdminPlanningBoard />
      </main>
    </AdminShell>
  )
}
