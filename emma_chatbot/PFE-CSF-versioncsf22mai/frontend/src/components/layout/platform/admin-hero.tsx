"use client"

import Link from "next/link"
import { AdminExportMonthlyButton } from "@/components/platform/admin/dashboard/admin-export-monthly-button"
import {
  ADMIN_SUB_TAB_ITEMS,
  type AdminSubTabId,
} from "@/lib/admin/admin-platform-nav"
import { isAssistantOnly } from "@/lib/auth/roles"

export type { AdminSubTabId }

interface AdminHeroProps {
  activeSubTab: AdminSubTabId
  greetingName?: string | null
  userRole?: string | null
}

export default function AdminHero({ activeSubTab, greetingName, userRole }: AdminHeroProps) {
  const displayName = (greetingName ?? "").trim() || "Admin"
  // Toujours normaliser : sans rôle explicite, ne pas afficher Équipe (évite l’onglet sur les pages sans AdminShell).
  const hideEquipe = userRole == null || userRole === "" ? true : isAssistantOnly(userRole)
  const tabs = ADMIN_SUB_TAB_ITEMS.filter((tab) => !(hideEquipe && tab.id === "equipe"))

  return (
    <header
      data-navbar-hero
      className="relative h-[370px] overflow-hidden bg-gradient-to-b from-[#1e4a72] via-[#1a3d5d] to-[#0D3570] text-white shadow-[0_4px_24px_rgba(26,61,93,0.15)]"
    >
      <div
        className="pointer-events-none absolute inset-0 left-0 right-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 100% 50%, rgba(50, 201, 166, 0.15) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative z-10">
        <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-24 mt-10 lg:px-6">
          <h1
            className="mb-6 text-[1.75rem] font-normal leading-tight tracking-tight text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-merriweather), Georgia, serif" }}
          >
            Espace Administration - {displayName}
          </h1>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <nav
              className="flex w-full max-w-[1000px] flex-wrap gap-6 border-b border-white/25 lg:gap-8"
              aria-label="Administration"
            >
              {tabs.map((tab) => {
                const isActive = activeSubTab === tab.id
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    prefetch
                    className={`relative pb-3 text-sm font-medium transition-colors ${
                      isActive ? "font-semibold text-white" : "text-white/65 hover:text-white/90"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-white" />
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="flex w-full shrink-0 justify-start lg:w-auto lg:justify-end lg:pb-3">
              <AdminExportMonthlyButton variant="hero" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
