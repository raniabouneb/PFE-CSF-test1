"use client"

import AdminHero from "@/components/layout/platform/admin-hero"
import { AdminDashboardBoard } from "@/components/platform/admin/dashboard/admin-dashboard-board"

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <AdminHero activeSubTab="dashboard" />
      <AdminDashboardBoard />
    </div>
  )
}