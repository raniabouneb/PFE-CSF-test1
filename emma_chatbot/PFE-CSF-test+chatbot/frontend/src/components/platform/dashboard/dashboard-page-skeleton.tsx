import { RouteLoading } from "@/components/ui/route-loading"

export function DashboardPageSkeleton({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="min-h-[40vh] p-4">
      <RouteLoading label={label} />
    </div>
  )
}
