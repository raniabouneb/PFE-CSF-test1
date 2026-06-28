"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function ParcoursForm() {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    entreprise: "",
    besoin: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Form submitted:", formData)
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-[#1e3a5f] mb-2">Décrivez votre besoin</h3>
      <p className="text-gray-600 text-sm mb-6">
        Remplissez ce formulaire et nous vous contacterons pour co-construire votre programme de formation idéal.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1e3a5f] mb-1">Nom complet</label>
            <Input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Votre nom"
              className="rounded-lg border-gray-200 focus:border-[#1e4b8e] focus:ring-[#1e4b8e]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1e3a5f] mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="votre@email.com"
              className="rounded-lg border-gray-200 focus:border-[#1e4b8e] focus:ring-[#1e4b8e]"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1e3a5f] mb-1">Téléphone</label>
            <Input
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="+216 XX XXX XXX"
              className="rounded-lg border-gray-200 focus:border-[#1e4b8e] focus:ring-[#1e4b8e]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1e3a5f] mb-1">Entreprise</label>
            <Input
              type="text"
              value={formData.entreprise}
              onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
              placeholder="Nom de votre entreprise"
              className="rounded-lg border-gray-200 focus:border-[#1e4b8e] focus:ring-[#1e4b8e]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1e3a5f] mb-1">Décrivez votre besoin</label>
          <Textarea
            value={formData.besoin}
            onChange={(e) => setFormData({ ...formData, besoin: e.target.value })}
            placeholder="Décrivez vos objectifs de formation, le nombre de participants, le niveau souhaité..."
            className="rounded-lg border-gray-200 focus:border-[#1e4b8e] focus:ring-[#1e4b8e] min-h-[120px]"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full md:w-auto px-8 py-3 rounded-full bg-[#1e4b8e] text-white font-medium transition-colors hover:bg-[#163a6e]"
        >
          Envoyer ma demande
        </button>
      </form>
    </div>
  )
}

