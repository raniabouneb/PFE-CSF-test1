export function RouteLoading({ label = "Chargement…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-white px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[#104070]/20 border-t-[#104070]"
        aria-hidden
      />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  )
}
