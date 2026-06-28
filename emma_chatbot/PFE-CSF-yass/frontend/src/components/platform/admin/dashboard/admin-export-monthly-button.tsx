"use client"

import { useCallback, useState } from "react"
import { FileDown } from "lucide-react"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import { useAdminViewer } from "@/components/platform/admin/admin-viewer-context"
import {
  CHART_MONTH_LABELS,
  CHART_SERIES,
  KPI_DEFINITIONS_MAIN,
  RECENT_ACTIVITIES,
  TOP_ENROLLED,
  TOP_VISITED,
  monthReportLabel,
} from "@/lib/admin/dashboard-mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Variant = "hero" | "panel"

export function AdminExportMonthlyButton({ variant = "panel" }: { variant?: Variant }) {
  const { isAssistant } = useAdminViewer()
  const [loading, setLoading] = useState(false)

  const exportPdf = useCallback(async () => {
    setLoading(true)
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" })
      const pageW = doc.internal.pageSize.getWidth()
      let y = 18

      doc.setFontSize(16)
      doc.setTextColor(13, 53, 112)
      doc.text("CSF — Rapport de situation mensuelle", 14, y)
      y += 8
      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)
      doc.text(monthReportLabel(), 14, y)
      y += 6
      if (isAssistant) {
        doc.setFontSize(9)
        doc.setTextColor(120, 120, 120)
        doc.text("Document généré depuis un compte assistant — vue restreinte.", 14, y)
        y += 5
      }

      y += 4
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text("Indicateurs", 14, y)
      y += 6
      doc.setFontSize(9)
      for (const k of KPI_DEFINITIONS_MAIN) {
        doc.setTextColor(40, 40, 40)
        doc.text(`${k.label}: ${k.value} (${k.sublabel})`, 16, y)
        y += 5
        if (y > 270) {
          doc.addPage()
          y = 18
        }
      }

      y += 4
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text("Top formations (visites)", 14, y)
      y += 6
      doc.setFontSize(9)
      TOP_VISITED.forEach((t, i) => {
        doc.text(`${i + 1}. ${t.title} — ${t.visits.toLocaleString("fr-FR")} visites`, 16, y)
        y += 5
        if (y > 270) {
          doc.addPage()
          y = 18
        }
      })

      y += 4
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text("Top formations (inscriptions)", 14, y)
      y += 6
      doc.setFontSize(9)
      TOP_ENROLLED.forEach((t, i) => {
        doc.text(`${i + 1}. ${t.title} — ${t.enrollments} inscrits`, 16, y)
        y += 5
        if (y > 270) {
          doc.addPage()
          y = 18
        }
      })

      y += 4
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text("Inscriptions par mois (aperçu chiffré)", 14, y)
      y += 6
      doc.setFontSize(8)
      const header = ["Formation", ...CHART_MONTH_LABELS].join(" | ")
      doc.text(header.substring(0, 120), 14, y)
      y += 4
      for (const s of CHART_SERIES) {
        const row = `${s.name}: ${s.values.join(" — ")}`
        doc.text(row.substring(0, 180), 16, y)
        y += 4
        if (y > 270) {
          doc.addPage()
          y = 18
        }
      }

      y += 4
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text("Activités récentes (extrait)", 14, y)
      y += 6
      doc.setFontSize(9)
      for (const a of RECENT_ACTIVITIES) {
        doc.text(`• [${a.actorDisplay}] ${a.action}`, 16, y)
        y += 4
        if (y > 270) {
          doc.addPage()
          y = 18
        }
      }

      if (isAssistant) {
        doc.setFontSize(36)
        doc.setTextColor(230, 230, 230)
        doc.text("ASSISTANT", pageW / 2, 140, { align: "center", angle: 40 })
        doc.setTextColor(60, 60, 60)
        doc.setFontSize(9)
        doc.text("Mention : document émis depuis un compte assistant.", 14, 285)
      }

      const slug = new Date().toISOString().slice(0, 7)
      doc.save(`rapport-csf-${slug}.pdf`)
      toast.success("Rapport PDF téléchargé.")
    } catch {
      toast.error("Impossible de générer le PDF.")
    } finally {
      setLoading(false)
    }
  }, [isAssistant])

  if (variant === "hero") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "border-white/80 bg-white/15 text-white shadow-sm backdrop-blur-md",
          "hover:bg-white/25 hover:text-white"
        )}
        onClick={() => void exportPdf()}
        disabled={loading}
      >
        <FileDown className="h-4 w-4" aria-hidden />
        {loading ? "…" : "Export PDF"}
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-stretch gap-2 rounded-xl border border-[#1e4a72]/15 bg-gradient-to-r from-[#1e4a72]/5 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-[#0f172a]">Export global</p>
        <p className="text-xs text-neutral-600">
          Rapport PDF récapitulatif du mois (KPI, tops, aperçu graphique, journal).
          {isAssistant ? " Filigrane « Assistant » sur le document." : ""}
        </p>
      </div>
      <Button
        type="button"
        className="shrink-0 bg-[#0D3570] hover:bg-[#0a2a5c]"
        onClick={() => void exportPdf()}
        disabled={loading}
      >
        <FileDown className="h-4 w-4" aria-hidden />
        {loading ? "Génération…" : "Exporter le rapport PDF"}
      </Button>
    </div>
  )
}
