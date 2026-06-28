"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FormationFormatCard } from "@/components/website/cards/formation-format-card"
import { FormationTopicCard } from "@/components/website/cards/formation-topic-card"
import { ParcoursForm } from "./parcours-form"
import {
  FORMATION_OPEN_QUERY,
  formationPonctuelleDetailHref,
  formationReconversionHref,
  isFormationOpenSection,
  type FormationOpenSection,
} from "@/lib/formation-routes"
import { fetchFormationTopicCardsWithFallback } from "@/lib/client/fetch-formation-topic-cards"

type SectionType = FormationOpenSection | null

export interface FormationData {
  title: string
  image: string
  href: string
}

/** Données issues de `formation_topic_card` (passées depuis la page serveur). */
export type FormationTopicCardsFromDb = {
  reconversion: FormationData[]
  ponctuelle: FormationData[]
}

const sectionsData = {
  reconversion: {
    title: "Reconversion Professionnelle",
    description:
      "Changez de carrière avec nos cursus intensifs. Un accompagnement complet pour maîtriser un nouveau métier de A à Z.",
    formations: [
      {
        title: "CSF-RCP – Développement en Système Embarqué",
        image: "/images/iot.png",
        href: formationReconversionHref.systemeEmbarque,
      },
      {
        title: "CSF-RCP – Développement Full-Stack",
        image: "/images/dev.png",
        href: formationReconversionHref.fullStack,
      },
      {
        title: "CSF-RCP – Académie en Testeur Logiciel",
        image: "/images/istqb.png",
        href: formationReconversionHref.testeurLogiciel,
      },
    ] as FormationData[],
    bottomText:
      "CSF a la parfaite solution pour vous: CSF-RCP® ! On est les premiers en Tunisie a proposer une formation de reconstitution de carrière professionnelle CSF-RCP en plusieurs domaines a forte demande et dont les prescriptives sont vastes a la fois sur le marche Tunisien ainsi que le marche international.",
  },
  ponctuelle: {
    title: "Formation Ponctuelle",
    description:
      "Montez en compétences sur un sujet précis. Accédez à notre portfolio complet de 56 modules experts.",
    formations: [
      {
        title: "Système Embarqué",
        image: "/images/iot.png",
        href: formationPonctuelleDetailHref("systeme-embarque"),
      },
      {
        title: "Full-Stack",
        image: "/images/dev.png",
        href: formationPonctuelleDetailHref("full-stack"),
      },
      {
        title: "Test Logiciel",
        image: "/images/istqb.png",
        href: formationPonctuelleDetailHref("test-logiciel"),
      },
      {
        title: "Data, AI, DevOps",
        image: "/images/ia.webp",
        href: formationPonctuelleDetailHref("Intelligence-artificiel"),
      },
      {
        title: "Langue",
        image: "/images/langue.webp",
        href: formationPonctuelleDetailHref("Langue"),
      },
      {
        title: "Soft Skills",
        image: "/images/soft-skills.jpg",
        href: formationPonctuelleDetailHref("soft-skills"),
      },
    ] as FormationData[],
    bottomText: null as string | null,
  },
  parcours: {
    title: "Parcours Sur-Mesure",
    description:
      "Une solution unique pour vos besoins spécifiques. Co-construisons ensemble votre programme de formation idéal.",
    formations: [] as FormationData[],
    bottomText: null as string | null,
  },
}

interface FormatsSectionProps {
  /** Si défini, remplace les listes statiques pour reconversion / ponctuelle (par section non vide). */
  topicCardsFromDb?: FormationTopicCardsFromDb | null
}

const PONCTUELLE_PAGE_SIZE = 6

export function FormatsSection({ topicCardsFromDb = null }: FormatsSectionProps) {
  const searchParams = useSearchParams()
  const openParam = searchParams.get(FORMATION_OPEN_QUERY)
  const [expandedSection, setExpandedSection] = useState<SectionType>(null)
  /** true seulement après ouverture via ?open=… (home) → déclenche un scroll une fois */
  const scrollAfterOpenRef = useRef(false)

  /**
   * Données API (Supabase via FastAPI). Le SSR peut tomber sur le fallback statique (6 cartes)
   * si le backend était arrêté ; un fetch client recharge la liste réelle.
   */
  const [fetchedTopicCards, setFetchedTopicCards] = useState<FormationTopicCardsFromDb | null>(null)

  const topicCards = useMemo((): FormationTopicCardsFromDb | null => {
    const fromDb = topicCardsFromDb
    if (
      fromDb &&
      ((fromDb.ponctuelle?.length ?? 0) > 0 || (fromDb.reconversion?.length ?? 0) > 0)
    ) {
      return fromDb
    }
    return fetchedTopicCards
  }, [topicCardsFromDb, fetchedTopicCards])

  const [ponctuelleVisibleCount, setPonctuelleVisibleCount] = useState(PONCTUELLE_PAGE_SIZE)

  useEffect(() => {
    let cancelled = false
    fetchFormationTopicCardsWithFallback()
      .then((data) => {
        if (cancelled || !data) return
        setFetchedTopicCards(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Ne pas lier la réinit. du « pack de 6 » à `expandedSection` : à chaque mise à jour d’état
   * (ex. `setTopicCards` après le fetch) la section reste `ponctuelle` mais certains chemins
   * pouvaient laisser le compteur ou la condition « Voir plus » incohérents. On réinitialise
   * uniquement à l’ouverture explicite de l’accordéon (toggle + ?open=).
   */

  useEffect(() => {
    if (!isFormationOpenSection(openParam)) return
    const t = window.setTimeout(() => {
      setExpandedSection(openParam)
      if (openParam === "ponctuelle") {
        setPonctuelleVisibleCount(PONCTUELLE_PAGE_SIZE)
      }
      scrollAfterOpenRef.current = true
    }, 0)
    return () => window.clearTimeout(t)
  }, [openParam])

  useEffect(() => {
    if (!expandedSection || !scrollAfterOpenRef.current) return
    scrollAfterOpenRef.current = false
    const id = `formation-section-${expandedSection}`
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
    return () => window.clearTimeout(t)
  }, [expandedSection])

  const toggleSection = (section: FormationOpenSection) => {
    if (expandedSection === section) {
      setExpandedSection(null)
      return
    }
    if (section === "ponctuelle") {
      setPonctuelleVisibleCount(PONCTUELLE_PAGE_SIZE)
    }
    setExpandedSection(section)
  }

  const renderExpandedContent = (section: FormationOpenSection) => {
    if (!expandedSection) return null

    const data = sectionsData[section]

    if (section === "parcours") {
      return (
        <div className="mt-8">
          <ParcoursForm />
        </div>
      )
    }

    const formations: FormationData[] =
      topicCards?.[section]?.length ? topicCards[section] : data.formations

    const ponctuelleCap =
      section === "ponctuelle"
        ? Number.isFinite(ponctuelleVisibleCount) && ponctuelleVisibleCount > 0
          ? ponctuelleVisibleCount
          : PONCTUELLE_PAGE_SIZE
        : formations.length

    const formationsToShow =
      section === "ponctuelle" ? formations.slice(0, ponctuelleCap) : formations

    const showVoirPlus =
      section === "ponctuelle" &&
      formations.length > PONCTUELLE_PAGE_SIZE &&
      formations.length > ponctuelleCap

    return (
      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formationsToShow.map((formation, index) => (
            <FormationTopicCard
              key={`${section}-${formation.href}-${formation.title}-${index}`}
              title={formation.title}
              image={formation.image}
              href={formation.href}
            />
          ))}
        </div>

        {showVoirPlus && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setPonctuelleVisibleCount((c) => {
                  const base = Number.isFinite(c) && c > 0 ? c : PONCTUELLE_PAGE_SIZE
                  return base + PONCTUELLE_PAGE_SIZE
                })
              }
              className="text-[#335FA1] text-sm font-semibold hover:underline"
            >
              Voir plus
            </button>
          </div>
        )}

        {section === "ponctuelle" && (
          <div className="mt-8 rounded-2xl p-6 text-center ">
            <p className="text-balance break-words text-base sm:text-lg md:text-xl">
              <span className="font-bold text-[#0A566E]">Vous maîtrisez déjà le sujet ?</span>{" "}
              <span className="text-[#1F6CA3] font-regular">
                Passez directement le test de certification en ligne sans suivre de formation.
              </span>
            </p>
            <Link
              href="/certifications"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#335FA1]/20 bg-white px-4 py-2 text-sm font-medium text-[#1e3a5f] transition-all hover:bg-white/90 shadow-sm"
            >
              Accéder aux Tests de Certification
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#335FA1]">
                <ArrowRight className="h-3 w-3 text-white" />
              </span>
            </Link>
          </div>
        )}

        {data.bottomText && (
          <div className="mx-auto mt-8 max-w-3xl text-center text-sm text-balance break-words text-gray-600">
            <p>{data.bottomText}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="bg-white px-4 py-10 md:px-8 md:py-20 lg:px-16">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <h2 className="mt-18 mb-2 px-1 text-center text-balance break-words text-2xl font-bold text-[#0D2A61] sm:text-3xl md:text-4xl">
          Notre Portfolio de Formations Accompagnées
        </h2>
        <p className="mb-12 px-1 text-center text-balance break-words text-base text-[#0A285E] sm:mb-16 sm:text-lg md:text-xl lg:text-2xl">
          Sélectionnez le mode d&apos;apprentissage qui correspond à votre projet professionnel.
        </p>

        <div className="space-y-4">
          <div id="formation-section-reconversion" className="scroll-mt-28">
            <FormationFormatCard
              title={sectionsData.reconversion.title}
              description={sectionsData.reconversion.description}
              onToggle={() => toggleSection("reconversion")}
              expanded={expandedSection === "reconversion"}
            />
            {expandedSection === "reconversion" && renderExpandedContent("reconversion")}
          </div>

          <div id="formation-section-ponctuelle" className="scroll-mt-28">
            <FormationFormatCard
              title={sectionsData.ponctuelle.title}
              description={sectionsData.ponctuelle.description}
              onToggle={() => toggleSection("ponctuelle")}
              expanded={expandedSection === "ponctuelle"}
            />
            {expandedSection === "ponctuelle" && renderExpandedContent("ponctuelle")}
          </div>

          <div id="formation-section-parcours" className="scroll-mt-28">
            <FormationFormatCard
              title={sectionsData.parcours.title}
              description={sectionsData.parcours.description}
              onToggle={() => toggleSection("parcours")}
              expanded={expandedSection === "parcours"}
            />
            {expandedSection === "parcours" && renderExpandedContent("parcours")}
          </div>
        </div>
      </div>
    </section>
  )
}
