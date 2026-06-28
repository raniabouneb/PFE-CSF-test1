"use client"

import Image from "next/image"
import Link from "next/link"
import { Award } from "lucide-react"
import { FormationTopicDetailsButton } from "@/components/shared/buttons/formation-topic-details-button"

interface FormationTopicCardProps {
  title: string
  image: string
  href: string
  certified?: boolean
}

/** Carte cliquable (parcours / thème) sur la page Formation — pas la carte bento de l’accueil */
export function FormationTopicCard({ title, image, href, certified = true }: FormationTopicCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-4xl border-2 border-[#1F6CA3]/20 bg-white p-3 text-inherit no-underline transition-shadow "
    >
      <div className="relative h-48 w-full overflow-hidden rounded-2xl">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col px-1 pb-2 pt-4">
        <h4 className="mb-1 text-base font-bold text-[#335FA1]">{title}</h4>
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
