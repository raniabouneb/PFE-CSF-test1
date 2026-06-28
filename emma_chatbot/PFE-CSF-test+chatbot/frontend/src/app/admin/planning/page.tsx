import { AdminGoogleCalendarBoard } from "@/components/platform/admin/planning/admin-google-calendar-board"

export default function AdminPlanningPage() {
  return (
    <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
      <h1 className="sr-only">Planning et séances</h1>
      <AdminGoogleCalendarBoard />
    </main>
  )
}
