"use client"

import { CheckCircle2, Medal } from "lucide-react"
import Image from "next/image"
import { RegisterButton } from "@/components/pages/reconversion/register-button"
import { CatalogButton } from "@/components/pages/reconversion/catalog-button"

interface Module {
  text: string
  moduleId?: string
}

interface ProgramCardProps {
  type: "optimum" | "silver" | "gold" | "microcontroller" | "processor"
  title: string
  modules: Module[]
  imageUrl: string
  primaryButtonLabel?: string
  secondaryButtonLabel?: string
  onPrimaryClick?: () => void
  onSecondaryClick?: () => void
  onModuleClick?: (moduleId: string) => void
}

export function ProgramCard({
  type,
  title,
  modules,
  imageUrl,
  primaryButtonLabel = "S'inscrire",
  secondaryButtonLabel = "Demander le catalogue",
  onPrimaryClick,
  onSecondaryClick,
  onModuleClick,
}: ProgramCardProps) {
  const isProjectModule = (text: string) => {
    const lowerText = text.toLowerCase()
    return lowerText.includes("projet") || lowerText.includes("stage")
  }

  const typeLabels: Record<string, string> = {
    optimum: "OPTIMUM",
    silver: "SILVER",
    gold: "GOLD",
    microcontroller: "MICROCONTRÔLEUR",
    processor: "PROCESSEUR",
  }

  const typeColors: Record<string, string> = {
    optimum: "text-[#1e3a5f]",
    silver: "text-[#5a5a5a]",
    gold: "text-[#b8860b]",
    microcontroller: "text-[#1e3a5f]",
    processor: "text-[#1e3a5f]",
  }

  const typeBgColors: Record<string, string> = {
    optimum: "bg-[#e0ecf7]",
    silver: "bg-[#f0f0f0]",
    gold: "bg-[#fef5e7]",
    microcontroller: "bg-[#e0ecf7]",
    processor: "bg-[#e0ecf7]",
  }

  const typeLabel = typeLabels[type]

  return (
    <div className="border-2 border-[#b3d9f2] rounded-3xl p-6 md:p-8 bg-white">
      <div className="mb-4">
        <div
          className={`inline-block ${typeBgColors[type]} ${typeColors[type]} text-xs md:text-sm font-bold uppercase tracking-widest py-2 px-3 rounded-full`}
        >
          {typeLabel}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-2xl md:text-3xl font-bold text-[#335FA1] leading-tight">{title}</h3>
      </div>

      <div className="h-px bg-[#d4d4d4] mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        <ul className="space-y-3 md:space-y-4">
          {modules.map((module, index) => {
            const isProject = isProjectModule(module.text)
            const hasModuleId = module.moduleId !== undefined

            return (
              <li
                key={index}
                className={`flex gap-3 items-start ${hasModuleId ? "cursor-pointer group" : ""}`}
                onClick={() => {
                  if (hasModuleId && onModuleClick && module.moduleId) {
                    onModuleClick(module.moduleId)
                  }
                }}
              >
                {isProject ? (
                  <Medal className="w-5 h-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-colors ${
                      hasModuleId
                        ? "text-[#2563eb] group-hover:text-[#1e3a5f]"
                        : "text-[#1e3a5f]"
                    }`}
                  />
                )}

                <span
                  className={`text-sm md:text-base flex-grow transition-colors ${
                    hasModuleId
                      ? "text-[#2563eb] group-hover:text-[#1e3a5f] group-hover:underline"
                      : "text-[#1a1a1a]"
                  }`}
                >
                  {module.text}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="relative h-[250px] md:h-[300px] rounded-2xl overflow-hidden shadow-md">
          <Image src={imageUrl} alt={title} fill className="object-cover" />
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <RegisterButton onClick={onPrimaryClick} variant="primary">
          {primaryButtonLabel}
        </RegisterButton>
        <CatalogButton onClick={onSecondaryClick} variant="primary">
          {secondaryButtonLabel}
        </CatalogButton>
      </div>
    </div>
  )
}
