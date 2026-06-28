"use client"

import { Users } from "lucide-react"

interface Group {
  id: string
  name: string
  formation: string
  nombreApprenants: number
  progressionMoyenne: number
  dateDebut: string
  statut: "active" | "terminee" | "suspendue"
}

interface GroupsListProps {
  filters: {
    formation: string
    dateDebut: string
  }
  selectedGroup: string
  onGroupSelect: (groupId: string) => void
}

// Données mockées
const mockGroups: Group[] = [
  {
    id: "1",
    name: "Groupe A - Full Stack",
    formation: "Développement Full-Stack",
    nombreApprenants: 24,
    progressionMoyenne: 68,
    dateDebut: "2024-01-15",
    statut: "active"
  },
  {
    id: "2", 
    name: "Groupe B - Data Analyst",
    formation: "Data Analyst - Pack Complet",
    nombreApprenants: 18,
    progressionMoyenne: 45,
    dateDebut: "2024-02-01",
    statut: "active"
  },
  {
    id: "3",
    name: "Groupe C - Embarqué",
    formation: "Systèmes Embarqués",
    nombreApprenants: 15,
    progressionMoyenne: 82,
    dateDebut: "2023-11-20",
    statut: "active"
  },
  {
    id: "4",
    name: "Groupe D - Agile",
    formation: "Management Agile & Scrum",
    nombreApprenants: 12,
    progressionMoyenne: 95,
    dateDebut: "2023-12-10",
    statut: "terminee"
  },
  {
    id: "5",
    name: "Groupe E - Testeur",
    formation: "Devenir Testeur",
    nombreApprenants: 20,
    progressionMoyenne: 30,
    dateDebut: "2024-03-01",
    statut: "active"
  },
  {
    id: "6",
    name: "Groupe F - Linguistique",
    formation: "Formation Linguistique",
    nombreApprenants: 16,
    progressionMoyenne: 55,
    dateDebut: "2024-01-20",
    statut: "active"
  }
]

export default function GroupsList({ filters, selectedGroup, onGroupSelect }: GroupsListProps) {
  // Filtrage des groupes
  const filteredGroups = mockGroups.filter(group => {
    const matchFormation = !filters.formation || group.formation === filters.formation
    const matchDate = !filters.dateDebut || group.dateDebut >= filters.dateDebut
    return matchFormation && matchDate
  })

  const getStatutBadge = (statut: Group["statut"]) => {
    switch (statut) {
      case "active":
        return "bg-[#4caf50]/15 text-[#2e7d32] border-[#4caf50]/30"
      case "terminee":
        return "bg-[#008080]/15 text-[#006666] border-[#008080]/30"
      case "suspendue":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatutLabel = (statut: Group["statut"]) => {
    switch (statut) {
      case "active":
        return "En cours"
      case "terminee":
        return "Terminée"
      case "suspendue":
        return "Suspendue"
      default:
        return statut
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-[#4caf50]"
    if (progress >= 60) return "bg-[#008080]"
    if (progress >= 40) return "bg-[#ffeb3b]"
    return "bg-[#ff9800]"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-[#1a3d5d]" />
        <h2 className="text-lg font-semibold text-[#1a2a3a]">Groupes ({filteredGroups.length})</h2>
      </div>

      <div className="space-y-3">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            onClick={() => onGroupSelect(group.id)}
            className={`rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
              selectedGroup === group.id
                ? "border-[#1a3d5d] bg-[#1a3d5d]/5 shadow-md"
                : "border-[#e5e7eb] bg-white hover:border-[#1a3d5d]/30"
            }`}
          >
            {/* En-tête de la carte */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-[#1a2a3a] mb-1 text-sm">
                  {group.name}
                </h3>
                <p className="text-xs text-[#6b7280] truncate">{group.formation}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatutBadge(group.statut)}`}>
                {getStatutLabel(group.statut)}
              </span>
            </div>

            {/* Indicateurs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6b7280]">Apprenants</span>
                <span className="text-xs font-semibold text-[#1a2a3a]">{group.nombreApprenants}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6b7280]">Date début</span>
                <span className="text-xs font-semibold text-[#1a2a3a]">
                  {new Date(group.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>

              {/* Barre de progression */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-[#6b7280]">Progression</span>
                  <span className="text-xs font-semibold text-[#1a2a3a]">{group.progressionMoyenne}%</span>
                </div>
                <div className="h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(group.progressionMoyenne)}`}
                    style={{ width: `${group.progressionMoyenne}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-8 w-8 text-[#6b7280] mx-auto mb-3" />
          <h3 className="font-medium text-[#1a2a3a] mb-1">Aucun groupe trouvé</h3>
          <p className="text-sm text-[#6b7280]">Modifiez vos filtres pour voir plus de résultats.</p>
        </div>
      )}
    </div>
  )
}