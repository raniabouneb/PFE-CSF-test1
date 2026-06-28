"use client"

import { Filter, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface GroupFiltersProps {
  filters: {
    formation: string
    dateDebut: string
  }
  onFiltersChange: (filters: { formation: string; dateDebut: string }) => void
}

export default function GroupFilters({ filters, onFiltersChange }: GroupFiltersProps) {
  const formations = [
    "Toutes les formations",
    "Développement Full-Stack",
    "Data Analyst - Pack Complet", 
    "Systèmes Embarqués",
    "Management Agile & Scrum",
    "Devenir Testeur",
    "Formation Linguistique"
  ]

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-[#1a3d5d]" />
        <h3 className="text-sm font-semibold text-[#1a3d5d]">Filtres</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtre par formation */}
        <div>
          <label className="block text-sm font-medium text-[#1a2a3a] mb-2">
            Formation
          </label>
          <select
            value={filters.formation}
            onChange={(e) => onFiltersChange({ ...filters, formation: e.target.value })}
            className="w-full h-9 rounded-md border border-[#e5e7eb] bg-white px-3 py-1 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          >
            {formations.map((formation) => (
              <option key={formation} value={formation === "Toutes les formations" ? "" : formation}>
                {formation}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre par date de début */}
        <div>
          <label className="block text-sm font-medium text-[#1a2a3a] mb-2">
            Date de début
          </label>
          <div className="relative">
            <Input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => onFiltersChange({ ...filters, dateDebut: e.target.value })}
              className="pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
          </div>
        </div>

        {/* Bouton reset */}
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => onFiltersChange({ formation: "", dateDebut: "" })}
            className="w-full"
          >
            Réinitialiser
          </Button>
        </div>
      </div>
    </div>
  )
}