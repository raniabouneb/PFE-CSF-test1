"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react"
import {
  DASHBOARD_COLUMN_GLASS_CLASS,
  FORMATIONS_GLASS_CARD_CLASS,
} from "@/components/platform/dashboard/formations-glass-card"
import { cn } from "@/lib/utils"
import { useAuthUser, useSetAuthUser } from "@/components/platform/auth/auth-user-context"
import {
  profileFieldOrDash,
  profileFirstName,
  profileLastName,
} from "@/lib/auth/profile-display"
import {
  useLearnerCertificationsPayload,
  useLearnerFormationsPayload,
} from "@/lib/hooks/learner/use-learner-platform"
import { useProfileMe } from "@/lib/hooks/learner/use-profile-me"
import type { ProfileUser } from "@/lib/auth/learner-profile-types"
import type { LearnerFormationsPayload, LearnerCertificationsPayload } from "@/lib/server/learner-api"

function displayFullName(user: ProfileUser): string {
  const a = (user.firstName ?? "").trim()
  const b = (user.lastName ?? "").trim()
  if (a && b) return `${a} ${b}`
  if (a) return a
  if (b) return b
  return (user.name ?? "").trim() || "Apprenant CSF"
}

function initialsFrom(user: ProfileUser): string {
  const a = profileFirstName(user)
  const b = profileLastName(user)
  if (a && b) return (a[0] + b[0]).toUpperCase()
  if (a) return a.slice(0, 2).toUpperCase()
  const n = (user.name ?? "").trim()
  if (n) {
    const p = n.split(/\s+/).filter(Boolean)
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase()
    return n.slice(0, 2).toUpperCase()
  }
  return user.email.slice(0, 2).toUpperCase()
}

type FormationHistoryRow = {
  id: string
  title: string
  period: string | null
  type: string
  certStatus: "obtained" | "pending" | "not_obtained" | "none"
  certDate: string | null
}

function buildHistoryRows(
  formations: LearnerFormationsPayload | null,
  certifications: LearnerCertificationsPayload | null,
): FormationHistoryRow[] {
  if (!formations) return []

  const certMap = new Map<string, { status: string; date: string | null }>()
  for (const row of certifications?.pendingRows ?? []) {
    certMap.set(row.certification.toLowerCase(), {
      status: row.result === "failed" ? "not_obtained" : "pending",
      date: row.date ?? null,
    })
  }
  for (const cert of certifications?.readyCertificates ?? []) {
    certMap.set(cert.title.toLowerCase(), { status: "obtained", date: null })
  }

  return formations.courses.map((course) => {
    let type = "Formation"
    const badgeLabels = (course.badges ?? []).map((b) => b.label.toLowerCase())
    if (badgeLabels.some((l) => l.includes("reconversion"))) type = "Reconversion"
    else if (badgeLabels.some((l) => l.includes("ponctuelle"))) type = "Ponctuelle"
    else if (badgeLabels.some((l) => l.includes("mesure") || l.includes("sur-mesure"))) type = "Sur mesure"
    else if ((course.groupLabel ?? "").toLowerCase().includes("reconversion")) type = "Reconversion"
    else if ((course.groupLabel ?? "").toLowerCase().includes("ponctuelle")) type = "Ponctuelle"

    const periodStat = (course.stats ?? []).find(
      (s) =>
        s.label.toLowerCase().includes("période") || s.label.toLowerCase().includes("date"),
    )
    const period = periodStat?.value ?? null

    const inlineCerts = course.certifications ?? []
    let certStatus: FormationHistoryRow["certStatus"] = "none"
    let certDate: string | null = null

    if (inlineCerts.length > 0) {
      const passed = inlineCerts.find((c) => c.status === "passed")
      const pending = inlineCerts.find((c) => c.status === "pending")
      const failed = inlineCerts.find((c) => c.status === "failed")
      if (passed) {
        certStatus = "obtained"
        certDate = null
      } else if (pending) {
        certStatus = "pending"
      } else if (failed) {
        certStatus = "not_obtained"
      }
    } else {
      const found = certMap.get(course.title.toLowerCase())
      if (found) {
        certStatus = found.status as FormationHistoryRow["certStatus"]
        certDate = found.date
      }
    }

    return {
      id: course.memberId,
      title: course.title,
      period,
      type,
      certStatus,
      certDate,
    }
  })
}

function CertStatusBadge({ status }: { status: FormationHistoryRow["certStatus"] }) {
  if (status === "obtained") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
        <CheckCircle2 size={12} aria-hidden />
        Obtenue
      </span>
    )
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200/80">
        <Clock size={12} aria-hidden />
        En cours de validation
      </span>
    )
  }
  if (status === "not_obtained") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200/80">
        <XCircle size={12} aria-hidden />
        Non obtenue
      </span>
    )
  }
  return <span className="text-xs text-[#64748b]">—</span>
}

export default function ProfilePageClient() {
  const authUser = useAuthUser()
  const setAuthUser = useSetAuthUser()
  const { data: profileMe } = useProfileMe()
  const { data: formations } = useLearnerFormationsPayload()
  const { data: certifications } = useLearnerCertificationsPayload()

  const initialUser = useMemo((): ProfileUser | null => {
    if (!authUser && !profileMe) return null
    return {
      ...(profileMe ?? {}),
      id: profileMe?.id ?? authUser!.id,
      email: profileMe?.email ?? authUser!.email,
      name: profileMe?.name ?? authUser?.name ?? null,
      role: profileMe?.role ?? authUser?.role,
      firstName: profileMe?.firstName ?? authUser?.firstName,
      lastName: profileMe?.lastName ?? authUser?.lastName,
      phone: profileMe?.phone ?? authUser?.phone,
      photoUrl: profileMe?.photoUrl ?? authUser?.photoUrl,
    }
  }, [authUser, profileMe])

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  useEffect(() => {
    setPhotoUrl(initialUser?.photoUrl ?? null)
  }, [initialUser?.photoUrl])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const avatarSrc = useMemo(() => {
    if (!initialUser) return ""
    if (photoUrl) return `/api/profile/photo?url=${encodeURIComponent(photoUrl)}`
    const e = (initialUser.email ?? "").trim()
    if (!e.includes("@")) return ""
    return `/api/profile/avatar?email=${encodeURIComponent(e)}`
  }, [photoUrl, initialUser?.email])

  const historyRows = useMemo(
    () => buildHistoryRows(formations ?? null, certifications ?? null),
    [formations, certifications],
  )

  if (!initialUser) return null

  const initials = initialsFrom(initialUser)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setPhotoError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/profile/upload-photo", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setPhotoError(data.error || "Erreur lors du téléchargement.")
        return
      }
      if (data.user?.photoUrl) {
        setPhotoUrl(data.user.photoUrl)
        setAuthUser({
          id: initialUser.id,
          email: initialUser.email,
          name: initialUser.name,
          role: initialUser.role,
          firstName: data.user.firstName ?? initialUser.firstName,
          lastName: data.user.lastName ?? initialUser.lastName,
          phone: data.user.phone ?? initialUser.phone,
          photoUrl: data.user.photoUrl,
        })
      }
    } catch {
      setPhotoError("Erreur lors du téléchargement de la photo.")
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const roleLabel =
    initialUser.role === "admin"
      ? "Administrateur"
      : initialUser.role === "assistant"
        ? "Assistant"
        : "Apprenant CSF"

  return (
    <div className={cn(DASHBOARD_COLUMN_GLASS_CLASS, "mx-auto max-w-[1485px] p-4 pb-16 lg:p-8 lg:pb-20")}>
      <h1 className="text-2xl font-bold tracking-tight text-[#0B264F]">Mon Profil</h1>

      <section className={cn(FORMATIONS_GLASS_CARD_CLASS)}>
        <h2 className="mb-5 text-lg font-bold text-[#0B264F]">👤 Informations personnelles</h2>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <div className="group relative">
              <Avatar className="h-28 w-28 border-4 border-white/20 shadow-lg ring-2 ring-[#0B264F]/10">
                {avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt="" referrerPolicy="no-referrer" />
                ) : null}
                <AvatarFallback
                  delayMs={avatarSrc ? 120 : 0}
                  className="bg-[#1e4a72] text-2xl font-semibold text-white"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Changer la photo de profil"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-7 w-7 animate-spin text-white" />
                ) : (
                  <Camera className="h-7 w-7 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void handlePhotoUpload(e)}
              />
            </div>
            <p className="max-w-[160px] text-center text-[11px] text-[#64748b] sm:text-left">
              Cliquez pour modifier la photo
            </p>
            {photoError && <p className="text-xs text-red-600">{photoError}</p>}
          </div>

          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                Prénom
              </p>
              <p className="text-sm font-medium text-[#0B264F]">
                {profileFieldOrDash(profileFirstName(initialUser))}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                Nom
              </p>
              <p className="text-sm font-medium text-[#0B264F]">
                {profileFieldOrDash(profileLastName(initialUser))}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                E-mail
              </p>
              <p className="text-sm font-medium text-[#0B264F]">{initialUser.email}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                Téléphone
              </p>
              <p className="text-sm font-medium text-[#0B264F]">
                {profileFieldOrDash(initialUser.phone)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                Rôle
              </p>
              <p className="text-sm font-medium text-[#0B264F]">{roleLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={cn(FORMATIONS_GLASS_CARD_CLASS)}>
        <h2 className="mb-5 text-lg font-bold text-[#0B264F]">📋 Historique des formations</h2>

        {historyRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#0B264F]/20 bg-white/30 px-4 py-10 text-center text-sm text-[#64748b]">
            Aucune formation enregistrée pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#0B264F]/10">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0B264F]/10 bg-white/40 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                  <th className="px-4 py-3.5">Formation</th>
                  <th className="px-4 py-3.5">Période</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Certification</th>
                  <th className="px-4 py-3.5">Date d&apos;obtention</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={row.id} className="border-b border-[#0B264F]/10 last:border-0">
                    <td className="px-4 py-4 font-medium text-[#0B264F]">{row.title}</td>
                    <td className="px-4 py-4 tabular-nums text-[#64748b]">{row.period ?? "—"}</td>
                    <td className="px-4 py-4 text-[#64748b]">{row.type}</td>
                    <td className="px-4 py-4">
                      <CertStatusBadge status={row.certStatus} />
                    </td>
                    <td className="px-4 py-4 tabular-nums text-[#64748b]">
                      {row.certStatus === "obtained" && row.certDate ? row.certDate : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
