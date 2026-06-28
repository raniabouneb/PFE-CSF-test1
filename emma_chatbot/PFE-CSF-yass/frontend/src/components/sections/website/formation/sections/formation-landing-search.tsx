"use client"

import { SiteSearchCombobox } from "@/components/website/search/site-search-combobox"

export type FormationLandingSearchVariant = "default" | "hero"

type FormationLandingSearchProps = {
  /** `hero` : champ semi-transparent + flou (fond hero clair). */
  variant?: FormationLandingSearchVariant
}

export function FormationLandingSearch({ variant = "default" }: FormationLandingSearchProps) {
  const v = variant === "hero" ? "certifications-hero" : "formation-default"
  return <SiteSearchCombobox variant={v} placeholder="Rechercher une formation..." />
}
