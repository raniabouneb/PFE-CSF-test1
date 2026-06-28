"use client"

import { useEffect } from "react"

/** Erreur React / rendu sur la route `/certifications` : visible à l’écran + log F12 → Console. */
export default function CertificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[CSF /certifications] Erreur rendu :", error.message, error.digest ?? "", error)
  }, [error])

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-slate-900">
        Impossible d&apos;afficher la page Certifications
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        Une erreur s&apos;est produite côté serveur ou lors du chargement des données. Ouvrez{" "}
        <strong>F12</strong> puis l&apos;onglet <strong>Console</strong> : le détail est loggé sous{" "}
        <code className="rounded bg-slate-100 px-1">[CSF /certifications]</code>.
      </p>
      <pre className="mt-6 max-h-40 overflow-auto rounded-lg bg-slate-100 p-4 text-left text-xs text-slate-800">
        {error.message}
        {error.digest ? `\n.digest: ${error.digest}` : ""}
      </pre>
      <button
        type="button"
        className="mt-6 rounded-full bg-[#335FA1] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2a4f8a]"
        onClick={() => reset()}
      >
        Réessayer
      </button>
    </div>
  )
}
