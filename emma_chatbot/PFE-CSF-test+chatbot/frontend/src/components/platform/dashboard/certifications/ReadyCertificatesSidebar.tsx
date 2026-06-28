"use client"

import Image from "next/image"
import Link from "next/link"
import { Check, Clock, Download, Eye, Printer } from "lucide-react"
import {
  READY_CERTIFICATES,
  type ReadyCertificateItem,
} from "@/lib/dashboard/certifications-page-data"

interface ReadyCertificatesSidebarProps {
  items?: ReadyCertificateItem[]
}

function handleView(item: ReadyCertificateItem) {
  window.open(`/api/learner/certifications/${item.id}/view`, "_blank")
}

function handlePrint(item: ReadyCertificateItem) {
  const w = window.open(`/api/learner/certifications/${item.id}/view`, "_blank")
  if (w) {
    w.addEventListener("load", () => {
      setTimeout(() => w.print(), 600)
    })
  }
}

function handleDownloadPdf(item: ReadyCertificateItem) {
  window.open(`/api/learner/certifications/${item.id}/pdf`, "_blank")
}

export default function ReadyCertificatesSidebar({
  items = READY_CERTIFICATES,
}: ReadyCertificatesSidebarProps) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/40 bg-white/20 p-5 md:p-6 shadow-[0_8px_32px_rgba(148,163,184,0.18)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold leading-snug text-[#0B264F] md:text-[15px]">
          Certificats validés — prêts à visualiser et imprimer
        </h3>
        <Link href="#" className="shrink-0 text-xs font-semibold text-[#5ab396] hover:underline">
          Tout afficher
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#0B264F]/20 bg-white/30 p-8 text-center text-sm text-[#64748b]">
          Aucun certificat prêt pour le moment.
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-4">
          {items.map((item) => {
            const isPending = item.status === "pending_admin"
            return (
              <li
                key={item.id}
                className="flex gap-4 rounded-xl border border-[#0B264F]/10 bg-white/40 p-4 shadow-sm"
              >
                <div className="relative h-[150px] w-[200px] shrink-0 rounded-xl sm:h-[100px] sm:w-[180px]">
                  <Image
                    src="/images/certif.jpg"
                    alt={`Certificat ${item.title}`}
                    fill
                    className="object-cover object-center"
                    sizes="190px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-[#0B264F]">{item.title}</h4>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200/80">
                          <Clock size={11} strokeWidth={3} className="text-amber-600" aria-hidden />
                          En validation
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200/80">
                          <Check size={11} strokeWidth={3} className="text-emerald-600" aria-hidden />
                          Prêt
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#64748b]">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {isPending ? (
                      <span className="text-xs font-medium italic text-amber-800">
                        Votre document est en cours de vérification
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleView(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B264F]/20 bg-white/60 px-4 py-2 text-sm font-semibold text-[#0B264F] shadow-sm transition hover:bg-white/80"
                        >
                          <Eye size={14} aria-hidden />
                          Visualiser
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrint(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e4a72] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0D3570]"
                        >
                          <Printer size={14} aria-hidden />
                          Imprimer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
