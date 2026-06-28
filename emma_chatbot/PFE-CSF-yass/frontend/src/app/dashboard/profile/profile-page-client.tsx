"use client"

import { useCallback, useMemo, useState, type ReactNode } from "react"
import DashboardHero from "@/components/platform/dashboard/dashboard-hero"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type {
  LearnerCertification,
  LearnerCv,
  LearnerFormation,
  LearnerProject,
  LearnerRecommendation,
  ProfileUser,
} from "@/lib/auth/learner-profile-types"
import { normalizeLearnerCv } from "@/lib/auth/learner-profile-types"
import { cn } from "@/lib/utils"
import { Download, FileText, Loader2, Plus, Trash2 } from "lucide-react"

function messageFromProfileResponse(res: Response, raw: string, data: { error?: unknown }): string {
  if (typeof data.error === "string") return data.error
  if (raw) return raw.slice(0, 200)
  return `Erreur ${res.status}`
}

function cleanLearnerCv(cv: LearnerCv): LearnerCv {
  const formations = (cv.formations ?? [])
    .filter((f) => (f.title ?? "").trim().length > 0)
    .map((f) => ({
      ...f,
      title: f.title.trim(),
      period: f.period?.trim() || null,
      status: f.status?.trim() || null,
      notes: f.notes?.trim() || null,
    }))
  const projects = (cv.projects ?? [])
    .filter((p) => (p.title ?? "").trim().length > 0)
    .map((p) => ({
      ...p,
      title: p.title.trim(),
      description: (p.description ?? "").trim(),
      context: p.context?.trim() || null,
    }))
  const certifications = (cv.certifications ?? [])
    .filter((c) => (c.title ?? "").trim().length > 0)
    .map((c) => ({
      ...c,
      title: c.title.trim(),
      date: c.date?.trim() || null,
      issuer: c.issuer?.trim() || null,
    }))
  const recommendations = (cv.recommendations ?? [])
    .filter(
      (r) =>
        (r.title ?? "").trim().length > 0 &&
        (r.fileName ?? "").trim().length > 0 &&
        (r.fileUrl ?? "").trim().length > 0
    )
    .map((r) => ({
      ...r,
      title: r.title.trim(),
      fileName: r.fileName.trim(),
      fileUrl: r.fileUrl.trim(),
    }))

  return {
    skillsSummary: (cv.skillsSummary ?? "").trim(),
    formations,
    projects,
    certifications,
    recommendations,
  }
}

function SectionTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3 className={cn("mb-3 text-base font-semibold text-[#0f172a]", className)}>{children}</h3>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-neutral-700">{children}</label>
}

function displayFullName(first: string, last: string, fallbackName: string | null): string {
  const a = first.trim()
  const b = last.trim()
  if (a && b) return `${a} ${b}`
  if (a) return a
  if (b) return b
  return (fallbackName ?? "").trim() || "Apprenant CSF"
}

function initialsFrom(first: string, last: string, fallbackName: string | null, email: string): string {
  const a = first.trim()
  const b = last.trim()
  if (a && b) return (a[0] + b[0]).toUpperCase()
  if (a) return a.slice(0, 2).toUpperCase()
  const n = (fallbackName ?? "").trim()
  if (n) {
    const p = n.split(/\s+/).filter(Boolean)
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase()
    return n.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function CsfCvPreview({
  fullName,
  email,
  cv,
  counts,
}: {
  fullName: string
  email: string
  cv: LearnerCv
  counts: { formations: number; projects: number; certifications: number }
}) {
  const skills = (cv.skillsSummary ?? "").trim()
  const formations = (cv.formations ?? []).filter((f) => (f.title ?? "").trim())
  const projects = (cv.projects ?? []).filter((p) => (p.title ?? "").trim())
  const certifications = (cv.certifications ?? []).filter((c) => (c.title ?? "").trim())

  const hasContent =
    skills.length > 0 ||
    formations.length > 0 ||
    projects.length > 0 ||
    certifications.length > 0

  return (
    <div className="rounded-lg border border-[#1e4a72]/15 bg-gradient-to-b from-[#f8fafc] to-white p-6 shadow-inner">
      <div className="border-b border-neutral-200 pb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#1e4a72]/80">CV CSF</p>
        <h3 className="mt-1 font-serif text-2xl font-semibold text-[#0f172a]">{fullName}</h3>
        <p className="text-sm text-neutral-600">{email}</p>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          Document généré automatiquement à partir de votre parcours enregistré (formations, projets,
          certifications).
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-700">
        <span className="rounded-full bg-[#1e4a72]/10 px-3 py-1 font-medium text-[#0D3570]">
          {counts.formations} formation{counts.formations !== 1 ? "s" : ""}
        </span>
        <span className="rounded-full bg-emerald-100/80 px-3 py-1 font-medium text-emerald-900">
          {counts.projects} projet{counts.projects !== 1 ? "s" : ""}
        </span>
        <span className="rounded-full bg-amber-100/80 px-3 py-1 font-medium text-amber-950">
          {counts.certifications} certification{counts.certifications !== 1 ? "s" : ""}
        </span>
      </div>

      {!hasContent ? (
        <p className="mt-6 text-sm text-neutral-500">
          Complétez les sections ci-dessous pour alimenter votre CV CSF.
        </p>
      ) : (
        <div className="mt-6 space-y-6 text-sm text-neutral-800">
          {skills ? (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#0D3570]">
                Compétences
              </h4>
              <p className="whitespace-pre-wrap leading-relaxed">{skills}</p>
            </section>
          ) : null}

          {formations.length > 0 ? (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#0D3570]">
                Formations CSF
              </h4>
              <ul className="space-y-3">
                {formations.map((f, i) => (
                  <li key={f.id ?? `pv-f-${i}`} className="border-l-2 border-[#1e4a72]/40 pl-3">
                    <p className="font-semibold text-[#0f172a]">{f.title}</p>
                    <p className="text-xs text-neutral-600">
                      {[f.period, f.status].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {f.notes?.trim() ? (
                      <p className="mt-1 text-xs text-neutral-600 whitespace-pre-wrap">{f.notes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {projects.length > 0 ? (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#0D3570]">
                Projets
              </h4>
              <ul className="space-y-3">
                {projects.map((p, i) => (
                  <li key={p.id ?? `pv-p-${i}`} className="rounded-md bg-white/80 p-3 ring-1 ring-neutral-200/80">
                    <p className="font-semibold text-[#0f172a]">{p.title}</p>
                    {p.context?.trim() ? (
                      <p className="text-xs text-[#1e4a72]">{p.context}</p>
                    ) : null}
                    {p.description?.trim() ? (
                      <p className="mt-1 text-xs leading-relaxed text-neutral-700 whitespace-pre-wrap">
                        {p.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {certifications.length > 0 ? (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#0D3570]">
                Certifications
              </h4>
              <ul className="space-y-2">
                {certifications.map((c, i) => (
                  <li
                    key={c.id ?? `pv-c-${i}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-100 pb-2 last:border-0"
                  >
                    <span className="font-medium text-[#0f172a]">{c.title}</span>
                    <span className="text-xs text-neutral-500">
                      {[c.date, c.issuer].filter(Boolean).join(" · ") || ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default function ProfilePageClient({ initialUser }: { initialUser: ProfileUser }) {
  const [user, setUser] = useState<ProfileUser>(initialUser)
  const [firstName, setFirstName] = useState(initialUser.firstName ?? "")
  const [lastName, setLastName] = useState(initialUser.lastName ?? "")
  const [email, setEmail] = useState(initialUser.email ?? "")
  const [phone, setPhone] = useState(initialUser.phone ?? "")
  const [cv, setCv] = useState<LearnerCv>(() => normalizeLearnerCv(initialUser.learnerCv))

  const [savingIdentity, setSavingIdentity] = useState(false)
  const [savingCv, setSavingCv] = useState(false)
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const showBanner = useCallback((type: "ok" | "err", text: string) => {
    setBanner({ type, text })
    window.setTimeout(() => setBanner(null), 5000)
  }, [])

  const greetingName = useMemo(() => {
    const f = firstName.trim()
    if (f) return f
    const n = user.name?.trim()
    if (n) return n.split(/\s+/)[0] ?? "Thomas"
    return "Thomas"
  }, [firstName, user.name])

  const fullName = useMemo(
    () => displayFullName(firstName, lastName, user.name),
    [firstName, lastName, user.name]
  )

  const initials = useMemo(
    () => initialsFrom(firstName, lastName, user.name, email),
    [firstName, lastName, user.name, email]
  )

  const avatarSrc = useMemo(() => {
    const e = email.trim()
    if (!e.includes("@")) return ""
    return `/api/profile/avatar?email=${encodeURIComponent(e)}`
  }, [email])

  const activityCounts = useMemo(() => {
    const formations = (cv.formations ?? []).filter((f) => (f.title ?? "").trim()).length
    const projects = (cv.projects ?? []).filter((p) => (p.title ?? "").trim()).length
    const certifications = (cv.certifications ?? []).filter((c) => (c.title ?? "").trim()).length
    return { formations, projects, certifications }
  }, [cv.formations, cv.projects, cv.certifications])

  const patchProfile = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const raw = await res.text()
    let data: { ok?: boolean; user?: ProfileUser; error?: unknown } = {}
    try {
      data = raw ? (JSON.parse(raw) as typeof data) : {}
    } catch {
      data = {}
    }
    if (!res.ok) {
      throw new Error(messageFromProfileResponse(res, raw, data))
    }
    if (data.user) {
      const u = data.user
      setUser(u)
      setFirstName(u.firstName ?? "")
      setLastName(u.lastName ?? "")
      setEmail(u.email)
      setPhone(u.phone ?? "")
      if (body.learnerCv !== undefined) {
        setCv(normalizeLearnerCv(u.learnerCv))
      }
    }
    return data
  }, [])

  const saveIdentity = async () => {
    setSavingIdentity(true)
    try {
      await patchProfile({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        email: email.trim(),
        phone: phone.trim() || null,
      })
      setFirstName((v) => v.trim())
      setLastName((v) => v.trim())
      setEmail((v) => v.trim())
      setPhone((v) => v.trim())
      showBanner("ok", "Informations personnelles enregistrées.")
    } catch (e) {
      showBanner("err", e instanceof Error ? e.message : "Enregistrement impossible.")
    } finally {
      setSavingIdentity(false)
    }
  }

  const saveCv = async () => {
    const cleaned = cleanLearnerCv(cv)
    for (const r of cleaned.recommendations ?? []) {
      const u = r.fileUrl
      if (!u.startsWith("http://") && !u.startsWith("https://")) {
        showBanner(
          "err",
          `L’URL du fichier « ${r.title} » doit commencer par http:// ou https://`
        )
        return
      }
    }
    setSavingCv(true)
    try {
      await patchProfile({ learnerCv: cleaned })
      showBanner("ok", "CV et lettres enregistrés.")
    } catch (e) {
      showBanner("err", e instanceof Error ? e.message : "Enregistrement impossible.")
    } finally {
      setSavingCv(false)
    }
  }

  const updateFormation = (index: number, patch: Partial<LearnerFormation>) => {
    setCv((prev) => {
      const list = [...(prev.formations ?? [])]
      list[index] = { ...list[index], ...patch }
      return { ...prev, formations: list }
    })
  }

  const addFormation = () => {
    setCv((prev) => ({
      ...prev,
      formations: [...(prev.formations ?? []), { title: "", period: "", status: "", notes: "" }],
    }))
  }

  const removeFormation = (index: number) => {
    setCv((prev) => ({
      ...prev,
      formations: (prev.formations ?? []).filter((_, i) => i !== index),
    }))
  }

  const updateProject = (index: number, patch: Partial<LearnerProject>) => {
    setCv((prev) => {
      const list = [...(prev.projects ?? [])]
      list[index] = { ...list[index], ...patch }
      return { ...prev, projects: list }
    })
  }

  const addProject = () => {
    setCv((prev) => ({
      ...prev,
      projects: [...(prev.projects ?? []), { title: "", description: "", context: "" }],
    }))
  }

  const removeProject = (index: number) => {
    setCv((prev) => ({
      ...prev,
      projects: (prev.projects ?? []).filter((_, i) => i !== index),
    }))
  }

  const updateCert = (index: number, patch: Partial<LearnerCertification>) => {
    setCv((prev) => {
      const list = [...(prev.certifications ?? [])]
      list[index] = { ...list[index], ...patch }
      return { ...prev, certifications: list }
    })
  }

  const addCert = () => {
    setCv((prev) => ({
      ...prev,
      certifications: [...(prev.certifications ?? []), { title: "", date: "", issuer: "" }],
    }))
  }

  const removeCert = (index: number) => {
    setCv((prev) => ({
      ...prev,
      certifications: (prev.certifications ?? []).filter((_, i) => i !== index),
    }))
  }

  const updateRec = (index: number, patch: Partial<LearnerRecommendation>) => {
    setCv((prev) => {
      const list = [...(prev.recommendations ?? [])]
      list[index] = { ...list[index], ...patch }
      return { ...prev, recommendations: list }
    })
  }

  const addRec = () => {
    setCv((prev) => ({
      ...prev,
      recommendations: [
        ...(prev.recommendations ?? []),
        { title: "", fileName: "", fileUrl: "" },
      ],
    }))
  }

  const removeRec = (index: number) => {
    setCv((prev) => ({
      ...prev,
      recommendations: (prev.recommendations ?? []).filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <DashboardHero activeSubTab="profile" greetingName={greetingName} />

      <main className="relative mx-auto max-w-[1485px] px-4 pb-16 pt-2 md:px-8 md:pb-20 lg:-mt-14 lg:px-16">
        {banner && (
          <div
            className={cn(
              "mb-4 rounded-lg border px-4 py-3 text-sm",
              banner.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            )}
            role="status"
          >
            {banner.text}
          </div>
        )}

        {/* Section 1 — Identité */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
          <h2 className="mb-6 text-xl font-semibold text-[#0f172a]">Identité</h2>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <Avatar className="h-36 w-36 border-4 border-white shadow-lg ring-2 ring-[#1e4a72]/20">
                {avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt="" referrerPolicy="no-referrer" />
                ) : null}
                <AvatarFallback
                  delayMs={avatarSrc ? 120 : 0}
                  className="bg-[#1e4a72] text-3xl font-semibold text-white"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <p className="max-w-[200px] text-center text-xs text-neutral-500 lg:text-left">
                Photo liée à votre e-mail (Gravatar). Modifiez-la sur{" "}
                <a
                  href="https://fr.gravatar.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#0D3570] underline-offset-2 hover:underline"
                >
                  gravatar.com
                </a>{" "}
                avec la même adresse.
              </p>
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <p className="text-sm text-neutral-600">
                Coordonnées de votre espace apprenant. L’e-mail sert aussi à la connexion.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Prénom</FieldLabel>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Nom</FieldLabel>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>E-mail</FieldLabel>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Téléphone</FieldLabel>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+216 …"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  className="bg-[#0D3570] hover:bg-[#0a2a5c]"
                  onClick={() => void saveIdentity()}
                  disabled={savingIdentity}
                >
                  {savingIdentity ? <Loader2 className="animate-spin" aria-hidden /> : null}
                  Enregistrer les informations
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 — Deux colonnes : CV CSF | Lettres */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          {/* Colonne CV */}
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1e4a72]/10 text-[#0D3570]">
                  <FileText size={22} aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a]">CV CSF</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Aperçu généré automatiquement à partir de vos données de parcours. Complétez la
                    section ci-dessous pour mettre à jour ce document.
                  </p>
                </div>
              </div>

              <CsfCvPreview
                fullName={fullName}
                email={email.trim() || user.email}
                cv={cv}
                counts={activityCounts}
              />

              <details className="group mt-8 rounded-lg border border-neutral-200 bg-neutral-50/50 open:bg-white">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[#0D3570] marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="underline-offset-2 group-open:underline">
                    Modifier le contenu du CV (compétences, formations, projets, certifications)
                  </span>
                </summary>
                <div className="space-y-10 border-t border-neutral-200 px-4 pb-6 pt-6">
                  <div>
                    <SectionTitle>Compétences acquises</SectionTitle>
                    <Textarea
                      className="min-h-[120px] bg-white"
                      placeholder="Ex. : Python, analyse de données, gestion de projet agile…"
                      value={cv.skillsSummary ?? ""}
                      onChange={(e) => setCv((p) => ({ ...p, skillsSummary: e.target.value }))}
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <SectionTitle className="mb-0">Formations CSF suivies</SectionTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addFormation}>
                        <Plus size={16} aria-hidden />
                        Ajouter
                      </Button>
                    </div>
                    {(cv.formations ?? []).length === 0 ? (
                      <p className="text-sm text-neutral-500">Aucune formation renseignée.</p>
                    ) : (
                      <ul className="space-y-4">
                        {(cv.formations ?? []).map((f, i) => (
                          <li
                            key={f.id ?? `formation-${i}`}
                            className="rounded-lg border border-neutral-200 bg-white p-4"
                          >
                            <div className="mb-3 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => removeFormation(i)}
                                aria-label="Supprimer cette formation"
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <FieldLabel>Intitulé de la formation</FieldLabel>
                                <Input
                                  value={f.title}
                                  onChange={(e) => updateFormation(i, { title: e.target.value })}
                                />
                              </div>
                              <div>
                                <FieldLabel>Période</FieldLabel>
                                <Input
                                  placeholder="ex. 2024 — 2025"
                                  value={f.period ?? ""}
                                  onChange={(e) => updateFormation(i, { period: e.target.value })}
                                />
                              </div>
                              <div>
                                <FieldLabel>Statut</FieldLabel>
                                <Input
                                  placeholder="Terminé, en cours…"
                                  value={f.status ?? ""}
                                  onChange={(e) => updateFormation(i, { status: e.target.value })}
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <FieldLabel>Notes (optionnel)</FieldLabel>
                                <Textarea
                                  className="min-h-[72px]"
                                  value={f.notes ?? ""}
                                  onChange={(e) => updateFormation(i, { notes: e.target.value })}
                                />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <SectionTitle className="mb-0">Projets du parcours</SectionTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addProject}>
                        <Plus size={16} aria-hidden />
                        Ajouter
                      </Button>
                    </div>
                    {(cv.projects ?? []).length === 0 ? (
                      <p className="text-sm text-neutral-500">Aucun projet renseigné.</p>
                    ) : (
                      <ul className="space-y-4">
                        {(cv.projects ?? []).map((p, i) => (
                          <li
                            key={p.id ?? `project-${i}`}
                            className="rounded-lg border border-neutral-200 bg-white p-4"
                          >
                            <div className="mb-3 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => removeProject(i)}
                                aria-label="Supprimer ce projet"
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                            <div className="grid gap-3">
                              <div>
                                <FieldLabel>Titre du projet</FieldLabel>
                                <Input
                                  value={p.title}
                                  onChange={(e) => updateProject(i, { title: e.target.value })}
                                />
                              </div>
                              <div>
                                <FieldLabel>Contexte / formation liée</FieldLabel>
                                <Input
                                  placeholder="ex. Module Data Analyst CSF"
                                  value={p.context ?? ""}
                                  onChange={(e) => updateProject(i, { context: e.target.value })}
                                />
                              </div>
                              <div>
                                <FieldLabel>Description</FieldLabel>
                                <Textarea
                                  className="min-h-[100px]"
                                  value={p.description ?? ""}
                                  onChange={(e) => updateProject(i, { description: e.target.value })}
                                />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <SectionTitle className="mb-0">Certifications obtenues</SectionTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addCert}>
                        <Plus size={16} aria-hidden />
                        Ajouter
                      </Button>
                    </div>
                    {(cv.certifications ?? []).length === 0 ? (
                      <p className="text-sm text-neutral-500">Aucune certification renseignée.</p>
                    ) : (
                      <ul className="space-y-4">
                        {(cv.certifications ?? []).map((c, i) => (
                          <li
                            key={c.id ?? `cert-${i}`}
                            className="rounded-lg border border-neutral-200 bg-white p-4"
                          >
                            <div className="mb-3 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => removeCert(i)}
                                aria-label="Supprimer cette certification"
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <FieldLabel>Intitulé</FieldLabel>
                                <Input
                                  value={c.title}
                                  onChange={(e) => updateCert(i, { title: e.target.value })}
                                />
                              </div>
                              <div>
                                <FieldLabel>Date</FieldLabel>
                                <Input
                                  placeholder="ex. Mars 2025"
                                  value={c.date ?? ""}
                                  onChange={(e) => updateCert(i, { date: e.target.value })}
                                />
                              </div>
                              <div>
                                <FieldLabel>Organisme</FieldLabel>
                                <Input
                                  value={c.issuer ?? ""}
                                  onChange={(e) => updateCert(i, { issuer: e.target.value })}
                                />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex justify-end border-t border-neutral-200 pt-4">
                    <Button
                      type="button"
                      className="bg-[#0D3570] hover:bg-[#0a2a5c]"
                      onClick={() => void saveCv()}
                      disabled={savingCv}
                    >
                      {savingCv ? <Loader2 className="animate-spin" aria-hidden /> : null}
                      Enregistrer le CV CSF
                    </Button>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* Colonne lettres */}
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
              <h2 className="mb-2 text-xl font-semibold text-[#0f172a]">
                Lettres de recommandation
              </h2>
              <p className="mb-6 text-sm text-neutral-600">
                Documents prêts à télécharger. Chaque carte correspond à une lettre validée (URL du
                fichier).
              </p>

              {(() => {
                const letters = (cv.recommendations ?? []).filter(
                  (r) =>
                    (r.title ?? "").trim().length > 0 &&
                    (r.fileName ?? "").trim().length > 0 &&
                    (r.fileUrl ?? "").trim().length > 0 &&
                    (r.fileUrl.startsWith("http://") || r.fileUrl.startsWith("https://"))
                )
                if (letters.length === 0) {
                  return (
                    <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-500">
                      Aucune lettre disponible pour le moment. Ajoutez-en via le formulaire ci-dessous.
                    </div>
                  )
                }
                return (
                  <ul className="space-y-4">
                    {letters.map((r) => (
                      <li
                        key={r.id ?? r.fileUrl}
                        className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/80 p-5 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#0f172a]">{r.title.trim()}</p>
                          {r.fileName ? (
                            <p className="mt-1 truncate text-xs text-neutral-500">{r.fileName}</p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="shrink-0 bg-[#0D3570] hover:bg-[#0a2a5c]"
                          asChild
                        >
                          <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" download>
                            <Download size={16} aria-hidden />
                            Télécharger
                          </a>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )
              })()}

              <details className="group mt-8 rounded-lg border border-neutral-200 bg-neutral-50/50 open:bg-white">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[#0D3570] marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="underline-offset-2 group-open:underline">
                    Ajouter ou modifier les lettres (URL du fichier)
                  </span>
                </summary>
                <div className="space-y-4 border-t border-neutral-200 px-4 pb-6 pt-6">
                  <p className="text-sm text-neutral-600">
                    Indiquez l’URL complète du PDF (https://…). Les lettres complètes apparaissent
                    comme cartes téléchargeables ci-dessus.
                  </p>
                  {(cv.recommendations ?? []).length === 0 ? (
                    <p className="text-sm text-neutral-500">Aucune entrée.</p>
                  ) : (
                    <ul className="space-y-4">
                      {(cv.recommendations ?? []).map((r, i) => (
                        <li
                          key={r.id ?? `rec-${i}`}
                          className="rounded-lg border border-neutral-200 bg-white p-4"
                        >
                          <div className="mb-3 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => removeRec(i)}
                              aria-label="Supprimer cette lettre"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </div>
                          <div className="grid gap-3">
                            <div>
                              <FieldLabel>Titre affiché sur la carte</FieldLabel>
                              <Input
                                value={r.title}
                                onChange={(e) => updateRec(i, { title: e.target.value })}
                              />
                            </div>
                            <div>
                              <FieldLabel>Nom du fichier</FieldLabel>
                              <Input
                                value={r.fileName}
                                onChange={(e) => updateRec(i, { fileName: e.target.value })}
                              />
                            </div>
                            <div>
                              <FieldLabel>URL du fichier (https://)</FieldLabel>
                              <Input
                                placeholder="https://…"
                                value={r.fileUrl}
                                onChange={(e) => updateRec(i, { fileUrl: e.target.value })}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={addRec}>
                    <Plus size={16} aria-hidden />
                    Ajouter une lettre
                  </Button>
                  <div className="flex justify-end border-t border-neutral-200 pt-4">
                    <Button
                      type="button"
                      className="bg-[#0D3570] hover:bg-[#0a2a5c]"
                      onClick={() => void saveCv()}
                      disabled={savingCv}
                    >
                      {savingCv ? <Loader2 className="animate-spin" aria-hidden /> : null}
                      Enregistrer les lettres
                    </Button>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
