import nodemailer from "nodemailer"
import { Buffer } from "node:buffer"

/** Erreur métier pour réponses HTTP (503 config, 502 fournisseur, etc.). */
export class SiteMailError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "SiteMailError"
    this.status = status
  }
}

export function isSiteMailError(e: unknown): e is SiteMailError {
  return e instanceof SiteMailError
}

/** Destinataires des demandes pôle / contact (priorité explicite puis fallback formation). */
export function siteContactRecipients(): string {
  const raw =
    process.env.POLE_DEMANDE_TO?.trim() ||
    process.env.PARCOURS_DEMANDE_TO?.trim() ||
    process.env.CONTACT_EMAIL?.trim() ||
    "contact@csf.tn"
  return raw
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean)
    .join(",")
}

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim()
  const port = Number(process.env.SMTP_PORT || "587")
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()
  const from = process.env.SMTP_FROM?.trim() || user
  const secure = (process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465

  return { host, port, user, pass, from, secure }
}

function fromAddress(): string {
  return process.env.RESEND_FROM?.trim() || process.env.SMTP_FROM?.trim() || "CSF <onboarding@resend.dev>"
}

function parseResendErrorBody(raw: string): string {
  try {
    const j = JSON.parse(raw) as {
      message?: string | string[]
      errors?: Array<{ message?: string }>
    }
    if (Array.isArray(j.message)) return j.message.join(" - ")
    if (typeof j.message === "string") return j.message
    if (j.errors?.length) {
      return j.errors
        .map((e) => e.message)
        .filter(Boolean)
        .join(" - ")
    }
  } catch {
    // ignore
  }
  return raw.length > 400 ? `${raw.slice(0, 400)}...` : raw
}

/**
 * Envoie un mail côté serveur (Resend si `RESEND_API_KEY`, sinon SMTP).
 * `replyTo` : email du visiteur pour répondre directement depuis la boîte CSF.
 */
export async function sendSiteMail(input: {
  subject: string
  text: string
  html: string
  replyTo: string
  attachments?: Array<{
    filename: string
    content: Uint8Array
    contentType?: string
  }>
}): Promise<void> {
  const to = siteContactRecipients()
  if (!to) {
    throw new SiteMailError(500, "Aucune adresse destinataire configurée.")
  }

  const resendKey = process.env.RESEND_API_KEY?.trim()
  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: to.split(",").map((e) => e.trim()).filter(Boolean),
        subject: input.subject,
        text: input.text,
        html: input.html,
        reply_to: input.replyTo,
        attachments: (input.attachments ?? []).map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content).toString("base64"),
          content_type: a.contentType || "application/octet-stream",
        })),
      }),
    })
    if (!res.ok) {
      const raw = await res.text()
      const detail = parseResendErrorBody(raw)
      throw new SiteMailError(502, `Envoi email échoué : ${detail}`)
    }
    return
  }

  const cfg = smtpConfig()
  if (!cfg.host || !cfg.user || !cfg.pass || !cfg.from || !Number.isFinite(cfg.port)) {
    throw new SiteMailError(
      503,
      "Configuration email manquante : définissez RESEND_API_KEY (recommandé) ou SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS et SMTP_FROM.",
    )
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    })

    await transporter.sendMail({
      from: cfg.from,
      to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
      attachments: (input.attachments ?? []).map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content),
        contentType: a.contentType,
      })),
    })
  } catch (e) {
    console.error("[send-site-mail] SMTP error:", e)
    throw new SiteMailError(502, "Envoi email échoué.")
  }
}
