"use client"

import DashboardHero from "@/components/platform/dashboard/dashboard-hero"
import FormationsCard from "@/components/platform/dashboard/cards/FormationsCard"
import CertificationsCard from "@/components/platform/dashboard/cards/CertificationsCard"
import NotificationsCard from "@/components/platform/dashboard/cards/NotificationsCard"
import ActiveFormationsCard from "@/components/platform/dashboard/cards/ActiveFormationsCard"
import UserProfileCard from "@/components/platform/dashboard/cards/UserProfileCard"
import CalendarCard from "@/components/platform/dashboard/cards/CalendarCard"

export default function DashboardHomePage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <DashboardHero activeSubTab="dashboard" />

      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-4">
          <div className="space-y-6 lg:col-span-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormationsCard />
              <CertificationsCard />
            </div>
            <ActiveFormationsCard />
          </div>

          <div className="lg:col-span-3">
            <NotificationsCard />
          </div>

          <div className="space-y-6 lg:col-span-3">
            <UserProfileCard />
            <CalendarCard />
          </div>
        </div>
      </main>
    </div>
  )
}
