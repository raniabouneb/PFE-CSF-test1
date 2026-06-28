"use client"

import Link from "next/link"
import { Search } from "lucide-react"
import type { SubTabId } from "@/lib/dashboard/platform-nav"
import { SUB_TAB_ITEMS } from "@/lib/dashboard/platform-nav"

interface DashboardHeroProps {
  activeSubTab: SubTabId
  /** Prénom ou prénom affiché après « Bienvenue ». Défaut : Thomas (aligné pages existantes). */
  greetingName?: string | null
}

/**
 * Bandeau bleu sous la navbar globale (fixe, `variant="hero"` dans `dashboard/layout`).
 * `data-navbar-hero` : même logique que les pages publiques — barre transparente sur ce bloc, puis blanche au scroll.
 */
export default function DashboardHero({ activeSubTab, greetingName }: DashboardHeroProps) {
  const displayName = (greetingName ?? "").trim() || "Thomas"
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
            Bienvenue {displayName}
          </h1>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <nav
              className="flex w-full max-w-[700px] flex-wrap gap-6 border-b border-white/25 lg:gap-8"
              aria-label="Espace personnel"
            >
              {SUB_TAB_ITEMS.map((tab) => {
                const isActive = activeSubTab === tab.id
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
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

            <div className="flex h-[55px] w-full max-w-[550px] shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/15 px-4 py-2.5 backdrop-blur-sm">
              <input
                type="search"
                placeholder="Rechercher une formation"
                className="w-full min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/55 focus:outline-none"
                aria-label="Rechercher une formation"
              />
              <Search size={18} className="shrink-0 text-white/55" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
