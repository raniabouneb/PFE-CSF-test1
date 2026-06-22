"use client"

import Image from "next/image"
import { ArrowRight, Award } from "lucide-react"

interface ModuleCardProps {
  imageUrl: string
  title: string
  description: string
  badge?: {
    icon: string
    label: string
  }
  duration: string
  practice: string
  project: string
  evaluation: string
  onCatalogClick?: () => void
}

export function ModuleCard({
  imageUrl,
  title,
  description,
  duration,
  practice,
  project,
  evaluation,
  onCatalogClick,
}: ModuleCardProps) {
  return (
    <div className="group relative w-full cursor-pointer">
      <div className="relative border border-[#335FA1] rounded-4xl bg-white overflow-hidden transition-all duration-300 h-[140px] md:h-[160px]">
        <div className="absolute inset-0 z-0 flex flex-row">
          <div className="relative w-32 md:w-48 lg:w-56 h-full flex-shrink-0">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover rounded-l-2xl"
            />
          </div>

          <div className="flex-1 p-4 md:p-5 flex flex-col justify-center">
            <h3 className="text-base md:text-lg font-bold text-[#335FA1] mb-1.5 leading-tight">
              {title}
            </h3>

            <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
              {description}
            </p>

            <div className="flex items-center gap-1.5 text-[#3842B0]">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium">Certifiée</span>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[1] rounded-4xl bg-[#5A808C]/50 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col rounded-4xl px-4 md:px-6 py-4 md:py-5 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
          <div className="flex-1 flex items-center">
            <div className="w-full flex items-center divide-x divide-white/40">
              <div className="flex-1 text-center px-2 md:px-4">
                <p className="text-white text-xs md:text-sm font-semibold mb-0.5">Durée</p>
                <p className="text-white/90 text-[10px] md:text-xs">{duration}</p>
              </div>

              <div className="flex-1 text-center px-2 md:px-4">
                <p className="text-white text-xs md:text-sm font-semibold mb-0.5">Pratique</p>
                <p className="text-white/90 text-[10px] md:text-xs">{practice}</p>
              </div>

              <div className="flex-[2] text-center px-2 md:px-4">
                <p className="text-white text-xs md:text-sm font-semibold mb-0.5">Projet</p>
                <p className="text-white/90 text-[10px] md:text-xs line-clamp-1">{project}</p>
              </div>

              <div className="flex-1 text-center px-2 md:px-4">
                <p className="text-white text-xs md:text-sm font-semibold mb-0.5">Evaluation</p>
                <p className="text-white/90 text-[10px] md:text-xs">{evaluation}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 md:mt-4">
            <div className="flex items-center gap-1.5 text-white">
              <Award className="w-4 h-4" />
              <span className="text-xs font-medium">Certifiée</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onCatalogClick?.()
              }}
              className="flex items-center gap-2 bg-white text-[#335FA1] px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              Demander le catalogue
              <div className="w-4 h-4 md:w-5 md:h-5 bg-[#335FA1] rounded-full flex items-center justify-center">
                <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
