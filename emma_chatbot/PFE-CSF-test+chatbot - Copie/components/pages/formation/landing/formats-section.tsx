"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { FormationFormatCard } from "@/components/shared/cards/formation-format-card"
import { FormationTopicCard } from "@/components/shared/cards/formation-topic-card"
import { ParcoursForm } from "./parcours-form"
import { ArrowRight } from "lucide-react"
import {
  FORMATION_OPEN_QUERY,
  FORMATIONS_PONCTUELLES_HREF,
  formationReconversionHref,
  isFormationOpenSection,
  type FormationOpenSection,
} from "@/lib/formation-routes"
import Link from "next/link"

type SectionType = FormationOpenSection | null

interface FormationData {
  title: string
  image: string
  href: string
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
    description: "Montez en compétences sur un sujet précis. Accédez à notre portfolio complet de 56 modules experts.",
    formations: [
      { title: "Système Embarqué", image: "/images/iot.png", href: FORMATIONS_PONCTUELLES_HREF },
      { title: "Full-Stack", image: "/images/dev.png", href: FORMATIONS_PONCTUELLES_HREF },
      { title: "Test Logiciel", image: "/images/istqb.png", href: FORMATIONS_PONCTUELLES_HREF },
      { title: "Data, AI, DevOps", image: "/images/ia.webp", href: FORMATIONS_PONCTUELLES_HREF },
      { title: "Langue", image: "/images/langue.webp", href: FORMATIONS_PONCTUELLES_HREF },
      { title: "Soft Skills", image: "/images/soft-skills.jpg", href: FORMATIONS_PONCTUELLES_HREF },
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

export function FormatsSection() {
  const searchParams = useSearchParams()
  const openParam = searchParams.get(FORMATION_OPEN_QUERY)
  const [expandedSection, setExpandedSection] = useState<SectionType>(null)
  /** true seulement après ouverture via ?open=… (home) → déclenche un scroll une fois */
  const scrollAfterOpenRef = useRef(false)

  /* Ouvre la section demandée via ?open=reconversion|ponctuelle|parcours */
  useEffect(() => {
    if (isFormationOpenSection(openParam)) {
      setExpandedSection(openParam)
      scrollAfterOpenRef.current = true
    }
  }, [openParam])

  /* Scroll uniquement après navigation avec ?open=… */
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
    setExpandedSection(expandedSection === section ? null : section)
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

    return (
      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.formations.map((formation, index) => (
            <FormationTopicCard
              key={index}
              title={formation.title}
              image={formation.image}
              href={formation.href}
            />
          ))}
        </div>

        {section === "ponctuelle" && (
          <>
            <div className="text-center mt-6">
              <Link
                href={FORMATIONS_PONCTUELLES_HREF}
                className="text-[#335FA1] text-sm hover:underline font-medium"
              >
                voir plus ...
              </Link>
            </div>
            <div
              className="mt-8 rounded-2xl p-6 text-center bg-white border border-[#335FA1]/20">
             
              <p className="text-sm">
                <span className="font-bold text-[#1e3a5f]">Vous maîtrisez déjà le sujet ?</span>{" "}
                <span className="text-black font-regular">
                  Passez directement le test de certification en ligne sans suivre de formation.
                </span>
              </p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#335FA1]/20 bg-white px-4 py-2 text-sm font-medium text-[#1e3a5f] transition-all hover:bg-white/90 shadow-sm">
                Accéder aux Tests de Certification
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#335FA1]">
                  <ArrowRight className="h-3 w-3 text-white" />
                </span>
              </button>
            </div>
          </>
        )}

        {data.bottomText && (
          <div className="mt-8 text-center text-gray-600 text-sm max-w-3xl mx-auto">
            <p>{data.bottomText}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="py-12 px-4 md:px-8 lg:px-16 bg-[#F7FCFC]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1F6CA3] mb-2">Notre Portfolio de Formations Accompagnées</h2>
        <p className="text-[#335FA1] mb-8">
          Sélectionnez le mode d'apprentissage qui correspond à votre projet professionnel.
        </p>

        <div className="space-y-4">
          <div id="formation-section-reconversion" className="scroll-mt-28">
            <FormationFormatCard
              title={sectionsData.reconversion.title}
              description={sectionsData.reconversion.description}
              onToggle={() => toggleSection("reconversion")}
            />
            {expandedSection === "reconversion" && renderExpandedContent("reconversion")}
          </div>

          <div id="formation-section-ponctuelle" className="scroll-mt-28">
            <FormationFormatCard
              title={sectionsData.ponctuelle.title}
              description={sectionsData.ponctuelle.description}
              onToggle={() => toggleSection("ponctuelle")}
            />
            {expandedSection === "ponctuelle" && renderExpandedContent("ponctuelle")}
          </div>

          <div id="formation-section-parcours" className="scroll-mt-28">
            <FormationFormatCard
              title={sectionsData.parcours.title}
              description={sectionsData.parcours.description}
              onToggle={() => toggleSection("parcours")}
            />
            {expandedSection === "parcours" && renderExpandedContent("parcours")}
          </div>
        </div>
      </div>
    </section>
  )
}

