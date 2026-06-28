import { Printer, Clock, Lock } from "lucide-react"
import { KPI_GLASS_CARD_CLASS } from "@/components/platform/dashboard/kpi-glass-card"

interface CertificationsKpiRowProps {
  readyToPrint: number
  pendingValidation: number
  toObtain: number
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType
  label: string
  value: number
  hint: string
}) {
  return (
    <div className={KPI_GLASS_CARD_CLASS}>
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-white/70" aria-hidden />
        <p className="text-[13px] font-semibold uppercase tracking-wider text-white/80">
          {label}
        </p>
      </div>
      <div className="mt-8 flex items-baseline gap-1">
        <span className="font-mono text-5xl font-extrabold text-white">{value}</span>
      </div>
      <p className="mt-2 text-xs text-white/70">{hint}</p>
    </div>
  )
}

export default function CertificationsKpiRow({
  readyToPrint,
  pendingValidation,
  toObtain,
}: CertificationsKpiRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        icon={Printer}
        label="Prêtes à imprimer"
        value={readyToPrint}
        hint="Certificats validés — PDF disponibles"
      />
      <KpiCard
        icon={Clock}
        label="En cours de validation"
        value={pendingValidation}
        hint="Soumises au centre de validation admin"
      />
      <KpiCard
        icon={Lock}
        label="À obtenir"
        value={toObtain}
        hint="Liées à des formations non encore terminées"
      />
    </div>
  )
}
