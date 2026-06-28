"use client"

import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { validateEmailStructure } from "@/lib/validation/email"
import {
  DEFAULT_PHONE_COUNTRY,
  detectPhoneCountry,
  getPhoneCountryOptions,
  validatePhoneStructure,
} from "@/lib/validation/phone"
import type { CountryCode } from "libphonenumber-js/min"

function FormFieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-[#1e3a5f]">
      {children}
      {required ? (
        <>
          <span className="text-red-600" aria-hidden>
            {" "}
            *
          </span>
          <span className="sr-only"> (obligatoire)</span>
        </>
      ) : null}
    </label>
  )
}

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
  const [comment, setComment] = useState("")
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

        <div>
          <FormFieldLabel htmlFor="reservation-full-name" required>
            Nom complet
          </FormFieldLabel>
          <Input
            id="reservation-full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Votre nom et prénom"
            autoComplete="name"
            disabled={sending}
          />
        </div>
        <div>
          <FormFieldLabel htmlFor="reservation-email" required>
            Email
          </FormFieldLabel>
          <Input
            id="reservation-email"
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
            placeholder="vous@exemple.com"
            type="email"
            autoComplete="email"
            disabled={sending}
            aria-invalid={emailTouched && !!emailError}
          />
          {emailTouched && emailError ? <p className="mt-1 text-xs text-red-600">{emailError}</p> : null}
        </div>
        <div>
          <FormFieldLabel required>Téléphone</FormFieldLabel>
          <div className="flex gap-2">
          <select
            aria-label="Indicatif pays"
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
            id="reservation-phone"
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
            disabled={sending}
            aria-invalid={phoneTouched && !!phoneError}
          />
          </div>
          {phoneTouched && phoneError ? <p className="mt-1 text-xs text-red-600">{phoneError}</p> : null}
        </div>
        <div>
          <FormFieldLabel htmlFor="reservation-comment">Commentaire</FormFieldLabel>
          <Textarea
            id="reservation-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Si vous souhaitez nous laisser un message… (facultatif)"
            rows={3}
            maxLength={500}
            disabled={sending}
            className="min-h-[4.5rem] resize-y"
          />
        </div>
        <p className="text-[11px] text-gray-500">
          <span className="text-red-600" aria-hidden>
            *
          </span>{" "}
          Champs obligatoires
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-3">
        <button
          type="button"
          onClick={async () => {
            const n = fullName.trim()
            const e = email.trim()
            const p = phone.trim()
            const c = comment.trim()
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
                  ...(c ? { comment: c } : {}),
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
              setComment("")
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
