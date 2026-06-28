"use client"

import { useEffect, useState } from "react"
import { X, Users, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SessionCreateBody } from "@/lib/admin/sessions-api"

type GroupOption = {
  id: string
  nom: string
  type: "ponctuelle" | "reconversion"
  statut: string
}

type ModuleOption = {
  id: string
  titre: string
}

type Props = {
  saving: boolean
  onClose: () => void
  onSubmit: (body: SessionCreateBody) => Promise<void> | void
}

export default function SessionFormModal({ saving, onClose, onSubmit }: Props) {
  const [titre, setTitre] = useState("")
  const [date, setDate] = useState("")
  const [heureDebut, setHeureDebut] = useState("")
  const [dureeMinutes, setDureeMinutes] = useState<number | "">("")
  const [lieu, setLieu] = useState("")
  const [moduleId, setModuleId] = useState("")

  const [modules, setModules] = useState<ModuleOption[]>([])
  const [groupes, setGroupes] = useState<GroupOption[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [groupSearch, setGroupSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/backend/catalogue/modules?format=all&page=1&pageSize=500")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setModules((d.items ?? []).map((m: Record<string, unknown>) => ({ id: String(m.id), titre: String(m.titre ?? m.title ?? "") }))))
      .catch(() => setModules([]))

    fetch("/api/admin/backend/apprenants/groups?format=all&status=active")
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((d) => {
        const list = (d.groups ?? d ?? []) as GroupOption[]
        setGroupes(
          list.map((g: Record<string, unknown>) => ({
            id: String(g.id),
            nom: String((g as Record<string, unknown>).nom ?? (g as Record<string, unknown>).name ?? ""),
            type: ((g as Record<string, unknown>).type ?? (g as Record<string, unknown>).format ?? "ponctuelle") as "ponctuelle" | "reconversion",
            statut: String((g as Record<string, unknown>).statut ?? (g as Record<string, unknown>).status ?? "active"),
          })),
        )
      })
      .catch(() => setGroupes([]))
  }, [])

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const needle = groupSearch.trim().toLowerCase()
  const filteredGroupes = groupes.filter(
    (g) => !needle || g.nom.toLowerCase().includes(needle) || g.type.includes(needle),
  )

  const submit = async () => {
    await onSubmit({
      titre: titre.trim() || (modules.find((m) => m.id === moduleId)?.titre ?? "Séance"),
      module_id: moduleId || null,
      date,
      heure_debut: heureDebut || null,
      duree_minutes: dureeMinutes || null,
      lieu: lieu.trim() || null,
      group_ids: selectedGroupIds,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-[#0f172a]">Planifier une séance</h3>
          <button type="button" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto px-5 py-5">
          {/* Module */}
          <div>
            <label className="text-sm font-medium text-neutral-700">Module</label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
            >
              <option value="">— Sélectionner un module —</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.titre}</option>
              ))}
            </select>
          </div>

          {/* Titre */}
          <div>
            <label className="text-sm font-medium text-neutral-700">Titre de la séance</label>
            <Input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder={modules.find((m) => m.id === moduleId)?.titre ?? "Séance"}
              className="mt-1 border-neutral-200"
            />
          </div>

          {/* Date + Heure + Durée */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-neutral-700">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 border-neutral-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Heure début</label>
              <Input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="mt-1 border-neutral-200" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Durée (min)</label>
              <Input
                type="number"
                value={dureeMinutes}
                onChange={(e) => setDureeMinutes(e.target.value ? Number(e.target.value) : "")}
                placeholder="60"
                className="mt-1 border-neutral-200"
              />
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className="text-sm font-medium text-neutral-700">Lieu</label>
            <Input value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Salle A, en ligne..." className="mt-1 border-neutral-200" />
          </div>

          {/* Groupes */}
          <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700">Groupes participants</label>
              {selectedGroupIds.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  <Users className="h-3 w-3" />
                  {selectedGroupIds.length} groupe{selectedGroupIds.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Rechercher un groupe..."
                className="border-neutral-200 pl-8"
              />
            </div>

            <div className="max-h-[220px] space-y-1.5 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2">
              {filteredGroupes.length === 0 && (
                <p className="py-3 text-center text-sm text-neutral-500">Aucun groupe trouvé</p>
              )}
              {filteredGroupes.map((g) => {
                const checked = selectedGroupIds.includes(g.id)
                return (
                  <label
                    key={g.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                      checked ? "border-blue-200 bg-blue-50/50" : "border-white bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleGroup(g.id)} className="h-4 w-4 rounded" />
                    <span className="flex-1 text-sm font-medium text-neutral-800">{g.nom}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        g.type === "ponctuelle"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {g.type}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-100 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-[#0D3570] hover:bg-[#0a2a5c]"
            onClick={() => void submit()}
            disabled={saving || !date || selectedGroupIds.length === 0}
          >
            {saving ? "Enregistrement..." : "Planifier la séance"}
          </Button>
        </div>
      </div>
    </div>
  )
}
