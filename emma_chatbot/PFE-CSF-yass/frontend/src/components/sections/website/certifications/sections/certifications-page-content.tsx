"use client"

import Image from "next/image"
import { Navbar } from "@/components/layout/website/navbar"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  CertificationCard,
  type CertificationIconKey,
} from "@/components/website/cards/certification-p-card"
import type { CertificationsPageData } from "@/lib/server/certifications-page"
import { FilterPillButton } from "@/components/website/buttons/filter-pill-button"
import { SiteSearchCombobox } from "@/components/website/search/site-search-combobox"
import { ReservationRequestModal } from "@/components/sections/website/reconversion-topic/sections/shell/reservation-request-modal"

type Props = {
  data: CertificationsPageData
}

function matchesSearch(
  cert: CertificationsPageData["sections"][number]["cards"][number],
  q: string,
): boolean {
  if (!q.trim()) return true
  const needle = q.trim().toLowerCase()
  const hay = [
    cert.category,
    cert.title,
    cert.subtitle,
    cert.description,
    ...cert.skills,
  ]
    .join(" ")
    .toLowerCase()
  return hay.includes(needle)
}

export function CertificationsPageContent({ data }: Props) {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  /** Multi-choix : si vide => "tous" */
  const [activeFormations, setActiveFormations] = useState<Set<string>>(() => new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedCertificationTitle, setSelectedCertificationTitle] = useState("")

  const { hero, sections, orphanCards } = data

  // Arrivée depuis la barre de recherche : `/certifications?formation=<slug>`
  // => sélectionner automatiquement le filtre correspondant.
  useEffect(() => {
    const wanted = (searchParams.get("formation") ?? "").trim()
    if (!wanted) return
    if (wanted === "all") {
      setActiveFormations(new Set())
      return
    }
    if (sections.some((s) => s.slug === wanted)) {
      setActiveFormations(new Set([wanted]))
    }
  }, [searchParams, sections])

  const allCards = useMemo(
    () => [...sections.flatMap((s) => s.cards), ...orphanCards],
    [sections, orphanCards],
  )

  const baseCards = useMemo(() => {
    if (activeFormations.size === 0) return allCards
    const selected = new Set(activeFormations)
    return sections.flatMap((s) => (selected.has(s.slug) ? s.cards : []))
  }, [activeFormations, allCards, sections])

  const filtered = useMemo(
    () => baseCards.filter((c) => matchesSearch(c, searchQuery)),
    [baseCards, searchQuery],
  )

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : ""
    const m = /^certification-(\d+)$/.exec(raw)
    if (!m?.[1]) return
    const id = m[1]
    const t = window.setTimeout(() => {
      document.getElementById(`certification-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 200)
    return () => window.clearTimeout(t)
  }, [filtered.length, allCards.length])

  const handleReserveClick = (category: string, title: string) => {
    setSelectedCategory(category)
    setSelectedCertificationTitle(title)
    setModalOpen(true)
  }

  return (
    <main className="min-h-[650px] min-w-0 bg-gradient-to-br from-slate-900 via-[#2B5E94] to-slate-800">
      <Navbar variant="hero" />

      <section
        data-navbar-hero
        className="relative flex min-h-[min(640px,92dvh)] min-w-0 items-center overflow-visible px-4 pb-12 pt-28 sm:min-h-[650px] sm:pb-16 sm:pt-32 lg:px-12"
      >
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/certificat.avif"
            alt=""
            fill
            className="h-full w-full object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(3, 45, 62, 0.46)0%, rgba(1, 13, 33, 0.85) 80%",
          }}
        />

        <div className="relative z-10 w-full min-w-0 max-w-3xl">
          <h1 className="mb-6 text-balance break-words text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {hero.title}
            <br />
            <span className="text-[#0A566E]">{hero.subtitle}</span>
          </h1>

          <p className="mb-10 text-base leading-relaxed text-white/80 break-words sm:text-lg md:text-xl">
            {hero.description}
          </p>
          <div className="relative mb-8 w-full max-w-3xl">
            <SiteSearchCombobox
              variant="certifications-hero"
              placeholder={hero.searchPlaceholder}
              ariaLabel="Rechercher une certification"
              query={searchQuery}
              onQueryChange={setSearchQuery}
              containerClassName="max-w-3xl"
            />
          </div>
          
          <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            {hero.stats.map((stat, index) => (
              <div
                key={`${stat.label}-${index}`}
                className="w-full min-w-0 rounded-2xl border-2 border-white/30 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/10 sm:p-6 lg:p-8"
              >
                <div className="mb-2 text-center text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                  {stat.value}
                </div>
                <div className="text-center text-xs font-medium uppercase tracking-widest text-white/70 break-words">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 md:py-20 lg:px-8">
        <div className="mx-auto w-full min-w-0 max-w-7xl">
          <h2 className="mt-12 mb-4 text-balance break-words text-center text-3xl font-bold text-[#0D2A61] sm:mt-16 sm:text-4xl md:text-5xl lg:text-6xl">
            {hero.sectionTitle}
          </h2>
          <p className="mb-4 text-center text-base text-[#0A285E] break-words sm:text-lg md:text-xl">
            {hero.sectionSubtitle}
          </p>

          {/* Filtres : sous “Nos Certifications” (1 ligne, scroll horizontal si besoin) */}
          <div className="sticky top-16 z-30 -mx-4 mb-10 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur sm:top-20 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
            <div className="grid w-full min-w-0 gap-2 py-2 [grid-template-columns:repeat(auto-fit,minmax(128px,1fr))] lg:gap-3">
              <FilterPillButton
                active={activeFormations.size === 0}
                onClick={() => setActiveFormations(new Set())}
                className="w-full"
              >
                Tous
              </FilterPillButton>
              {sections.map((sec) => (
                <FilterPillButton
                  key={sec.slug}
                  active={activeFormations.has(sec.slug)}
                  onClick={() => {
                    setActiveFormations((prev) => {
                      const next = new Set(prev)
                      if (next.has(sec.slug)) next.delete(sec.slug)
                      else next.add(sec.slug)
                      return next
                    })
                  }}
                  className="w-full"
                >
                  {sec.title}
                </FilterPillButton>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-slate-600 text-center py-12">
              {allCards.length === 0
                ? "Aucune certification pour le moment. Ajoutez des lignes dans la table certification_card (catégorie = ponctuelle_slug du filtre correspondant)."
                : "Aucun résultat pour cette recherche ou ce filtre."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((cert) => (
                <div
                  key={cert.id}
                  id={`certification-${cert.id}`}
                  className="scroll-mt-28"
                >
                  <CertificationCard
                    iconKey={cert.iconKey as CertificationIconKey}
                    category={cert.category}
                    title={cert.title}
                    subtitle={cert.subtitle}
                    description={cert.description}
                    skills={cert.skills}
                    imageUrl={cert.imageUrl}
                    isCertified={cert.isCertified}
                    onReserveClick={() => handleReserveClick(cert.category, cert.title)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <ReservationRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        requestKind="reservation"
        category="certification"
        trackName={selectedCategory || "Certification"}
        formationTitle={selectedCertificationTitle}
      />
    </main>
  )
}
