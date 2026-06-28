"use client"

import Image from "next/image"
import { DemanderDevisButton } from "@/components/website/buttons/demander-devis-button"

interface FormationCardProps {
  title: string
  description: string
  imageUrl: string
  showHover?: boolean
  href?: string
  onDevisClick?: () => void
}

export function FormationCard({
  title,
  description,
  imageUrl,
  showHover = false,
  href,
  onDevisClick,
}: FormationCardProps) {
  return (
    <div className="group relative min-h-[min(20rem,70svh)] w-full min-w-0 overflow-hidden rounded-2xl shadow-lg sm:min-h-[320px]">
      <Image
        src={imageUrl}
        alt={title}
        fill
        className={`h-full w-full object-cover transition-transform duration-500 ${showHover ? "group-hover:scale-105" : ""}`}
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: "linear-gradient(to bottom, rgba(30, 132, 141, 0.3) 0%, rgb(4, 23, 56) 100%)",
        }}
      />
      {showHover && (
        <div className="absolute inset-0 bg-[#1e3a5f]/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <div
        className={`absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30 transition-opacity duration-300 ${showHover ? "group-hover:opacity-0" : ""}`}
      >
        <h3 className="mb-1 text-balance break-words text-base font-bold text-white md:text-[22px]">{title}</h3>
        <p className="text-sm leading-relaxed text-white break-words md:text-[17px]">{description}</p>
      </div>
      {showHover && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="mx-4 w-full max-w-sm min-w-0 rounded-2xl border border-white/30 bg-white/20 p-5 backdrop-blur-md">
            <h3 className="mb-2 text-balance break-words text-lg font-bold text-white drop-shadow-sm sm:text-[22px]">
              {title}
            </h3>
            <p className="mb-4 text-base leading-relaxed text-white/90 drop-shadow-sm break-words sm:text-[17px]">
              {description}
            </p>
            <DemanderDevisButton href={href} onClick={onDevisClick} />
          </div>
        </div>
      )}
    </div>
  )
}