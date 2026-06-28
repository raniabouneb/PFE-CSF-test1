"use client"

import { useId, useMemo } from "react"
import {
  ADMIN_DASHBOARD_CARD_CLASS,
  ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS,
  ADMIN_DASHBOARD_CARD_TITLE_CLASS,
} from "@/lib/admin/dashboard-card-styles"
import { INSCRIPTION_FORMAT_SERIES, INSCRIPTION_MONTH_LABELS } from "@/lib/admin/dashboard-mock-data"

/** Large viewBox = courbe plus large une fois mise à l’échelle (max-w-full). */
const W = 920
const H = 375
/** Libellé vertical « Nombre d'inscriptions » + colonne graduations (hors clip pour lisibilité). */
const Y_AXIS_TITLE_SLOT = 26
const TICK_LABEL_W = 42
const PAD_L = Y_AXIS_TITLE_SLOT + TICK_LABEL_W
const PAD_R = 40
const PAD_T = 14
const PAD_B = 40
const Y_AXIS_LABEL_X = Y_AXIS_TITLE_SLOT / 2
/** Position des chiffres Y : fin de colonne, entièrement dans la zone gauche du SVG */
const Y_TICK_LABEL_X = PAD_L - 8

function seriesPoints(values: number[], maxY: number) {
  const n = values.length
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  return values.map((val, i) => {
    const x = PAD_L + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
    const y = PAD_T + innerH - (val / maxY) * innerH
    return { x, y }
  })
}

function smoothLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

function smoothAreaPath(points: { x: number; y: number }[], bottomY: number): string {
  if (points.length === 0) return ""
  const top = smoothLinePath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${top} L ${last.x.toFixed(2)} ${bottomY} L ${first.x.toFixed(2)} ${bottomY} Z`
}

function LegendSwatch({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-1 ring-black/5" style={{ backgroundColor: color }} />
}

type EvolutionData = {
  labels: string[]
  series: typeof INSCRIPTION_FORMAT_SERIES
} | null

export function AdminInscriptionsEvolution({ data }: { data?: EvolutionData }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const gradFillId = `areaGrad-${uid}`
  const chartClipId = `chartClip-${uid}`

  const series = data?.series ?? INSCRIPTION_FORMAT_SERIES
  const monthLabels = data?.labels ?? INSCRIPTION_MONTH_LABELS

  const maxY = useMemo(() => {
    let m = 100
    for (const s of series) {
      for (const v of s.values) m = Math.max(m, v)
    }
    return Math.ceil((m * 1.05) / 100) * 100
  }, [series])

  const bottomY = H - PAD_B
  const reconv = series.find((s) => !s.dashed)
  const fillPoints = reconv ? seriesPoints(reconv.values, maxY) : []
  const fillColor = reconv?.color ?? "#2ea3b8"

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PAD_T + (H - PAD_T - PAD_B) * (1 - t),
    val: Math.round(maxY * t),
  }))

  const plotMidY = PAD_T + (H - PAD_T - PAD_B) / 2

  return (
    <section className={ADMIN_DASHBOARD_CARD_CLASS}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Évolution des Inscriptions</h3>
          <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
            Comparatif par format de formation sur les {monthLabels.length} derniers mois
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-5 sm:justify-end" aria-label="Légende">
          {series.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-2 text-sm font-medium text-[#475569]">
              <LegendSwatch color={s.color} />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <div className="-mx-5 overflow-x-auto pb-1 pt-2 sm:-mx-6">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full max-w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Courbe des inscriptions par mois — Reconversion et Ponctuelle"
        >
          <defs>
            <linearGradient id={gradFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.38" />
              <stop offset="55%" stopColor="#b8dff0" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#f4f7fb" stopOpacity="0" />
            </linearGradient>
            <clipPath id={chartClipId}>
              <rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_B - PAD_T} rx="10" />
            </clipPath>
          </defs>

          {/* Graduations Y : hors clipPath pour ne pas être rognées */}
          <g aria-hidden>
            {yTicks.map(({ y, val }) => (
              <text
                key={val}
                x={Y_TICK_LABEL_X}
                y={y + 4}
                textAnchor="end"
                style={{ fontSize: "12px", fontVariantNumeric: "tabular-nums" }}
                className="fill-[#64748b]"
              >
                {val}
              </text>
            ))}
          </g>

          <g clipPath={`url(#${chartClipId})`}>
            {yTicks.map(({ y }) => (
              <line key={y} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#d0dae6" strokeDasharray="4 8" strokeWidth={1} />
            ))}
            {reconv && fillPoints.length > 0 ? (
              <path d={smoothAreaPath(fillPoints, bottomY)} fill={`url(#${gradFillId})`} stroke="none" />
            ) : null}
            {series.map((s) => {
              const pts = seriesPoints(s.values, maxY)
              return (
                <path
                  key={s.id}
                  d={smoothLinePath(pts)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.dashed ? 2.75 : 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={s.dashed ? "9 8" : undefined}
                />
              )
            })}
          </g>

          {/* Axe X (trait fin sous la zone tracée) */}
          <line
            x1={PAD_L}
            y1={H - PAD_B}
            x2={W - PAD_R}
            y2={H - PAD_B}
            stroke="#cbd5e1"
            strokeWidth={1}
            aria-hidden
          />

          <text
            x={Y_AXIS_LABEL_X}
            y={plotMidY}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(-90 ${Y_AXIS_LABEL_X} ${plotMidY})`}
            className="fill-neutral-500"
            style={{ fontSize: "11px", fontWeight: 600 }}
          >
          </text>

          {monthLabels.map((label, i) => {
            const innerW = W - PAD_L - PAD_R
            const n = monthLabels.length
            const x = PAD_L + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
            return (
              <text key={label} x={x} y={H - 12} textAnchor="middle" className="fill-neutral-500" style={{ fontSize: "11px", fontWeight: 600 }}>
                {label}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
