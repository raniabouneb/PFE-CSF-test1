"use client"

import { useState } from "react"
import { X, User, FileText, History, Star, Mail, Phone, MapPin, Calendar, Award, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface StudentProfile {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  dateInscription: string
  formation: string
  groupe: string
  points: number
  attendanceRate: number
  notes: StudentNote[]
  cv?: {
    experience: string[]
    education: string[]
    skills: string[]
  }
  historique: HistoryEntry[]
}

interface StudentNote {
  id: string
  date: string
  author: string
  content: string
  type: "info" | "warning" | "success"
}

interface HistoryEntry {
  id: string
  date: string
  action: string
  details: string
  type: "formation" | "evaluation" | "presence" | "points"
}

interface StudentProfileModalProps {
  studentId: string
  onClose: () => void
}

// Données mockées
const mockProfile: StudentProfile = {
  id: "1",
  name: "Alice Martin",
  email: "alice.martin@email.com",
  phone: "+33 6 12 34 56 78",
  address: "123 Rue de la Formation, 75001 Paris",
  dateInscription: "2024-01-10",
  formation: "Développement Full-Stack",
  groupe: "Groupe A - Full Stack",
  points: 85,
  attendanceRate: 92,
  notes: [
    {
      id: "1",
      date: "2024-01-20",
      author: "Prof. Dupont",
      content: "Excellente participation en cours. Montre un réel intérêt pour les technologies web.",
      type: "success"
    },
    {
      id: "2", 
      date: "2024-01-15",
      author: "Admin CSF",
      content: "Retard de 15 minutes à la session du matin. À surveiller.",
      type: "warning"
    },
    {
      id: "3",
      date: "2024-01-12",
      author: "Prof. Martin",
      content: "Projet rendu avec 2 jours d'avance. Très bon travail d'équipe.",
      type: "success"
    }
  ],
  cv: {
    experience: [
      "Stage développeur web - TechCorp (6 mois)",
      "Assistant marketing digital - StartupXYZ (1 an)",
      "Freelance création sites web (2 ans)"
    ],
    education: [
      "Master Marketing Digital - Université Paris 8 (2022)",
      "Licence Informatique - Université Paris 7 (2020)",
      "Baccalauréat Scientifique - Lycée Voltaire (2018)"
    ],
    skills: [
      "HTML/CSS", "JavaScript", "React", "Node.js", "Python", "SQL", 
      "Git", "Figma", "Adobe Creative Suite", "Marketing Digital"
    ]
  },
  historique: [
    {
      id: "1",
      date: "2024-01-22",
      action: "Évaluation Module 2",
      details: "Note: 16/20 - Très bon niveau technique",
      type: "evaluation"
    },
    {
      id: "2",
      date: "2024-01-20",
      action: "Présence confirmée",
      details: "Session 'Pratique guidée' - 4h",
      type: "presence"
    },
    {
      id: "3",
      date: "2024-01-18",
      action: "Attribution de points",
      details: "+15 points pour participation active",
      type: "points"
    },
    {
      id: "4",
      date: "2024-01-15",
      action: "Début Module 2",
      details: "JavaScript Avancé et Frameworks",
      type: "formation"
    },
    {
      id: "5",
      date: "2024-01-10",
      action: "Inscription confirmée",
      details: "Formation Développement Full-Stack - Groupe A",
      type: "formation"
    }
  ]
}

export default function StudentProfileModal({ studentId, onClose }: StudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profil" | "cv" | "historique" | "notes">("profil")
  const profile = mockProfile // En réalité, fetch basé sur studentId

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getNoteTypeColor = (type: StudentNote["type"]) => {
    switch (type) {
      case "success":
        return "bg-[#4caf50]/15 text-[#2e7d32] border-[#4caf50]/30"
      case "warning":
        return "bg-[#ff9800]/15 text-[#e65100] border-[#ff9800]/30"
      case "info":
        return "bg-[#2196f3]/15 text-[#1565c0] border-[#2196f3]/30"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getHistoryTypeIcon = (type: HistoryEntry["type"]) => {
    switch (type) {
      case "formation":
        return <FileText className="h-4 w-4 text-[#2196f3]" />
      case "evaluation":
        return <Star className="h-4 w-4 text-[#ff9800]" />
      case "presence":
        return <Calendar className="h-4 w-4 text-[#4caf50]" />
      case "points":
        return <Award className="h-4 w-4 text-[#9c27b0]" />
      default:
        return <History className="h-4 w-4 text-[#6b7280]" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb] bg-gradient-to-r from-[#1a3d5d] to-[#2c5282] text-white">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-white/25">
              <AvatarFallback className="bg-[#0d9488]/90 text-white font-semibold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <p className="text-white/80 text-sm">{profile.formation} • {profile.groupe}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-[#e5e7eb] bg-[#f8fafc]">
          <button
            onClick={() => setActiveTab("profil")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "profil"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab("cv")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "cv"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            CV & Compétences
          </button>
          <button
            onClick={() => setActiveTab("historique")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "historique"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Historique
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "notes"
                ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
                : "text-[#6b7280] hover:text-[#1a3d5d]"
            }`}
          >
            Notes ({profile.notes.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "profil" && (
            <div className="space-y-6">
              {/* Informations personnelles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1a2a3a]">Informations Personnelles</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-[#6b7280]" />
                      <span className="text-sm">{profile.email}</span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-[#6b7280]" />
                        <span className="text-sm">{profile.phone}</span>
                      </div>
                    )}
                    {profile.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-[#6b7280]" />
                        <span className="text-sm">{profile.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-[#6b7280]" />
                      <span className="text-sm">
                        Inscrit le {new Date(profile.dateInscription).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1a2a3a]">Statistiques</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border border-[#e5e7eb] rounded-lg">
                      <div className="text-2xl font-bold text-[#008080]">{profile.points}</div>
                      <div className="text-sm text-[#6b7280]">Points collectés</div>
                    </div>
                    <div className="text-center p-4 border border-[#e5e7eb] rounded-lg">
                      <div className="text-2xl font-bold text-[#1a3d5d]">{profile.attendanceRate}%</div>
                      <div className="text-sm text-[#6b7280]">Taux de présence</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progression */}
              <div>
                <h3 className="text-lg font-semibold text-[#1a2a3a] mb-4">Progression dans la Formation</h3>
                <div className="border border-[#e5e7eb] rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#6b7280]">Progression globale</span>
                    <span className="text-sm font-semibold text-[#1a2a3a]">68%</span>
                  </div>
                  <div className="h-2 bg-[#e5e7eb] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#008080] rounded-full transition-all"
                      style={{ width: "68%" }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-[#6b7280]">
                    Module 2/5 en cours • Prochaine évaluation: 24 janvier
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "cv" && profile.cv && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#1a2a3a]">CV & Compétences</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expérience */}
                <div>
                  <h4 className="font-medium text-[#1a2a3a] mb-3">Expérience Professionnelle</h4>
                  <div className="space-y-3">
                    {profile.cv.experience.map((exp, index) => (
                      <div key={index} className="p-3 border border-[#e5e7eb] rounded-lg">
                        <p className="text-sm">{exp}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formation */}
                <div>
                  <h4 className="font-medium text-[#1a2a3a] mb-3">Formation Académique</h4>
                  <div className="space-y-3">
                    {profile.cv.education.map((edu, index) => (
                      <div key={index} className="p-3 border border-[#e5e7eb] rounded-lg">
                        <p className="text-sm">{edu}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compétences */}
              <div>
                <h4 className="font-medium text-[#1a2a3a] mb-3">Compétences</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.cv.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#1a3d5d]/10 text-[#1a3d5d] rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "historique" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#1a2a3a]">Historique des Actions</h3>
              
              <div className="space-y-3">
                {profile.historique.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 p-4 border border-[#e5e7eb] rounded-lg">
                    <div className="mt-0.5">
                      {getHistoryTypeIcon(entry.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-[#1a2a3a]">{entry.action}</h5>
                        <span className="text-xs text-[#6b7280]">
                          {new Date(entry.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-[#6b7280] mt-1">{entry.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1a2a3a]">Notes et Observations</h3>
                <Button size="sm">Ajouter une note</Button>
              </div>
              
              <div className="space-y-4">
                {profile.notes.map((note) => (
                  <div key={note.id} className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getNoteTypeColor(note.type)}`}>
                          {note.type === "success" ? "Positif" : note.type === "warning" ? "Attention" : "Info"}
                        </span>
                        <span className="text-sm font-medium text-[#1a2a3a]">{note.author}</span>
                      </div>
                      <span className="text-xs text-[#6b7280]">
                        {new Date(note.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-[#6b7280]">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-[#e5e7eb] bg-[#f8fafc]">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}