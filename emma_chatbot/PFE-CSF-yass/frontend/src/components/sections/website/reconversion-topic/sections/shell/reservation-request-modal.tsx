"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { validateEmailStructure } from "@/lib/validation/email"
import {
  DEFAULT_PHONE_COUNTRY,
  detectPhoneCountry,
  getPhoneCountryOptions,
  validatePhoneStructure,
} from "@/lib/validation/phone"
import type { CountryCode } from "libphonenumber-js/min"

type ReservationRequestModalProps = {
  open: boolean
  onClose: () => void
  requestKind: "reservation" | "catalogue"
  category?: "reconversion" | "ponctuelle" | "certification"
  trackName: string
  formationTitle: string
  packType?: "full" | "mini"
  packTag?: string
}

export function ReservationRequestModal({
  open,
  onClose,
  requestKind,
  category = "reconversion",
  trackName,
  formationTitle,
  packType,
  packTag,
}: ReservationRequestModalProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_PHONE_COUNTRY)
  const [sending, setSending] = useState(false)
  const phoneCountryOptions = getPhoneCountryOptions("fr")

  const categoryLabel =
    category === "ponctuelle"
      ? "Formation ponctuelle"
      : category === "certification"
        ? "Catégorie certification"
        : "Parcours"
  const itemLabel = category === "ponctuelle" ? "Module" : category === "certification" ? "Certification" : "Pack"

  if (!open) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(92vw,560px)] rounded-xl border border-gray-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h4 className="text-sm font-semibold text-[#1e3a5f]">
          {requestKind === "catalogue" ? "Demander le catalogue" : "Réserver une place"}
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="rounded-lg border border-[#d6e6f7] bg-[#f7fbff] px-3 py-2 text-xs text-[#1e3a5f]">
          <p>
            <span className="font-semibold">{categoryLabel}:</span> {trackName}
          </p>
          <p>
            <span className="font-semibold">{itemLabel}:</span> {formationTitle}
            {packType ? ` (${packType === "full" ? "Full" : "Mini"})` : ""}
          </p>
          {packTag ? (
            <p>
              <span className="font-semibold">Tag:</span> {packTag}
            </p>
          ) : null}
        </div>

        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nom complet"
          autoComplete="name"
        />
        <Input
          value={email}
          onChange={(e) => {
            const nextEmail = e.target.value
            setEmail(nextEmail)
            if (emailTouched) setEmailError(validateEmailStructure(nextEmail))
          }}
          onBlur={() => {
            setEmailTouched(true)
            setEmailError(validateEmailStructure(email))
          }}
          placeholder="Email"
          type="email"
          autoComplete="email"
        />
        {emailTouched && emailError ? <p className="-mt-1 text-xs text-red-600">{emailError}</p> : null}
        <div className="flex gap-2">
          <select
            aria-label="Pays"
            value={phoneCountry}
            onChange={(e) => setPhoneCountry(e.target.value as CountryCode)}
            className="h-10 w-[45%] rounded-md border border-input bg-background px-2 text-sm"
            disabled={sending}
          >
            {phoneCountryOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
          <Input
            value={phone}
            onChange={(e) => {
              const nextPhone = e.target.value
              setPhone(nextPhone)
              const detected = detectPhoneCountry(nextPhone, phoneCountry)
              if (detected) setPhoneCountry(detected)
              if (phoneTouched) {
                setPhoneError(
                  validatePhoneStructure(nextPhone, { defaultCountry: detected || phoneCountry }),
                )
              }
            }}
            onBlur={() => {
              setPhoneTouched(true)
              setPhoneError(validatePhoneStructure(phone, { defaultCountry: phoneCountry }))
            }}
            placeholder="Numéro de téléphone"
            type="tel"
            autoComplete="tel"
            className="w-[55%]"
          />
        </div>
        {phoneTouched && phoneError ? <p className="-mt-1 text-xs text-red-600">{phoneError}</p> : null}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-3">
        <button
          type="button"
          onClick={async () => {
            const n = fullName.trim()
            const e = email.trim()
            const p = phone.trim()
            const currentEmailError = validateEmailStructure(e)
            const currentPhoneError = validatePhoneStructure(p, {
              defaultCountry: phoneCountry,
            })
            setEmailTouched(true)
            setEmailError(currentEmailError)
            setPhoneTouched(true)
            setPhoneError(currentPhoneError)
            if (!n || !e || !p) {
              toast.error("Merci de remplir nom, email et numéro de téléphone.")
              return
            }
            if (currentEmailError) {
              toast.error(currentEmailError)
              return
            }
            if (currentPhoneError) {
              toast.error(currentPhoneError)
              return
            }
            setSending(true)
            try {
              const res = await fetch("/api/formation/reservation-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  requestKind,
                  category,
                  trackName,
                  formationTitle,
                  packType,
                  packTag,
                  fullName: n,
                  email: e,
                  phone: p,
                }),
              })
              const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
              if (!res.ok || !data.ok) {
                toast.error(data.error || "Envoi impossible.")
                return
              }
              toast.success(
                requestKind === "catalogue"
                  ? "Demande de catalogue envoyée avec succès."
                  : "Demande envoyée avec succès.",
              )
              setFullName("")
              setEmail("")
              setPhone("")
              setEmailTouched(false)
              setEmailError(null)
              setPhoneTouched(false)
              setPhoneError(null)
              setPhoneCountry(DEFAULT_PHONE_COUNTRY)
              onClose()
            } catch {
              toast.error("Erreur réseau pendant l'envoi.")
            } finally {
              setSending(false)
            }
          }}
          disabled={sending}
          className="rounded-full bg-[#1e4b8e] px-4 py-2 text-sm text-white hover:bg-[#163a6e] disabled:opacity-60"
        >
          {sending ? "Envoi..." : "Envoyer"}
        </button>
      </div>
    </div>
  )
}
