"use client"

import { useCallback, useMemo, useState } from "react"
import { hashMatchesCardDomId } from "@/lib/card-scroll-target-hash"
import { useCardScrollTargetHashHighlight } from "@/lib/use-card-scroll-target-hash-highlight"
import { Navbar } from "@/components/layout/website/navbar"
import { PonctuellesHero } from "./ponctuelles-hero"
import { ModuleCard, MODULE_CARDS_GRID_CLASS } from "@/components/website/cards/module-card"
import {
  PONCTUELLE_MODULES_SECTION_SUBTITLE,
  PONCTUELLE_MODULES_SECTION_TITLE,
  PONCTUELLE_SEARCH_PLACEHOLDER,
} from "@/lib/constants/ponctuelle-page-copy"
import type { PonctuelleFormationPageData } from "@/lib/types/ponctuelle"
import { ReservationRequestModal } from "@/components/sections/website/reconversion-topic/sections/shell/reservation-request-modal"

export function PonctuelleFormationDetail({
  data,
  initialQuery,
}: {
  data: PonctuelleFormationPageData
  initialQuery?: string
}) {
  const [moduleQuery, setModuleQuery] = useState(initialQuery ?? "")
  const [modalOpen, setModalOpen] = useState(false)
  const [requestKind, setRequestKind] = useState<"reservation" | "catalogue">("reservation")
  const [selectedModuleTitle, setSelectedModuleTitle] = useState("")

  const modules = useMemo(() => data.modules ?? [], [data.modules])

  const visibleModules = useMemo(() => {
    const q = moduleQuery.trim().toLowerCase()
    if (!q) return modules
    return modules.filter((m) => {
      const title = m.title.toLowerCase()
      const desc = (m.description ?? "").toLowerCase()
      const ref = (m.hoverDetail ?? "").toLowerCase()
      return title.includes(q) || desc.includes(q) || ref.includes(q)
    })
  }, [modules, moduleQuery])

  const isTargetVisible = useCallback(
    (hashId: string) =>
      visibleModules.some((m) => hashMatchesCardDomId(hashId, `ponctuelle-module-${m.id}`)),
    [visibleModules],
  )

  useCardScrollTargetHashHighlight({
    targetsReady: modules.length,
    onUnhideTarget: () => setModuleQuery(""),
    isTargetVisible,
  })

  const handleRequestClick = (kind: "reservation" | "catalogue", moduleTitle: string) => {
    setRequestKind(kind)
    setSelectedModuleTitle(moduleTitle)
    setModalOpen(true)
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar variant="hero" />
      <PonctuellesHero
        title={data.hero.title}
        subtitle={data.hero.subtitle}
        backgroundImageUrl={data.hero.backgroundImageUrl}
        searchPlaceholder={PONCTUELLE_SEARCH_PLACEHOLDER}
        searchValue={moduleQuery}
        onSearchChange={setModuleQuery}
        onButtonClick={() => handleRequestClick("reservation", data.hero.title)}
      />

      <section
        id="modules-speciaux"
        className="bg-white px-4 py-10 md:px-8 md:py-20 lg:px-16"
        aria-labelledby="modules-speciaux-heading"
      >
        <div className="mx-auto w-full min-w-0 max-w-7xl">
          <div className="mb-12 text-center md:mb-16">
            <h2
              id="modules-speciaux-heading"
              className="mb-4 text-balance break-words text-2xl font-bold text-[#335FA1] sm:text-3xl md:text-4xl lg:text-5xl"
            >
              {PONCTUELLE_MODULES_SECTION_TITLE}
            </h2>
            <p className="mx-auto max-w-2xl text-balance break-words text-base text-[#335FA1] md:text-lg">
              {PONCTUELLE_MODULES_SECTION_SUBTITLE}
            </p>
          </div>

          {modules.length === 0 ? (
            <p className="text-center text-gray-600 max-w-xl mx-auto text-sm md:text-base">
              Aucun module listé pour cette formation. Vérifiez en base que des lignes existent dans
              <code className="mx-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded">ponctuelle_module</code>
              pour le bon <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">formation_id</code>
              , que le <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">slug</code> de la
              formation correspond à l’URL, et que le serveur FastAPI est accessible (variable
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">BACKEND_URL</code> côté Next).
            </p>
          ) : visibleModules.length === 0 ? (
            <p className="text-center text-gray-600">
              Aucun module ne correspond à votre recherche. Modifiez les termes ou effacez le champ de
              recherche.
            </p>
          ) : (
            <div className={MODULE_CARDS_GRID_CLASS}>
              {visibleModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  domId={`ponctuelle-module-${module.id}`}
                  dataModuleSource="ponctuelle"
                  imageUrl={module.imageUrl}
                  title={module.title}
                  description={module.description}
                  duration={module.duration}
                  practice={module.practice}
                  project={module.project}
                  evaluation={module.evaluation}
                  hoverDetail={module.hoverDetail}
                  certified={module.isCertified ?? true}
                  onReservationClick={() => handleRequestClick("reservation", module.title)}
                  onCatalogClick={() => handleRequestClick("catalogue", module.title)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      <ReservationRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        requestKind={requestKind}
        category="ponctuelle"
        trackName={data.hero.title}
        formationTitle={selectedModuleTitle}
      />
    </main>
  )
}
