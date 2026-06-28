"use client"

import { useEffect, useId, useRef, useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { validateEmailStructure } from "@/lib/validation/email"
import {
  DEFAULT_PHONE_COUNTRY,
  detectPhoneCountry,
  getPhoneCountryOptions,
  validatePhoneStructure,
} from "@/lib/validation/phone"
import { Req } from "@/components/sections/website/shared/pole-form-ui"
import { ChevronDown, Paperclip, Send } from "lucide-react"
import type { CountryCode } from "libphonenumber-js/min"

const SECTEUR_OPTIONS = [
  { value: "", label: "Sélectionnez le secteur d'activité" },
  { value: "industrie-automatisme", label: "Industrie & Automatisme" },
  { value: "automobile-transport", label: "Automobile & Transport" },
  { value: "sante-medtech", label: "Santé & MedTech" },
  { value: "energie-smart-city", label: "Énergie & Smart City" },
  { value: "logistique-retail", label: "Logistique & Retail" },
  { value: "autre", label: "Autre" },
]

const TYPE_CONSEIL_OPTIONS = [
  { value: "", label: "Sélectionnez le type de conseil" },
  { value: "audit-technique", label: "Audit Technique" },
  { value: "architecture-iot-embarque", label: "Architecture IoT & Embarqué" },
  { value: "strategie-test-qa", label: "Stratégie de Test & QA" },
  { value: "developpement-full-stack", label: "Développement Full-Stack" },
  { value: "cybersecurite-industrielle", label: "Cybersécurité Industrielle" },
  { value: "prototypage-rapide-rd", label: "Prototypage Rapide (R&D)" },
  { value: "autre", label: "Autre" },
]

const TAILLE_EQUIPE_OPTIONS = [
  { value: "", label: "Sélectionnez la taille de l'équipe" },
  { value: "1-5", label: "1 à 5 personnes" },
  { value: "6-15", label: "6 à 15 personnes" },
  { value: "16-50", label: "16 à 50 personnes" },
  { value: "51-200", label: "51 à 200 personnes" },
  { value: "200+", label: "Plus de 200 personnes" },
]

const DELAI_OPTIONS = [
  { value: "", label: "Sélectionnez le délai souhaité" },
  { value: "urgent", label: "Urgent (< 1 mois)" },
  { value: "1-3m", label: "1 à 3 mois" },
  { value: "3-6m", label: "3 à 6 mois" },
  { value: "6m+", label: "6 mois et plus" },
  { value: "undef", label: "Non défini pour l'instant" },
]

const leftInputCls =
  "h-11 rounded-lg border border-white/30 bg-white/30 text-white placeholder:text-[#0f3555] shadow-sm " +
  "focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/30 transition"

function FormSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative overflow-visible rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:p-6", className)}>
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white/85">{title}</h2>
        <div className="mt-2 h-px w-full bg-white/25" />
      </div>
      {children}
    </div>
  )
}

function LeftSelect({
  id,
  value,
  onChange,
  options,
  selectedDisplayLabel,
  searchable,
  required,
  disabled,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  selectedDisplayLabel?: string
  searchable?: boolean
  required?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const defaultDisplayLabel = selected?.label ?? options[0]?.label ?? "Choisir…"
  const displayLabel = selectedDisplayLabel ?? defaultDisplayLabel
  const selectableOptions = required ? options.filter((o) => o.value !== "") : options
  const normalizedQuery = query.trim().toLowerCase()
  const shownOptions =
    searchable && normalizedQuery
      ? selectableOptions.filter((o) => o.label.toLowerCase().includes(normalizedQuery))
      : selectableOptions

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = wrapRef.current
      if (!el || !(e.target instanceof Node)) return
      if (!el.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [])

  const activeIndex = Math.max(0, selectableOptions.findIndex((o) => o.value === value))

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen((prev) => !prev)
      return
    }
    if (e.key === "Escape") {
      setOpen(false)
      return
    }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && selectableOptions.length > 0) {
      e.preventDefault()
      const step = e.key === "ArrowDown" ? 1 : -1
      const next = selectableOptions[(activeIndex + step + selectableOptions.length) % selectableOptions.length]
      if (next) onChange(next.value)
      setOpen(true)
    }
  }

  return (
    <div ref={wrapRef} className={cn("relative", open && "z-[400]")}>
      <input
        tabIndex={-1}
        aria-hidden
        required={required}
        value={value}
        readOnly
        className="sr-only"
      />
      {searchable ? (
        <input
          id={id}
          type="text"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          value={open ? query : displayLabel}
          onFocus={() => {
            setOpen(true)
            setQuery("")
          }}
          onChange={(e) => {
            setOpen(true)
            setQuery(e.target.value)
          }}
          onKeyDown={onTriggerKeyDown as unknown as React.KeyboardEventHandler<HTMLInputElement>}
          className="h-11 w-full rounded-lg border border-white/30 bg-white/30 px-4 pr-10 text-left text-sm text-white shadow-sm outline-none transition focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={displayLabel}
          autoComplete="off"
        />
      ) : (
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={onTriggerKeyDown}
          className="h-11 w-full rounded-lg border border-white/30 bg-white/30 px-4 pr-10 text-left text-sm shadow-sm outline-none transition focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={cn("block truncate", value ? "text-white" : "text-[#0f3555]/70")}>
            {displayLabel}
          </span>
        </button>
      )}
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#093880] transition-transform",
          open && "rotate-180",
        )}
        aria-hidden
      />
      {open && !disabled ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[500] max-h-64 overflow-y-auto rounded-2xl border border-white/30 bg-white/95 py-2 text-[#0f3555] shadow-lg backdrop-blur-md [scrollbar-color:#093880_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#093880]"
        >
          {shownOptions.map((o) => {
            const isActive = value === o.value
            return (
              <button
                key={o.value || "placeholder"}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                  setQuery("")
                }}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm transition-colors",
                  isActive ? "bg-[#1F6CA3]/15 font-medium text-[#0f3555]" : "hover:bg-[#1F6CA3]/10",
                )}
              >
                {o.label}
              </button>
            )
          })}
          {shownOptions.length === 0 ? (
            <p className="px-4 py-2 text-sm text-[#0f3555]/70">Aucun résultat.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function ConseilContactForm() {
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [email, setEmail] = useState("")
  const [telephone, setTelephone] = useState("")
  const [entreprise, setEntreprise] = useState("")
  const [poste, setPoste] = useState("")
  const [description, setDescription] = useState("")
  const [titreConseil, setTitreConseil] = useState("")
  const [secteur, setSecteur] = useState("")
  const [typeConseil, setTypeConseil] = useState("")
  const [secteurAutre, setSecteurAutre] = useState("")
  const [typeConseilAutre, setTypeConseilAutre] = useState("")
  const [tailleEquipe, setTailleEquipe] = useState("")
  const [delai, setDelai] = useState("")
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY)
  const [piecesJointes, setPiecesJointes] = useState<File[]>([])
  const pieceJointeInputRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const phoneCountryOptions = getPhoneCountryOptions("fr")

  const leftLabelCls = "block text-sm font-medium text-white"
  const rightLabelCls = "block text-sm font-medium text-[#0f3555]"
  const secteurFinal = secteur === "autre" ? secteurAutre.trim() : secteur
  const typeConseilFinal = typeConseil === "autre" ? typeConseilAutre.trim() : typeConseil

  const handleEmailChange = (nextEmail: string) => {
    setEmail(nextEmail)
    if (emailTouched) setEmailError(validateEmailStructure(nextEmail))
  }

  const handleEmailBlur = () => {
    setEmailTouched(true)
    setEmailError(validateEmailStructure(email))
  }

  const handlePhoneChange = (nextPhone: string) => {
    setTelephone(nextPhone)
    const detected = detectPhoneCountry(nextPhone, phoneCountry)
    if (detected) setPhoneCountry(detected)
    if (phoneTouched) {
      setPhoneError(validatePhoneStructure(nextPhone, { defaultCountry: detected || phoneCountry }))
    }
  }

  const handlePhoneBlur = () => {
    setPhoneTouched(true)
    setPhoneError(
      validatePhoneStructure(telephone, { defaultCountry: phoneCountry }),
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const emailValidationError = validateEmailStructure(email)
    if (emailValidationError) {
      setEmailTouched(true)
      setEmailError(emailValidationError)
      toast.error(emailValidationError)
      return
    }
    const phoneValidationError = validatePhoneStructure(telephone, {
      defaultCountry: phoneCountry,
    })
    if (phoneValidationError) {
      setPhoneTouched(true)
      setPhoneError(phoneValidationError)
      toast.error(phoneValidationError)
      return
    }
    if (secteur === "autre" && !secteurAutre.trim()) {
      toast.error("Veuillez préciser votre secteur d'activité.")
      return
    }
    if (typeConseil === "autre" && !typeConseilAutre.trim()) {
      toast.error("Veuillez préciser le type de conseil.")
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("nom", nom.trim())
      formData.append("prenom", prenom.trim())
      formData.append("email", email.trim())
      formData.append("telephone", telephone.trim())
      formData.append("entreprise", entreprise.trim())
      formData.append("poste", poste.trim())
      formData.append("descriptionBesoin", description.trim())
      formData.append("titreConseil", titreConseil.trim())
      formData.append("secteurActivite", secteurFinal)
      formData.append("typeConseil", typeConseilFinal)
      formData.append("tailleEquipe", tailleEquipe)
      formData.append("delaiSouhaite", delai)
      for (const file of piecesJointes) {
        formData.append("piecesJointes", file)
      }

      const res = await fetch("/api/conseil/demande", {
        method: "POST",
        body: formData,
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; detail?: string }
      if (!res.ok) throw new Error(data.detail || "Envoi impossible")
      toast.success("Demande envoyée. Nous vous recontactons très bientôt.")
      setNom("")
      setPrenom("")
      setEmail("")
      setTelephone("")
      setEntreprise("")
      setPoste("")
      setDescription("")
      setTitreConseil("")
      setSecteur("")
      setTypeConseil("")
      setSecteurAutre("")
      setTypeConseilAutre("")
      setTailleEquipe("")
      setDelai("")
      setEmailTouched(false)
      setEmailError(null)
      setPhoneTouched(false)
      setPhoneError(null)
      setPhoneCountry(DEFAULT_PHONE_COUNTRY)
      setPiecesJointes([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">Soumettez votre demande de conseil</h2>
        <p className="mt-3 text-sm text-white/85 sm:text-base">
          Partagez votre contexte et vos objectifs, nous vous orientons vers un accompagnement adapte.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="relative isolate overflow-visible rounded-[1.75rem] border border-white/20 shadow-[0_24px_60px_-24px_rgba(2,12,27,0.6)]">
          <div aria-hidden className="absolute inset-0 bg-[#02112b]/20" />
          <div className="relative grid overflow-visible lg:grid-cols-[1.25fr_0.95fr]">
            <div className="relative z-50 bg-gradient-to-br from-[#0b3d7a]/5 to-[#02112b]/60 p-5 sm:p-7 lg:p-8">
              <div className="space-y-5">
                <FormSection title="Informations de contact" className="z-30">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label htmlFor="c-nom" className={leftLabelCls}>Nom <Req /></label><Input id="c-nom" required autoComplete="family-name" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} className={leftInputCls} disabled={submitting} /></div>
                    <div className="space-y-1.5"><label htmlFor="c-prenom" className={leftLabelCls}>Prénom <Req /></label><Input id="c-prenom" required autoComplete="given-name" placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} className={leftInputCls} disabled={submitting} /></div>
                    <div className="space-y-1.5"><label htmlFor="c-email" className={leftLabelCls}>Email <Req /></label><Input id="c-email" type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => handleEmailChange(e.target.value)} onBlur={handleEmailBlur} className={leftInputCls} disabled={submitting} />{emailTouched && emailError ? <p className="text-xs text-red-200">{emailError}</p> : null}</div>
                    <div className="space-y-1.5"><label htmlFor="c-tel" className={leftLabelCls}>Téléphone <Req /></label><div className="flex gap-2"><div className="w-[46%]"><LeftSelect id="c-country" value={phoneCountry} onChange={(v) => setPhoneCountry(v as CountryCode)} options={phoneCountryOptions.map((opt) => ({ value: opt.code, label: opt.label }))} selectedDisplayLabel={`+${phoneCountryOptions.find((o) => o.code === phoneCountry)?.dialCode ?? "216"}`} searchable disabled={submitting} /></div><Input id="c-tel" type="tel" required autoComplete="tel" placeholder="Téléphone" value={telephone} onChange={(e) => handlePhoneChange(e.target.value)} onBlur={handlePhoneBlur} className={cn(leftInputCls, "w-[54%]")} disabled={submitting} /></div>{phoneTouched && phoneError ? <p className="text-xs text-red-200">{phoneError}</p> : null}</div>
                    <div className="space-y-1.5"><label htmlFor="c-org" className={leftLabelCls}>Entreprise / Organisation</label><Input id="c-org" placeholder="Entreprise / Organisation" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} className={leftInputCls} disabled={submitting} /></div>
                    <div className="space-y-1.5"><label htmlFor="c-poste" className={leftLabelCls}>Poste occupé</label><Input id="c-poste" placeholder="Poste occupé" value={poste} onChange={(e) => setPoste(e.target.value)} className={leftInputCls} disabled={submitting} /></div>
                  </div>
                </FormSection>

                <FormSection title="Nature de la demande" className="z-10">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5"><label htmlFor="c-secteur" className={leftLabelCls}>Secteur d&apos;activité <Req /></label><LeftSelect id="c-secteur" value={secteur} onChange={setSecteur} options={SECTEUR_OPTIONS} required disabled={submitting} />{secteur === "autre" ? <Input id="c-secteur-autre" required placeholder="Précisez votre secteur" value={secteurAutre} onChange={(e) => setSecteurAutre(e.target.value)} className={cn(leftInputCls, "mt-2")} disabled={submitting} /> : null}</div>
                    <div className="space-y-1.5"><label htmlFor="c-type" className={leftLabelCls}>Type de conseil souhaité <Req /></label><LeftSelect id="c-type" value={typeConseil} onChange={setTypeConseil} options={TYPE_CONSEIL_OPTIONS} required disabled={submitting} />{typeConseil === "autre" ? <Input id="c-type-autre" required placeholder="Précisez le type de conseil" value={typeConseilAutre} onChange={(e) => setTypeConseilAutre(e.target.value)} className={cn(leftInputCls, "mt-2")} disabled={submitting} /> : null}</div>
                    <div className="space-y-1.5"><label htmlFor="c-taille" className={leftLabelCls}>Taille de l&apos;équipe concernée</label><LeftSelect id="c-taille" value={tailleEquipe} onChange={setTailleEquipe} options={TAILLE_EQUIPE_OPTIONS} disabled={submitting} /></div>
                    <div className="space-y-1.5"><label htmlFor="c-delai" className={leftLabelCls}>Délai souhaité</label><LeftSelect id="c-delai" value={delai} onChange={setDelai} options={DELAI_OPTIONS} disabled={submitting} /></div>
                  </div>
                </FormSection>
              </div>
            </div>

            <div className="relative z-10 bg-gradient-to-b from-white/70 to-white/5 p-5 sm:p-7 lg:p-8">
              <div className="rounded-2xl border border-slate-200 bg-white/30 p-5 shadow-[0_12px_34px_-20px_rgba(15,23,42,0.25)] sm:p-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#0f3555]/85">Description du besoin</h3>
                <div className="mt-2 h-px w-full bg-[#0f3555]/85" />
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Décrivez votre problématique, vos contraintes et vos objectifs de transformation.</p>
                <div className="mt-6 space-y-1.5">
                  <label htmlFor="c-titre-conseil" className={rightLabelCls}>Titre du conseil <Req /></label>
                  <Input id="c-titre-conseil" required placeholder="Titre du conseil" value={titreConseil} onChange={(e) => setTitreConseil(e.target.value)} className="h-11 rounded-lg border border-slate-300 bg-white/30 px-4 text-sm text-white placeholder:text-slate-500 shadow-sm transition focus-visible:border-[#1a7fcf]/60 focus-visible:ring-2 focus-visible:ring-[#1a7fcf]/20" disabled={submitting} />
                </div>
                <div className="mt-4 space-y-1.5">
                  <label htmlFor="c-desc" className={rightLabelCls}>Décrivez votre problématique et vos objectifs <Req /></label>
                  <Textarea id="c-desc" required rows={9} placeholder="Décrivez brièvement votre besoin" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[220px] rounded-lg border border-slate-300 bg-white/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 shadow-sm transition focus-visible:border-[#1a7fcf]/60 focus-visible:ring-2 focus-visible:ring-[#1a7fcf]/20" disabled={submitting} />
                </div>
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <p className="mb-4 text-xs text-slate-600">En envoyant ce formulaire, vous acceptez d&apos;être recontacté par CSF au sujet de votre demande de conseil.</p>
                  {piecesJointes.length > 0 ? (
                    <p className="mb-3 text-xs text-slate-600">{piecesJointes.map((f) => f.name).join(" • ")}</p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <input
                      ref={pieceJointeInputRef}
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(e) => setPiecesJointes(Array.from(e.target.files ?? []))}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => pieceJointeInputRef.current?.click()}
                      disabled={submitting}
                      aria-label="Ajouter une pièce jointe"
                      title="Ajouter une pièce jointe"
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white/30 text-[#0f3555] transition hover:bg-white/40 disabled:opacity-60"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button type="submit" disabled={submitting} className={cn("inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold text-white", "bg-[#062657] shadow-[0_12px_32px_-10px_rgba(11,61,122,0.7)] transition hover:bg-[#062657]/80", "disabled:cursor-not-allowed disabled:opacity-60")}>
                      <Send className="h-4 w-4" />
                      {submitting ? "Envoi en cours…" : "Envoyer la demande"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
