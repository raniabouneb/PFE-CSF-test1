"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { sortPonctuelleModulesByTitle } from "@/lib/sort-ponctuelle-module-list"
import Link from "next/link"
import { Loader2, Search } from "lucide-react"
import {
  fetchPonctuelleModulesSearch,
  ponctuelleModuleCatalogHref,
} from "@/lib/client/fetch-ponctuelle-modules"
import type { PonctuelleModuleListItem } from "@/lib/types/ponctuelle"
import { FORMATIONS_PONCTUELLES_HREF } from "@/lib/formation-routes"
import { cn } from "@/lib/utils"

const DEBOUNCE_MS = 280

type PonctuelleModulesPickerProps = {
  initialModules?: PonctuelleModuleListItem[]
}

export function PonctuelleModulesPicker({ initialModules = [] }: PonctuelleModulesPickerProps) {
  const [query, setQuery] = useState("")
  const [modules, setModules] = useState<PonctuelleModuleListItem[]>(() =>
    sortPonctuelleModulesByTitle(initialModules),
  )
  const sortedModules = useMemo(() => sortPonctuelleModulesByTitle(modules), [modules])
  const [loading, setLoading] = useState(initialModules.length === 0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipInitialFetchRef = useRef(initialModules.length > 0)

  const runSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const rows = await fetchPonctuelleModulesSearch(q)
      setModules(sortPonctuelleModulesByTitle(rows))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!query.trim() && skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void runSearch(query)
    }, query.trim() ? DEBOUNCE_MS : 0)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  return (
    <div className="mt-8">
      <div className="relative mb-4 max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#335FA1]/60"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un module par titre…"
          className="w-full rounded-xl border border-[#1F6CA3]/25 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0D2A61] shadow-sm outline-none transition focus:border-[#335FA1]/50 focus:ring-2 focus:ring-[#335FA1]/15"
          aria-label="Filtrer les modules ponctuels"
        />
      </div>

      <div className="max-h-[min(22rem,50vh)] overflow-y-auto rounded-2xl border border-[#1F6CA3]/15 bg-white/80 backdrop-blur-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#335FA1]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Chargement des modules…
          </div>
        ) : sortedModules.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-600">
            Aucun module ne correspond à votre recherche.
          </p>
        ) : (
          <ul className="divide-y divide-[#1F6CA3]/10">
            {sortedModules.map((mod) => (
              <li key={mod.id}>
                <Link
                  href={ponctuelleModuleCatalogHref(mod.id)}
                  scroll={false}
                  className="block px-4 py-3 text-left font-medium text-[#0D2A61] transition hover:bg-[#335FA1]/5"
                >
                  {mod.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <Link
          href={FORMATIONS_PONCTUELLES_HREF}
          className={cn(
            "text-sm font-semibold text-[#335FA1] underline-offset-2 hover:underline",
          )}
        >
          Voir tout le catalogue des modules
        </Link>
      </div>
    </div>
  )
}
