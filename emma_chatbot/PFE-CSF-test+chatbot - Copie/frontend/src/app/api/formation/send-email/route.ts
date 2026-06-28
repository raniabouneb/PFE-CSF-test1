import nodemailer from "nodemailer"
import { z } from "zod"
import { escapeHtml } from "@/lib/email/escape-html"

const bodySchema = z.object({
  to: z.string().trim().min(3).max(2000),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(15000),
})

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
    // ignore malformed JSON bodies
  }
  return raw.length > 400 ? `${raw.slice(0, 400)}...` : raw
}

function toHtml(text: string): string {
  return `<p style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;white-space:pre-wrap">${escapeHtml(text)}</p>`
}

async function sendWithResend(input: { to: string; subject: string; body: string }) {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return { sent: false as const, reason: "missing_key" as const }

  const to = input.to
    .split(/[,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (to.length === 0) return { sent: false as const, reason: "missing_recipient" as const }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to,
      subject: input.subject,
      text: input.body,
      html: toHtml(input.body),
    }),
  })

  if (!res.ok) {
    const raw = await res.text()
    const detail = parseResendErrorBody(raw)
    throw new Error(`Resend ${res.status}: ${detail}`)
  }

  return { sent: true as const }
}

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return Response.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides."
    return Response.json({ ok: false, error: msg }, { status: 400 })
  }

  try {
    const resendResult = await sendWithResend({
      to: parsed.data.to,
      subject: parsed.data.subject,
      body: parsed.data.body,
    })
    if (resendResult.sent) {
      return Response.json({ ok: true })
    }

    const cfg = smtpConfig()
    if (!cfg.host || !cfg.user || !cfg.pass || !cfg.from || !Number.isFinite(cfg.port)) {
      return Response.json(
        {
          ok: false,
          error:
            "Configuration email manquante: configurez RESEND_API_KEY (recommande) ou SMTP_HOST/PORT/USER/PASS/FROM.",
        },
        { status: 503 },
      )
    }

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
      to: parsed.data.to,
      subject: parsed.data.subject,
      text: parsed.data.body,
    })

    return Response.json({ ok: true })
  } catch (e) {
    console.error("[send-email] provider error:", e)
    return Response.json({ ok: false, error: "Envoi email échoué." }, { status: 502 })
  }
}
