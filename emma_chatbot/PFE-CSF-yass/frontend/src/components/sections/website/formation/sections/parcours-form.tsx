"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Check, ChevronDown, Sparkles, Wand2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { normalizeImageSrc } from "@/lib/image-src"
import { validateEmailStructure } from "@/lib/validation/email"
import {
  DEFAULT_PHONE_COUNTRY,
  detectPhoneCountry,
  getPhoneCountryOptions,
  validatePhoneStructure,
} from "@/lib/validation/phone"
import type { CountryCode } from "libphonenumber-js/min"

type CatalogModule = {
  id: string
  title: string
  imageUrl: string
  description: string
}
type CatalogFormation = {
  slug: string
  title: string
  cardTitle: string
  modules: CatalogModule[]
}

type BesoinPresetOption = {
  label: string
  variants?: string[]
  customPlaceholder?: string
}

const BESOIN_PRESET_OPTIONS: BesoinPresetOption[] = [
  {
    label: "Ajuster le volume horaire",
    variants: ["+20H", "+10H", "-10H", "-20H", "Autre"],
    customPlaceholder: "Ex: 36H sur mesure",
  },
  {
    label: "Adapter le niveau",
    variants: ["Débutant", "Intermédiaire", "Avancé", "Mixte", "Autre"],
    customPlaceholder: "Ex: Niveau intermédiaire avancé",
  },
  { label: "Ajouter plus de pratique/labs" },
  { label: "Réduire la théorie, aller à l'essentiel" },
  { label: "Inclure un mini-projet métier" },
  {
    label: "Format weekend / soir / intensif",
    variants: ["Weekend", "Soir", "Intensif", "Autre"],
    customPlaceholder: "Ex: 2 soirs/semaine + samedi matin",
  },
  { label: "Formation intra-entreprise" },
  {
    label: "Demande d'un nouveau module",
    variants: ["Autre"],
    customPlaceholder: "Ex: Module sécurité applicative",
  },
]

export function ParcoursForm() {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    entreprise: "",
    besoin: "",
    commentaireLibre: "",
    approche: "nouveau_ou_libre" as "module_existant" | "nouveau_ou_libre",
    ponctuelleFormationSlug: "",
    ponctuelleModuleId: "",
  })
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [presetVariants, setPresetVariants] = useState<Record<string, string>>({})
  const [presetCustomValues, setPresetCustomValues] = useState<Record<string, string>>({})
  const [openVariantFor, setOpenVariantFor] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<CatalogFormation[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY)
  const [loading, setLoading] = useState(false)
  const phoneCountryOptions = getPhoneCountryOptions("fr")

  useEffect(() => {
    let cancelled = false
    fetch("/api/formation/ponctuelle-catalog", { cache: "no-store" })
      .then(async (res) => {
        const payload = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          formations?: CatalogFormation[]
          error?: string
        }
        if (cancelled) return
        if (!res.ok || !payload.ok || !Array.isArray(payload.formations)) {
          toast.error(payload.error || "Catalogue des formations ponctuelles indisponible.")
          setCatalog([])
          return
        }
        setCatalog(payload.formations)
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog([])
          toast.error("Erreur réseau lors du chargement des modules.")
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedFormation = useMemo(
    () => catalog.find((f) => f.slug === formData.ponctuelleFormationSlug) ?? null,
    [catalog, formData.ponctuelleFormationSlug],
  )
  const selectedModule = useMemo(
    () => selectedFormation?.modules.find((m) => m.id === formData.ponctuelleModuleId) ?? null,
    [selectedFormation, formData.ponctuelleModuleId],
  )
  const formationLabel = selectedFormation?.cardTitle || selectedFormation?.title || "Non sélectionnée"
  const moduleLabel = selectedModule?.title || "Aucun module spécifique"

  function getPresetChosenValue(variant?: string, customValue?: string): string {
    if (!variant) return "Sélectionné"
    if (variant === "Autre") {
      const custom = (customValue || "").trim()
      return custom || "Autre"
    }
    return variant
  }

  function togglePreset(label: string) {
    const exists = selectedPresets.includes(label)
    const nextPresets = exists
      ? selectedPresets.filter((x) => x !== label)
      : [...selectedPresets, label]
    setSelectedPresets(nextPresets)
    if (exists) {
      setPresetVariants((prev) => {
        const next = { ...prev }
        delete next[label]
        return next
      })
      setPresetCustomValues((prev) => {
        const next = { ...prev }
        delete next[label]
        return next
      })
    }
  }

  function selectPresetVariant(label: string, variant: string) {
    setPresetVariants((prev) => ({ ...prev, [label]: variant }))
    if (!selectedPresets.includes(label)) {
      setSelectedPresets((prev) => [...prev, label])
    }
    if (variant !== "Autre") setOpenVariantFor(null)
  }

  function onPresetCustomValueChange(label: string, value: string) {
    setPresetCustomValues((prev) => ({ ...prev, [label]: value }))
  }

  function openPresetVariants(label: string) {
    if (!selectedPresets.includes(label)) {
      setSelectedPresets((prev) => [...prev, label])
    }
    setOpenVariantFor((current) => (current === label ? null : label))
  }

  function presetChipValue(label: string): string {
    const variant = presetVariants[label]
    if (!variant) return ""
    if (variant === "Autre") {
      const custom = (presetCustomValues[label] || "").trim()
      return custom || "Autre"
    }
    return variant
  }

  const selectedPresetEntries = useMemo(
    () =>
      selectedPresets.map((label) => ({
        label,
        chosenValue: getPresetChosenValue(presetVariants[label], presetCustomValues[label]),
      })),
    [selectedPresets, presetVariants, presetCustomValues],
  )

  const generatedDetailsCustomisation = useMemo(() => {
    const lines = [`Formation sélectionnée: ${formationLabel}`, `Module ciblé: ${moduleLabel}`]
    if (selectedPresetEntries.length > 0) {
      lines.push(
        "",
        ...selectedPresetEntries.map((entry) =>
          entry.chosenValue === "Sélectionné"
            ? `• ${entry.label}`
            : `• ${entry.label}: ${entry.chosenValue}`,
        ),
      )
    }
    if (formData.commentaireLibre.trim()) {
      lines.push("", `Commentaires libres: ${formData.commentaireLibre.trim()}`)
    }
    return lines.join("\n")
  }, [formationLabel, moduleLabel, selectedPresetEntries, formData.commentaireLibre])

  function validateBeforeSubmit(): string | null {
    const nom = formData.nom.trim()
    const email = formData.email.trim()
    const telephone = formData.telephone.trim()
    const besoin = formData.besoin.trim()
    const commentaire = formData.commentaireLibre.trim()

    if (!nom) return "Nom requis."
    const emailValidationError = validateEmailStructure(email)
    if (emailValidationError) return emailValidationError

    if (formData.approche === "module_existant") {
      const phoneOptionalError = validatePhoneStructure(telephone, {
        required: false,
        defaultCountry: phoneCountry,
      })
      if (phoneOptionalError) return phoneOptionalError
      if (!formData.ponctuelleFormationSlug) return "Veuillez sélectionner une formation."
      if (!formData.ponctuelleModuleId) return "Veuillez sélectionner un module."
      if (selectedPresets.length === 0 && !commentaire) {
        return "Veuillez choisir au moins une option (Étape 3) ou écrire un commentaire."
      }
      return null
    }

    // Besoin libre : tout ce qui est affiché doit être rempli
    const phoneRequiredError = validatePhoneStructure(telephone, {
      required: true,
      defaultCountry: phoneCountry,
    })
    if (phoneRequiredError) return phoneRequiredError
    if (!besoin) return "Décrivez votre besoin global."
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailTouched(true)
    setEmailError(validateEmailStructure(formData.email))
    const err = validateBeforeSubmit()
    if (err) {
      toast.error(err)
      return
    }
    setLoading(true)
    try {
      const formationTitle =
        catalog.find((f) => f.slug === formData.ponctuelleFormationSlug)?.cardTitle ??
        catalog.find((f) => f.slug === formData.ponctuelleFormationSlug)?.title ??
        ""
      const res = await fetch("/api/formation/parcours-demande", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom,
          email: formData.email,
          telephone: formData.telephone,
          entreprise: "",
          besoin:
            formData.approche === "module_existant"
              ? generatedDetailsCustomisation.trim() || "Demande de personnalisation d'un module existant."
              : formData.besoin,
          approche: formData.approche,
          ponctuelleFormationTitle: formData.approche === "module_existant" ? formationTitle : "",
          ponctuelleModuleTitle:
            formData.approche === "module_existant" ? selectedModule?.title || "" : "",
          besoinsPredefinis: selectedPresets,
          detailsCustomisation: generatedDetailsCustomisation,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
      }
      if (!res.ok) {
        toast.error(data.error || "Envoi impossible. Réessayez plus tard.")
        return
      }
      toast.success("Demande envoyée avec succès.")
      setFormData({
        nom: "",
        email: "",
        telephone: "",
        entreprise: "",
        besoin: "",
        commentaireLibre: "",
        approche: "nouveau_ou_libre",
        ponctuelleFormationSlug: "",
        ponctuelleModuleId: "",
      })
      setSelectedPresets([])
      setPresetVariants({})
      setPresetCustomValues({})
      setOpenVariantFor(null)
      setEmailTouched(false)
      setEmailError(null)
      setPhoneTouched(false)
      setPhoneError(null)
      setPhoneCountry(DEFAULT_PHONE_COUNTRY)
    } catch {
      toast.error("Erreur réseau.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_60px_-28px_rgba(15,23,42,0.35)]">
      <div className="relative border-b border-slate-200 bg-gradient-to-br from-[#0B2D46] via-[#14557B] to-[#2A7DB3] px-6 py-7 text-white md:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(900px 240px at 20% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%), radial-gradient(700px 220px at 90% 20%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 55%)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h3 className="mt-3 text-balance text-2xl font-semibold leading-tight md:text-[28px]">
              Décrivez votre besoin, on co‑construit votre programme
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-white/85">
              Réponse rapide, cadrage clair, et une proposition adaptée à vos contraintes (planning, niveau, objectifs).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
          </div>
        </div>
      </div>

      <div className="px-6 py-7 md:px-8">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/40 p-4 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.6)] md:p-6">
            <div className="flex flex-col gap-1">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-700">
                {formData.approche !== "nouveau_ou_libre" ? (
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#eef5ff] text-[#1e4b8e] ring-1 ring-[#1e4b8e]/15">
                    1
                  </span>
                ) : null}
                Approche
              </div>
              <p className="mt-2 text-base font-semibold text-slate-900">Choisissez comment démarrer</p>
              <p className="text-sm text-slate-600">
                Personnalisez un module existant ou exprimez un besoin libre sur‑mesure, puis remplissez les champs ci-dessous pour finaliser votre demande.
              </p>
            </div>

            <div className="mt-5 grid gap-2 md:grid-cols-2">
              <button
                  type="button"
                  onClick={() =>
                    setFormData((s) => ({
                      ...s,
                      approche: "module_existant",
                    }))
                  }
                  className={`group relative rounded-2xl border px-4 py-4 text-left transition ${
                    formData.approche === "module_existant"
                      ? "border-[#1e4b8e]/35 bg-white shadow-[0_18px_55px_-36px_rgba(30,75,142,0.9)] ring-1 ring-[#1e4b8e]/20"
                      : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${
                        formData.approche === "module_existant"
                          ? "bg-[#1e4b8e] text-white"
                          : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                      }`}
                      aria-hidden
                    >
                      <Wand2 className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">
                        Personnaliser un module existant
                      </span>
                      <span className="mt-1 block text-xs text-slate-600">
                        Sélectionnez une formation puis un module, et indiquez les ajustements souhaités (volume, niveau, pratique).
                      </span>
                    </span>
                  </div>
              </button>

              <button
                  type="button"
                  onClick={() =>
                    setFormData((s) => ({
                      ...s,
                      approche: "nouveau_ou_libre",
                      ponctuelleFormationSlug: "",
                      ponctuelleModuleId: "",
                    }))
                  }
                  className={`group relative rounded-2xl border px-4 py-4 text-left transition ${
                    formData.approche === "nouveau_ou_libre"
                      ? "border-[#1e4b8e]/35 bg-white shadow-[0_18px_55px_-36px_rgba(30,75,142,0.9)] ring-1 ring-[#1e4b8e]/20"
                      : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${
                        formData.approche === "nouveau_ou_libre"
                          ? "bg-[#1e4b8e] text-white"
                          : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                      }`}
                      aria-hidden
                    >
                      <Sparkles className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">Nouveau besoin (libre)</span>
                      <span className="mt-1 block text-xs text-slate-600">
                        Exprimez votre besoin global : nous vous proposons un parcours personnalisé.
                      </span>
                    </span>
                  </div>
              </button>
            </div>
          </div>

        {formData.approche === "module_existant" ? (
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/40 p-4 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.6)] md:p-6">
            <div className="flex flex-col gap-1">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-700">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#eef5ff] text-[#1e4b8e] ring-1 ring-[#1e4b8e]/15">
                  2
                </span>
                Sélection
              </div>
              <p className="mt-2 text-base font-semibold text-slate-900">Choisissez une formation et un module</p>
              <p className="text-sm text-slate-600">
                Optionnel : vous pouvez laisser “module” vide pour une demande plus globale.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-900">Formation ponctuelle</label>
                <div className="relative">
                  <select
                    value={formData.ponctuelleFormationSlug}
                    onChange={(e) =>
                      setFormData((s) => ({
                        ...s,
                        ponctuelleFormationSlug: e.target.value,
                        ponctuelleModuleId: "",
                      }))
                    }
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-11 text-sm shadow-sm outline-none transition focus:border-[#1e4b8e]/70 focus:ring-4 focus:ring-[#1e4b8e]/10"
                    disabled={loading || catalogLoading}
                  >
                    <option value="">
                      {catalogLoading ? "Chargement..." : "Sélectionnez une formation"}
                    </option>
                    {catalog.map((f) => (
                      <option key={f.slug} value={f.slug}>
                        {f.cardTitle || f.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                    aria-hidden
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-900">Module ciblé</label>
                {!selectedFormation ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
                    Sélectionnez d&apos;abord une formation ponctuelle pour voir les modules disponibles.
                  </p>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-slate-600">
                      Cliquez sur une carte module pour la sélectionner (ou laissez vide pour une demande globale).
                    </p>
                    <div className="grid max-h-[380px] grid-cols-1 gap-2 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-2 md:grid-cols-2">
                      {selectedFormation.modules.map((m) => {
                        const active = formData.ponctuelleModuleId === m.id
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() =>
                              setFormData((s) => ({
                                ...s,
                                ponctuelleModuleId: s.ponctuelleModuleId === m.id ? "" : m.id,
                              }))
                            }
                            className={`group flex items-start gap-3 rounded-3xl border p-3 text-left shadow-sm transition ${
                              active
                                ? "border-[#1e4b8e]/35 bg-white ring-1 ring-[#1e4b8e]/20"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
                              <Image
                                src={normalizeImageSrc(m.imageUrl)}
                                alt={m.title}
                                fill
                                sizes="96px"
                                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                              />
                            </div>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-slate-900">{m.title}</span>
                              <span className="line-clamp-2 block text-xs text-slate-600">
                                {m.description}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {selectedModule ? (
                      <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-semibold text-[#1e4b8e] ring-1 ring-[#1e4b8e]/15">
                        <Check className="size-3.5" aria-hidden />
                        Module sélectionné : {selectedModule.title}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">Aucun module spécifique sélectionné.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {formData.approche === "module_existant" ? (
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/40 p-4 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.6)] md:p-6">
            <div className="flex flex-col gap-1">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-700">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#eef5ff] text-[#1e4b8e] ring-1 ring-[#1e4b8e]/15">
                  3
                </span>
                Personnalisation
              </div>
              <p className="mt-2 text-base font-semibold text-slate-900">Sélectionnez vos options</p>
              <p className="text-sm text-slate-600">
                Cliquez sur une option. Si elle a des variantes, la liste s’ouvre directement dans le même choix.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-start gap-2">
              {BESOIN_PRESET_OPTIONS.map((option) => {
                const label = option.label
                const active = selectedPresets.includes(label)
                const hasVariants = Array.isArray(option.variants) && option.variants.length > 0
                const selectedVariant = presetVariants[label]
                const customValue = presetCustomValues[label] || ""
                const chipValue = presetChipValue(label)
                return (
                  <div key={label} className="relative">
                    <button
                      type="button"
                      onClick={() => (hasVariants ? openPresetVariants(label) : togglePreset(label))}
                      className={`group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm transition ${
                        active
                          ? "border-[#1e4b8e]/40 bg-[#1e4b8e] text-white"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      aria-expanded={openVariantFor === label}
                    >
                      <span className="max-w-[16rem] truncate">{label}</span>
                      {chipValue ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {chipValue}
                        </span>
                      ) : null}
                      {hasVariants ? (
                        <ChevronDown
                          className={`size-3.5 transition ${
                            active ? "text-white/90" : "text-slate-500"
                          } ${openVariantFor === label ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                      ) : null}
                    </button>

                    {hasVariants && openVariantFor === label ? (
                      <div className="absolute left-0 top-[calc(100%+10px)] z-20 w-[340px] max-w-[90vw] rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.65)]">
                        <div className="flex flex-wrap gap-2">
                          {option.variants?.map((variant) => (
                            <button
                              key={`${label}-${variant}`}
                              type="button"
                              onClick={() => selectPresetVariant(label, variant)}
                              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold shadow-sm transition ${
                                selectedVariant === variant
                                  ? "border-[#1e4b8e]/35 bg-[#eef5ff] text-slate-900"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                        {selectedVariant === "Autre" ? (
                          <div className="mt-3">
                            <Input
                              value={customValue}
                              onChange={(e) => onPresetCustomValueChange(label, e.target.value)}
                              placeholder={option.customPlaceholder || "Précisez votre besoin"}
                              className="h-11 rounded-2xl border-slate-200 text-sm shadow-sm focus:border-[#1e4b8e]/70 focus:ring-4 focus:ring-[#1e4b8e]/10"
                              disabled={loading}
                            />
                          </div>
                        ) : null}
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => togglePreset(label)}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                            disabled={loading}
                          >
                            {active ? "Retirer l’option" : "Annuler"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenVariantFor(null)}
                            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-900">
                Détails des modifications souhaitées (auto-remplis)
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Formation sélectionnée
                  </label>
                  <Input value={formationLabel} readOnly className="h-10 bg-white text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Module ciblé</label>
                  <Input value={moduleLabel} readOnly className="h-10 bg-white text-sm" />
                </div>
              </div>
              <div className="mt-2">
                <div className="space-y-2">
                  {selectedPresetEntries.length > 0 ? (
                    selectedPresetEntries.map((entry) => (
                      <div key={entry.label}>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          {entry.label}
                        </label>
                        <Input value={entry.chosenValue} readOnly className="h-10 bg-white text-sm" />
                      </div>
                    ))
                  ) : (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Besoins sélectionnés
                      </label>
                      <Input
                        value="Aucun besoin sélectionné"
                        readOnly
                        className="h-11 rounded-2xl bg-white text-sm shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Commentaires / remarques libres
                </label>
                <Textarea
                  value={formData.commentaireLibre}
                  onChange={(e) =>
                    setFormData((s) => ({
                      ...s,
                      commentaireLibre: e.target.value,
                    }))
                  }
                  placeholder="Ajoutez ici toute remarque complémentaire..."
                  className="min-h-[100px] rounded-xl border-slate-200 bg-white text-sm shadow-sm focus:border-[#1e4b8e]/70 focus:ring-4 focus:ring-[#1e4b8e]/10"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Nom complet</label>
            <Input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Votre nom"
              className="h-11 rounded-xl border-slate-200 shadow-sm focus:border-[#1e4b8e]/70 focus:ring-4 focus:ring-[#1e4b8e]/10"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => {
                const nextEmail = e.target.value
                setFormData({ ...formData, email: nextEmail })
                if (emailTouched) setEmailError(validateEmailStructure(nextEmail))
              }}
              onBlur={() => {
                setEmailTouched(true)
                setEmailError(validateEmailStructure(formData.email))
              }}
              placeholder="votre@email.com"
              className="h-11 rounded-xl border-slate-200 shadow-sm focus:border-[#1e4b8e]/70 focus:ring-4 focus:ring-[#1e4b8e]/10"
              required
              disabled={loading}
            />
            {emailTouched && emailError ? (
              <p className="mt-1 text-xs text-red-600">{emailError}</p>
            ) : null}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900">Téléphone</label>
          <div className="flex gap-2">
            <select
              aria-label="Pays"
              value={phoneCountry}
              onChange={(e) => setPhoneCountry(e.target.value as CountryCode)}
              className="h-11 w-[45%] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1e4b8e]/70 focus:ring-4 focus:ring-[#1e4b8e]/10"
              disabled={loading}
            >
              {phoneCountryOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Input
              type="tel"
              value={formData.telephone}
              onChange={(e) => {
                const nextPhone = e.target.value
                setFormData({ ...formData, telephone: nextPhone })
                const detected = detectPhoneCountry(nextPhone, phoneCountry)
                if (detected) setPhoneCountry(detected)
                if (phoneTouched) {
                  setPhoneError(
                    validatePhoneStructure(nextPhone, {
                      required: formData.approche === "nouveau_ou_libre",
                      defaultCountry: detected || phoneCountry,
                    }),
                  )
                }
              }}
              onBlur={() => {
                setPhoneTouched(true)
                setPhoneError(
                  validatePhoneStructure(formData.telephone, {
                    required: formData.approche === "nouveau_ou_libre",
                    defaultCountry: phoneCountry,
                  }),
                )
              }}
              placeholder="Téléphone"
              className="h-11 w-[55%] rounded-xl border-slate-200 shadow-sm focus:border-[#1e4b8e]/70 focus:ring-4 focus:ring-[#1e4b8e]/10"
              disabled={loading}
            />
          </div>
          {phoneTouched && phoneError ? (
            <p className="mt-1 text-xs text-red-600">{phoneError}</p>
          ) : null}
        </div>
        {formData.approche === "nouveau_ou_libre" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Décrivez votre besoin global</label>
            <Textarea
              value={formData.besoin}
              onChange={(e) => setFormData({ ...formData, besoin: e.target.value })}
              placeholder="Objectifs, contexte, nombre de participants, contraintes planning, résultats attendus..."
              className="min-h-[140px] rounded-xl border-slate-200 shadow-sm focus:border-[#1e4b8e]/70 focus:ring-4 focus:ring-[#1e4b8e]/10"
              required
              disabled={loading}
            />
          </div>
        ) : null}
          <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-500">
              En envoyant, vous acceptez d’être recontacté(e) au sujet de votre demande.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1e4b8e] px-7 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-22px_rgba(30,75,142,0.95)] transition hover:bg-[#163a6e] disabled:opacity-60 md:w-auto"
            >
              <span>{loading ? "Envoi…" : "Envoyer ma demande"}</span>
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-white/15">
                <Check className="size-4" aria-hidden />
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
