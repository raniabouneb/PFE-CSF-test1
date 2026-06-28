"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

type Props = {
  emails: string[]
  onResult: (decisions: Record<string, boolean>) => void
  onCancel: () => void
}

export default function NewMemberConfirmDialog({ emails, onResult, onCancel }: Props) {
  const [index, setIndex] = useState(0)
  const decisionsRef = useRef<Record<string, boolean>>({})

  const current = emails[index]

  const decide = (value: boolean) => {
    if (!current) return
    decisionsRef.current = { ...decisionsRef.current, [current.trim().toLowerCase()]: value }
    if (index >= emails.length - 1) {
      onResult({ ...decisionsRef.current })
      return
    }
    setIndex((i) => i + 1)
  }

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-member-confirm-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <p className="text-xs text-neutral-500">
          Nouvel apprenant {index + 1} / {emails.length}
        </p>
        <h2 id="new-member-confirm-title" className="mt-1 text-lg font-semibold text-neutral-900">
          Confirmer l’ajout
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          L’e-mail <span className="font-medium text-neutral-900">{current}</span> n’est pas dans la session.
          Créer et ajouter cet apprenant ?
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => decide(false)}
          >
            Ignorer cette ligne
          </Button>
          <Button
            type="button"
            className="w-full bg-blue-700 text-white hover:bg-blue-800 sm:w-auto"
            onClick={() => decide(true)}
          >
            Créer et ajouter
          </Button>
        </div>
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <button
            type="button"
            className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
            onClick={onCancel}
          >
            Annuler l’import
          </button>
        </div>
      </div>
    </div>
  )
}
