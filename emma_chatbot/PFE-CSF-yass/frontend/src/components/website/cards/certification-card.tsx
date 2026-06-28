"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { normalizeImageSrc } from "@/lib/image-src"

interface CertificationCardProps {
  /** Classes optionnelles (ex: `md:col-span-3` pour occuper toute une rangée de grille). */
  className?: string
  href?: string
  title: string
  description: string
  highlightedText: string
  suffixText?: string
  buttonText?: string
  buttonVariant?: "details" | "projet"
  onButtonClick?: () => void
  /** Image de fond (optionnelle) pour harmoniser avec les autres cards. */
  imageUrl?: string
  /**
   * Badges « Certification directe » / « Sans formation » — affichés uniquement sur la section Pôle Formation.
   * Désactiver pour Pôle Solution (ou autres contextes).
   */
  showOfferBadges?: boolean
}

const DEFAULT_CERTIF_BG = "/images/hero-formation.png"

export function CertificationCard({
  className,
  href,
  title,
  description,
  highlightedText,
  suffixText = "sans suivre de formation si vous possédez déjà les acquis.",
  buttonText = "Plus de détails",
  imageUrl = DEFAULT_CERTIF_BG,
  showOfferBadges = true,
}: CertificationCardProps) {
  const normalizedImg = normalizeImageSrc(imageUrl) || DEFAULT_CERTIF_BG

  const shellClass = cn(
    "group relative min-h-[10rem] w-full min-w-0 overflow-hidden rounded-2xl shadow-lg sm:min-h-[12.5rem]",
    "md:col-span-2",
    className,
  )

  const content = (
    <>
      <Image
        src={normalizedImg}
        alt=""
        fill
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 66vw"
        priority={false}
      />
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(to bottom, rgba(26, 163, 149, 0.18) 0%, rgba(7, 25, 57, 0.96) 100%)",
        }}
      />
      <div className="absolute inset-0 bg-[#1e3a5f]/40  backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div
        className={cn(
          "absolute rounded-xl border border-white/20 bg-white/15 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-0",
          showOfferBadges
            ? "bottom-4 left-4 right-4 p-4"
            : "inset-x-4 inset-y-4 flex flex-col justify-center gap-3 px-4 py-6 sm:gap-3 sm:px-5 sm:py-7",
        )}
      >
        {showOfferBadges ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur-md">
              Certification directe
            </span>
            <span className="rounded-full bg-[#5ab396]/20 px-3 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-md">
              Sans formation
            </span>
          </div>
        ) : null}
        <h3
          className={cn(
            "text-balance break-words text-base font-bold text-white md:text-[22px]",
            showOfferBadges ? "mb-1" : "mb-0",
          )}
        >
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-white/90 break-words md:text-[17px]">
          {description} <span className="font-semibold text-white">{highlightedText}</span> {suffixText}
        </p>
      </div>

      <div className="absolute inset-0  opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className=" w-full max-w-full h-full max-h-full rounded-2xl border border-white/30 bg-white/20  backdrop-blur-md ">
          <h3 className=" mt-6 mb-2 ml-8 mr-8 text-balance break-words text-lg font-bold text-white drop-shadow-sm sm:text-[22px]">
            {title}
          </h3>
          <p className="mb-2 ml-8 mr-8 text-base leading-relaxed text-white/90 drop-shadow-sm break-words sm:text-[17px]">
            {description} <span className="font-semibold text-white">{highlightedText}</span> {suffixText}
          </p>

          <div className="inline-flex max-w-full ml-8 mr-8 mt-2 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1e3a5f] shadow-sm transition-colors hover:bg-white/95">
            <span className="truncate">{buttonText}</span>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#335FA1]">
              <ArrowRight className="h-3 w-3 text-white" />
            </span>
          </div>
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          shellClass,
          "block no-underline text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2",
        )}
        aria-label={`${title} — ${highlightedText}`}
      >
        {content}
      </Link>
    )
  }

  return <div className={shellClass}>{content}</div>
}

