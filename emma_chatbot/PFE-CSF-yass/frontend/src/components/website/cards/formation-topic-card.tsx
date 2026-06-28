"use client"

import Image from "next/image"
import Link from "next/link"
import { Award } from "lucide-react"
import { FormationTopicDetailsButton } from "@/components/website/buttons/formation-topic-details-button"
import { normalizeImageSrc } from "@/lib/image-src"

interface FormationTopicCardProps {
  title: string
  image: string
  href: string
  certified?: boolean
}

/** Carte cliquable (parcours / thème) sur la page Formation */
export function FormationTopicCard({ title, image, href, certified = true }: FormationTopicCardProps) {
  return (
    <Link
      href={href}
      className="group flex cursor-pointer flex-col rounded-4xl border border-[#1F6CA3]/20 bg-white/70 p-3 text-inherit no-underline backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[#1F6CA3]/30 hover:bg-white/75 hover:shadow-[0_18px_60px_-34px_rgba(31,108,163,0.55)]"
    >
      <div className="relative h-48 w-full overflow-hidden rounded-2xl">
        <Image
          src={normalizeImageSrc(image)}
          alt={title}
          fill
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(5, 66, 74, 0.37) 0%, rgba(7, 25, 57, 0.39) 50%)",
          }}
        />
      </div>
      <div className="flex flex-1 flex-col px-1 pb-2 pt-4">
        <h4 className="mb-1 text-balance break-words text-base font-bold text-[#335FA1]">{title}</h4>
        {certified && (
          <div className="mb-3 flex items-center gap-1 text-xs text-[#3842B0]">
            <Award className="h-3 w-3" />
            <span>Certifiée</span>
          </div>
        )}
        <FormationTopicDetailsButton />
      </div>
    </Link>
  )
}
