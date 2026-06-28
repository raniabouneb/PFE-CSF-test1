"use client"

import Image from "next/image"
import { BarChart3, Cpu, Globe } from "lucide-react"
import { normalizeImageSrc } from "@/lib/image-src"

const ICONS = {
  cpu: Cpu,
  globe: Globe,
  barchart: BarChart3,
} as const

export type CertificationIconKey = keyof typeof ICONS

interface CertificationCardProps {
  iconKey?: CertificationIconKey
  category: string
  title: string
  subtitle: string
  description: string
  /** Visuel module (ex. Cloudinary) */
  imageUrl?: string
  isCertified?: boolean
  /**
   * Sous-titre seul (souvent durée/labs côté module) : masqué par défaut.
   * Les pastilles `skills` s’affichent dès que le tableau n’est pas vide (données `certification_card.skills`).
   */
  showSubtitleAndSkillBadges?: boolean
  onReserveClick?: () => void
}

export function CertificationCard({
  iconKey = "globe",
  category,
  title,
  subtitle,
  description,
  imageUrl,
  isCertified,
  showSubtitleAndSkillBadges = false,
  onReserveClick,
}: CertificationCardProps) {
  const IconComponent = ICONS[iconKey] ?? Globe

  return (
    <div className="h-full min-h-[400px] p-8 rounded-4xl bg-white/75 backdrop-blur-lg border border-[#2B5E94]/35 flex flex-col">
      {imageUrl ? (
        <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 border border-slate-100 bg-slate-50">
          <Image
            src={normalizeImageSrc(imageUrl)}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {isCertified ? (
            <span className="absolute top-3 right-3 rounded-full bg-[#1F6CA3] text-white text-xs font-semibold px-3 py-1 shadow">
              Certifiée
            </span>
          ) : null}
        </div>
      ) : (
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-[#2B5E94]">
            <IconComponent className="w-8 h-8" aria-hidden />
          </div>
          {isCertified ? (
            <span className="absolute left-14 top-0 rounded-full bg-[#1F6CA3] text-white text-xs font-semibold px-2 py-0.5">
              Certifiée
            </span>
          ) : null}
        </div>
      )}

      <p className="text-xs font-semibold text-[#1F6CA3] uppercase tracking-widest mb-2">
        {category}
      </p>

      <h3 className="text-xl font-bold text-[#1F6CA3] line-clamp-2">
        {title}
      </h3>
{/*
      {showSubtitleAndSkillBadges && subtitle.trim() ? (
        <p className="text-lg font-semibold text-[#154866] mb-">{subtitle}</p>
      ) : null}
      */}
      <p
        className="mt-2 text-slate-600 text-sm leading-relaxed min-h-[6rem]"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </p>
{/*
      <div className="mb-6 pb-6 border-b border-slate-200">
         Hauteur réservée pour éviter que la ligne bouge quand on ajoute des skills 
        <div className="h-9 overflow-hidden">
          <div className={skills.length > 0 ? "flex flex-wrap gap-2" : "opacity-0"}>
            
            {(skills.length > 0 ? skills : ["_placeholder"]).map((skill, i) => (
              <span
                key={`${skill}-${i}`}
                className="px-3 py-1 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200"
              >
                {skill === "_placeholder" ? "placeholder" : skill}
              </span>
            ))}
            
          </div>
        </div>
      </div>
*/}
      <div className="mt-auto flex gap-4">
        <button
          type="button"
          onClick={onReserveClick}
          className="flex-1 px-4 py-3 rounded-3xl bg-[#104070] mt-5 text-white font-semibold hover:bg-[#104070]/80 transition-colors"
        >
          Réserver une place
        </button>
      </div>
    </div>
  )
}
