"use client"

import { useState } from "react"
import { Users, Calendar, Clock, Download, UserPlus, Key, Gift, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface Student {
  id: string
  name: string
  email: string
  avatar?: string
  points: number
  attendanceRate: number
}

interface Session {
  id: string
  title: string
  date: string
  time: string
  type: "passee" | "avenir"
  duration: string
}

interface GroupDetailsPanelProps {
  groupId: string
  onStudentSelect: (studentId: string) => void
}

// Données mockées
const mockStudents: Student[] = [
  { id: "1", name: "Alice Martin", email: "alice.martin@email.com", points: 85, attendanceRate: 92 },
  { id: "2", name: "Bob Dupont", email: "bob.dupont@email.com", points: 72, attendanceRate: 88 },
  { id: "3", name: "Claire Rousseau", email: "claire.rousseau@email.com", points: 95, attendanceRate: 96 },
  { id: "4", name: "David Moreau", email: "david.moreau@email.com", points: 68, attendanceRate: 84 },
  { id: "5", name: "Emma Leroy", email: "emma.leroy@email.com", points: 89, attendanceRate: 90 },
  { id: "6", name: "François Bernard", email: "francois.bernard@email.com", points: 76, attendanceRate: 86 },
]

const mockSessions: Session[] = [
  { id: "1", title: "Introduction aux concepts", date: "2024-01-15", time: "09:00", type: "passee", duration: "3h" },
  { id: "2", title: "Pratique guidée", date: "2024-01-17", time: "14:00", type: "passee", duration: "4h" },
  { id: "3", title: "Projet en équipe", date: "2024-01-22", time: "09:00", type: "passee", duration: "6h" },
  { id: "4", title: "Évaluation intermédiaire", date: "2024-01-24", time: "10:00", type: "avenir", duration: "2h" },
  { id: "5", title: "Module avancé", date: "2024-01-29", time: "09:00", type: "avenir", duration: "5h" },
  { id: "6", title: "Présentation finale", date: "2024-02-05", time: "14:00", type: "avenir", duration: "3h" },
]

// Données de présence mockées (sessionId -> studentId -> présent)
const mockAttendance: Record<string, Record<string, boolean>> = {
  "1": { "1": true, "2": true, "3": true, "4": false, "5": true, "6": true },
  "2": { "1": true, "2": false, "3": true, "4": true, "5": true, "6": false },
  "3": { "1": false, "2": true, "3": true, "4": true, "5": false, "6": true },
}

const groupData: Record<string, { name: string; formation: string; nombreApprenants: number }> = {
  "1": { name: "Groupe A - Full Stack", formation: "Développement Full-Stack", nombreApprenants: 24 },
  "2": { name: "Groupe B - Data Analyst", formation: "Data Analyst - Pack Complet", nombreApprenants: 18 },
  "3": { name: "Groupe C - Embarqué", formation: "Systèmes Embarqués", nombreApprenants: 15 },
  "4": { name: "Groupe D - Agile", formation: "Management Agile & Scrum", nombreApprenants: 12 },
  "5": { name: "Groupe E - Testeur", formation: "Devenir Testeur", nombreApprenants: 20 },
  "6": { name: "Groupe F - Linguistique", formation: "Formation Linguistique", nombreApprenants: 16 },
}

export default function GroupDetailsPanel({ groupId, onStudentSelect }: GroupDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"sessions" | "presences" | "actions">("sessions")
  const [attendance, setAttendance] = useState(mockAttendance)

  const group = groupData[groupId] || groupData["1"]

  const handleAttendanceChange = (sessionId: string, studentId: string, present: boolean) => {
    setAttendance(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [studentId]: present
      }
    }))
  }

  const exportToExcel = () => {
    console.log("Export vers Excel/CSV")
  }

  const createAccount = (studentId: string) => {
    console.log("Créer compte pour:", studentId)
  }

  const grantAccess = (studentId: string) => {
    console.log("Accorder accès à:", studentId)
  }

  const awardPoints = (studentId: string) => {
    console.log("Attribuer points à:", studentId)
  }

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#e5e7eb] bg-gradient-to-r from-[#1a3d5d] to-[#2c5282] text-white">
        <div>
          <h2 className="text-xl font-semibold">{group.name}</h2>
          <p className="text-white/80 text-sm">{group.formation} • {group.nombreApprenants} apprenants</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-[#e5e7eb] bg-[#f8fafc]">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "sessions"
              ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
              : "text-[#6b7280] hover:text-[#1a3d5d]"
          }`}
        >
          Sessions & Présences
        </button>
        <button
          onClick={() => setActiveTab("presences")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "presences"
              ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
              : "text-[#6b7280] hover:text-[#1a3d5d]"
          }`}
        >
          Tableau de Présence
        </button>
        <button
          onClick={() => setActiveTab("actions")}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === "actions"
              ? "text-[#1a3d5d] border-b-2 border-[#1a3d5d] bg-white"
              : "text-[#6b7280] hover:text-[#1a3d5d]"
          }`}
        >
          Actions & Export
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[calc(100vh-400px)]">
        {activeTab === "sessions" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[#1a2a3a]">Sessions de Formation</h3>
            
            {/* Sessions passées */}
            <div>
              <h4 className="text-md font-medium text-[#1a2a3a] mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#6b7280]" />
                Sessions Passées
              </h4>
              <div className="space-y-3">
                {mockSessions.filter(s => s.type === "passee").map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-[#e5e7eb] rounded-lg bg-[#f8fafc]">
                    <div className="flex-1">
                      <h5 className="font-medium text-[#1a2a3a]">{session.title}</h5>
                      <p className="text-sm text-[#6b7280]">
                        {new Date(session.date).toLocaleDateString('fr-FR')} à {session.time} • {session.duration}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-[#4caf50]/15 text-[#2e7d32] rounded-full text-xs font-medium">
                        Terminée
                      </span>
                      <span className="text-sm text-[#6b7280]">
                        {Object.values(attendance[session.id] || {}).filter(Boolean).length}/{mockStudents.length} présents
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sessions à venir */}
            <div>
              <h4 className="text-md font-medium text-[#1a2a3a] mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#6b7280]" />
                Sessions À Venir
              </h4>
              <div className="space-y-3">
                {mockSessions.filter(s => s.type === "avenir").map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-[#e5e7eb] rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-[#1a2a3a]">{session.title}</h5>
                      <p className="text-sm text-[#6b7280]">
                        {new Date(session.date).toLocaleDateString('fr-FR')} à {session.time} • {session.duration}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-[#2563eb]/15 text-[#1e40af] rounded-full text-xs font-medium">
                        Planifiée
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "presences" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[#1a2a3a]">Tableau de Présence</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#e5e7eb] rounded-lg">
                <thead>
                  <tr className="bg-[#f8fafc]">
                    <th className="border border-[#e5e7eb] p-3 text-left font-medium text-[#1a2a3a]">
                      Apprenant
                    </th>
                    {mockSessions.filter(s => s.type === "passee").map((session) => (
                      <th key={session.id} className="border border-[#e5e7eb] p-3 text-center font-medium text-[#1a2a3a] min-w-[120px]">
                        <div className="text-xs">
                          {new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </div>
                        <div className="text-xs text-[#6b7280] truncate">
                          {session.title}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-[#f8fafc]">
                      <td className="border border-[#e5e7eb] p-3">
                        <div>
                          <button
                            onClick={() => onStudentSelect(student.id)}
                            className="font-medium text-[#1a3d5d] hover:text-[#2c5282] hover:underline cursor-pointer text-left"
                          >
                            {student.name}
                          </button>
                          <div className="text-xs text-[#6b7280]">{student.email}</div>
                        </div>
                      </td>
                      {mockSessions.filter(s => s.type === "passee").map((session) => (
                        <td key={session.id} className="border border-[#e5e7eb] p-3 text-center">
                          <Checkbox
                            checked={attendance[session.id]?.[student.id] || false}
                            onCheckedChange={(checked) => 
                              handleAttendanceChange(session.id, student.id, checked as boolean)
                            }
                            className="mx-auto"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "actions" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[#1a2a3a]">Actions & Export</h3>
            
            {/* Export */}
            <div className="border border-[#e5e7eb] rounded-lg p-4">
              <h4 className="font-medium text-[#1a2a3a] mb-3 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export des Données
              </h4>
              <p className="text-sm text-[#6b7280] mb-4">
                Exportez la liste des apprenants et leurs données de présence au format Excel ou CSV.
              </p>
              <Button onClick={exportToExcel} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exporter vers Excel/CSV
              </Button>
            </div>

            {/* Actions par apprenant */}
            <div className="border border-[#e5e7eb] rounded-lg p-4">
              <h4 className="font-medium text-[#1a2a3a] mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Actions par Apprenant
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mockStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-lg">
                    <div className="flex-1">
                      <button
                        onClick={() => onStudentSelect(student.id)}
                        className="font-medium text-[#1a3d5d] hover:text-[#2c5282] hover:underline cursor-pointer text-left"
                      >
                        {student.name}
                      </button>
                      <div className="text-sm text-[#6b7280]">{student.email}</div>
                      <div className="text-xs text-[#6b7280] mt-1">
                        {student.points} points • {student.attendanceRate}% présence
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => createAccount(student.id)}
                        className="flex items-center gap-1"
                      >
                        <UserPlus className="h-3 w-3" />
                        Compte
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => grantAccess(student.id)}
                        className="flex items-center gap-1"
                      >
                        <Key className="h-3 w-3" />
                        Accès
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => awardPoints(student.id)}
                        className="flex items-center gap-1"
                      >
                        <Gift className="h-3 w-3" />
                        Points
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-[#e5e7eb] bg-[#f8fafc]">
        <div className="text-sm text-[#6b7280]">
          Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
        </div>
        <div className="flex gap-3">
          <Button className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Sauvegarder les modifications
          </Button>
        </div>
      </div>
    </div>
  )
}