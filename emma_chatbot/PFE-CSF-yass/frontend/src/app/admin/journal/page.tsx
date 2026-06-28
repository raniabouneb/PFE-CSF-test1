"use client"

import AdminHero from "@/components/layout/platform/admin-hero"

/** Placeholder : journal d’audit complet — à brancher sur l’API. */
export default function AdminJournalPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <AdminHero activeSubTab="dashboard" />
      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        <h1 className="text-lg font-semibold text-[#0f172a]">Historique des activités</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Vue détaillée du journal — connexion à l&apos;API d&apos;audit à prévoir.
        </p>
      </main>
    </div>
  )
}
