"use client"

import { useMemo, useState, type ReactNode } from "react"
import { CheckCircle2, Mail, MessageCircle, Plus, Trash2, Loader2, CalendarDays, Link2, Unlink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ADMIN_DASHBOARD_CARD_CLASS, ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS, ADMIN_DASHBOARD_CARD_TITLE_CLASS } from "@/lib/admin/dashboard-card-styles"
import type { BrainReminderState, DailyNotificationDigest, ReminderRule, GCalStatus } from "@/lib/admin/planning-api"
import { REMINDER_PRESET_HOURS, digestIndicator, parseISODateLocal } from "@/lib/admin/planning-mock"
import { cn } from "@/lib/utils"
/* â”€â”€ Sidebar: Google Calendar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function GoogleCalendarCard({
  status,
  loading,
  connecting,
  onConnect,
  onDisconnect,
}: {
  status: GCalStatus
  loading: boolean
  connecting: boolean
  onConnect: () => void | Promise<void>
  onDisconnect: () => void | Promise<void>
}) {
  return (
    <section className={ADMIN_DASHBOARD_CARD_CLASS}>
      <header className="border-b border-neutral-200/60 pb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#0D3570]" aria-hidden />
          <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Google Calendar</h3>
        </div>
        <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
          Agenda Google intégré : création d&apos;événements, invitations, rappels, vues.
        </p>
      </header>

      <div className="mt-5">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : !status.configured ? (
          <p className="text-sm text-amber-700">
            Clés Google manquantes côté serveur (GOOGLE_CLIENT_ID / SECRET).
          </p>
        ) : status.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span className="text-sm font-medium text-emerald-800">Connecté</span>
            </div>
            <p className="text-xs text-neutral-500">
              Utilisez l&apos;agenda à gauche : clic sur un créneau pour créer un événement, inviter des
              participants, configurer des rappels, changer de vue (mois, semaine, jour).
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full text-sm"
              onClick={() => void onDisconnect()}
            >
              <Unlink className="mr-1.5 h-4 w-4" />
              Déconnecter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">
              Vous pouvez connecter n&apos;importe quel Gmail du centre (admin). En mode test Google,
              chaque compte doit être ajouté comme utilisateur test.
            </p>
            {status.redirectUri ? (
              <details className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-[11px] leading-snug text-neutral-700">
                <summary className="cursor-pointer font-medium text-neutral-800">
                  Config Google Cloud (si redirect_uri_mismatch)
                </summary>
                <p className="mt-2">
                  Authorized redirect URIs — doit être <strong>identique</strong> à :
                </p>
                <code className="mt-1 block break-all font-mono text-[10px] text-[#0D3570]">
                  {status.redirectUri}
                </code>
                <p className="mt-2 text-neutral-500">
                  Puis enregistrer, attendre 1–2 min et redémarrer le backend.
                </p>
              </details>
            ) : null}
            <Button
              type="button"
              className="h-9 w-full bg-[#0D3570] text-sm font-semibold hover:bg-[#0a2d5c]"
              disabled={connecting}
              onClick={() => void onConnect()}
            >
              {connecting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-1.5 h-4 w-4" />
              )}
              Connecter Google Calendar
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

/* â”€â”€ Sidebar: Statut des envois â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function StatutEnvoisCard({
  digest,
  variant,
}: {
  digest: DailyNotificationDigest
  variant: ReturnType<typeof digestIndicator>
}) {
  const jourLabel = useMemo(
    () =>
      parseISODateLocal(digest.dateISO).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [digest.dateISO],
  )

  const pct =
    digest.expectedRuns === 0
      ? 100
      : Math.min(100, Math.round((digest.completedRuns / digest.expectedRuns) * 100))

  const ok = variant === "success"
  const footerOk = ok && digest.failedRuns === 0

  return (
    <section className={ADMIN_DASHBOARD_CARD_CLASS}>
      <header className="flex items-start justify-between gap-3 border-b border-neutral-200/60 pb-4">
        <div className="min-w-0">
          <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Statut des envois</h3>
          <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>JournÃ©e du {jourLabel}</p>
        </div>
        {ok ? (
          <CheckCircle2 className="size-9 shrink-0 text-emerald-500" aria-hidden />
        ) : (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-lg font-bold",
              variant === "danger" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700",
            )}
          >
            {pct}%
          </span>
        )}
      </header>

      <div className="mt-5 flex items-end gap-2">
        {ok ? (
          <span className="font-mono text-4xl font-bold tracking-tight text-emerald-600">{pct}%</span>
        ) : (
          <span className="font-mono text-4xl font-bold tracking-tight text-[#0f172a]">{pct}%</span>
        )}
      </div>
      <p className="mt-1 text-sm font-medium text-neutral-700">
        {digest.completedRuns} / {digest.expectedRuns} envoyÃ©s
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-neutral-200/60 bg-white px-3 py-2.5 shadow-sm">
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            footerOk ? "bg-emerald-500" : variant === "danger" ? "bg-red-500" : "bg-amber-500",
          )}
          aria-hidden
        />
        <p className="text-xs font-medium leading-snug text-neutral-600">
          {footerOk
            ? "SystÃ¨me automatisÃ© actif et fonctionnel"
            : variant === "danger"
              ? "Des envois ont Ã©chouÃ© â€” vÃ©rifiez les journaux."
              : "Certains envois sont encore en cours ou en erreur."}
        </p>
      </div>
    </section>
  )
}

/* â”€â”€ Sidebar: Le Cerveau â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function LeCerveauCard({
  brain,
  onChange,
  onSave,
}: {
  brain: BrainReminderState
  onChange: (b: BrainReminderState) => void
  onSave: (rules: ReminderRule[]) => Promise<void>
}) {
  const updateRule = (id: string, patch: Partial<ReminderRule>) => {
    onChange({
      rules: brain.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })
  }

  const addRule = () => {
    const next: ReminderRule = {
      id: `rule-${Date.now()}`,
      label: "Nouvelle rÃ¨gle",
      enabled: true,
      hoursBefore: 12,
      channels: { email: true, sms: false },
    }
    onChange({ rules: [...brain.rules, next] })
  }

  const removeRule = (id: string) => {
    if (brain.rules.length <= 1) {
      toast.error("Au moins une rÃ¨gle de rappel est nÃ©cessaire.")
      return
    }
    onChange({ rules: brain.rules.filter((r) => r.id !== id) })
    toast.success("RÃ¨gle supprimÃ©e")
  }

  return (
    <section className={ADMIN_DASHBOARD_CARD_CLASS}>
      <header className="border-b border-neutral-200/60 pb-4">
        <h3 className={ADMIN_DASHBOARD_CARD_TITLE_CLASS}>Le Cerveau</h3>
        <p className={ADMIN_DASHBOARD_CARD_SUBTITLE_CLASS}>
          DÃ©finissez quand les apprenants recevront des notifications pour leurs sÃ©ances.
        </p>
      </header>

      <ul className="mt-5 space-y-3">
        {brain.rules.map((rule) => (
          <li
            key={rule.id}
            className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <ReminderToggle
                  pressed={rule.enabled}
                  onPressedChange={(enabled) => updateRule(rule.id, { enabled })}
                />
                <span className="min-w-0 flex-1 text-sm font-medium text-[#0f172a]">{rule.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="min-w-[9.5rem] rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-[#334155] shadow-sm outline-none focus:border-[#0D3570] focus:ring-2 focus:ring-[#0D3570]/20"
                  value={rule.hoursBefore}
                  disabled={!rule.enabled}
                  onChange={(e) =>
                    updateRule(rule.id, { hoursBefore: Number(e.target.value) })
                  }
                >
                  {REMINDER_PRESET_HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h === 1 ? "1 heure avant" : `${h} heures avant`}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <ChannelToggle
                    active={rule.channels.email}
                    disabled={!rule.enabled}
                    icon={<Mail className="size-4" />}
                    label="E-mail"
                    onClick={() =>
                      updateRule(rule.id, {
                        channels: { ...rule.channels, email: !rule.channels.email },
                      })
                    }
                  />
                  <ChannelToggle
                    active={rule.channels.sms}
                    disabled={!rule.enabled}
                    icon={<MessageCircle className="size-4" />}
                    label="SMS / Message"
                    onClick={() =>
                      updateRule(rule.id, {
                        channels: { ...rule.channels, sms: !rule.channels.sms },
                      })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ms-auto shrink-0 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Supprimer la rÃ¨gle Â« ${rule.label} Â»`}
                  onClick={() => removeRule(rule.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addRule}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white py-2.5 text-xs font-semibold text-[#0D3570] transition-colors hover:border-[#0D3570]/35 hover:bg-[#0D3570]/[0.04]"
      >
        <Plus className="size-4" aria-hidden />
        Ajouter une rÃ¨gle de rappel
      </button>

      <Button
        type="button"
        className="mt-5 h-10 w-full bg-[#0D3570] text-sm font-semibold shadow-sm hover:bg-[#0a2d5c]"
        onClick={() => void onSave(brain.rules)}
      >
        Enregistrer les modifications
      </Button>
    </section>
  )
}

/* â”€â”€ Small toggle components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function ReminderToggle({
  pressed,
  onPressedChange,
}: {
  pressed: boolean
  onPressedChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D3570]",
        pressed ? "bg-emerald-500" : "bg-neutral-300",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-1 left-1 size-5 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-200",
          pressed ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  )
}

function ChannelToggle({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean
  disabled?: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg border transition-colors",
        disabled && "opacity-40",
        active
          ? "border-[#0D3570]/35 bg-[#0D3570]/10 text-[#0D3570]"
          : "border-neutral-200 bg-white text-neutral-400 hover:text-neutral-600",
      )}
    >
      {icon}
    </button>
  )
}
