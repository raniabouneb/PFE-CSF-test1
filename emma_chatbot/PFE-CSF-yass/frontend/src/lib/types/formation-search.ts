export type FormationSearchSuggestionKind =
  | "reconversion"
  | "reconversion_module"
  | "ponctuelle"
  | "ponctuelle_module"
  | "certification"
  | "certification_category"

export type FormationSearchSuggestion = {
  id: string
  kind: FormationSearchSuggestionKind
  label: string
  subtitle?: string
  href: string
}

export type FormationSearchResponse = {
  suggestions: FormationSearchSuggestion[]
}
