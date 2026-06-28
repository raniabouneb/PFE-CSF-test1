import Link from "next/link"

/** Page plein écran : même effet que la modale (fond flou). */
export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-slate-900/25 p-4 pt-20 backdrop-blur-md">
      <Link
        href="/"
        className="absolute left-6 top-6 z-10 text-sm font-medium text-slate-700 transition hover:text-slate-900"
      >
        ← Retour à l&apos;accueil
      </Link>
      {children}
    </div>
  )
}
