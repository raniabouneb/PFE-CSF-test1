import nodemailer from "nodemailer"
import { z } from "zod"
import { escapeHtml } from "@/lib/email/escape-html"

const bodySchema = z.object({
  requestKind: z.enum(["reservation", "catalogue"]).optional().default("reservation"),
  category: z.enum(["reconversion", "ponctuelle", "certification"]),
  trackName: z.string().trim().min(2).max(200),
  formationTitle: z.string().trim().min(2).max(200),
  packType: z.enum(["full", "mini"]).optional(),
  packTag: z.string().trim().min(1).max(80).optional(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(6).max(40),
})

function recipientEmails(): string {
  const raw =
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
    // ignore malformed JSON bodies
  }
  return raw.length > 400 ? `${raw.slice(0, 400)}...` : raw
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
    const msg = parsed.error.issues[0]?.message ?? "Donnees invalides."
    return Response.json({ ok: false, error: msg }, { status: 400 })
  }

  const to = recipientEmails()
  if (!to) {
    return Response.json({ ok: false, error: "Aucune adresse destinataire configuree." }, { status: 500 })
  }

  const { requestKind, category, trackName, formationTitle, packType, packTag, fullName, email, phone } =
    parsed.data
  const subjectPrefix = requestKind === "catalogue" ? "[CSF] Demande catalogue" : "[CSF] Reservation place"
  const categoryLabel =
    category === "ponctuelle"
      ? "Formation ponctuelle"
      : category === "certification"
        ? "Certification"
        : "Reconversion professionnelle"
  const requestSentence =
    category === "certification"
      ? requestKind === "catalogue"
        ? "Je souhaite recevoir le catalogue de cette certification."
        : "Je souhaite reserver une place pour cette certification."
      : requestKind === "catalogue"
        ? "Je souhaite recevoir le catalogue de cette formation."
        : "Je souhaite reserver une place pour cette formation."
  const itemLabel = category === "ponctuelle" ? "Module" : category === "certification" ? "Certification" : "Pack"
  const packLabel =
    packType != null ? ` (${packType === "full" ? "Full" : "Mini"})` : ""
  const subjectParts = [
    subjectPrefix,
    `${category === "ponctuelle" ? "Formation" : category === "certification" ? "Categorie" : "Parcours"}: ${trackName}`,
    `${itemLabel}: ${formationTitle}${packLabel}`,
    packTag ? `Tag: ${packTag}` : null,
  ].filter(Boolean)
  const subject = subjectParts.join(" - ")

  const body = [
    "Bonjour equipe CSF,",
    "",
    requestSentence,
    "",
    `Categorie: ${categoryLabel}`,
    `${
      category === "ponctuelle"
        ? "Formation ponctuelle"
        : category === "certification"
          ? "Categorie certification"
          : "Nom reconversion/formation"
    }: ${trackName}`,
    `${itemLabel} choisi: ${formationTitle}${packLabel}`,
    ...(packTag ? [`Tag ${itemLabel.toLowerCase()}: ${packTag}`] : []),
    "",
    `Nom: ${fullName}`,
    `Email: ${email}`,
    `Telephone: ${phone}`,
    "",
    "Merci de me recontacter pour finaliser l'inscription.",
  ].join("\n")

  const safe = {
    categoryLabel: escapeHtml(categoryLabel),
    itemLabel: escapeHtml(itemLabel),
    trackName: escapeHtml(trackName),
    formationTitle: escapeHtml(formationTitle),
    packType: packType === "full" ? "Full" : packType === "mini" ? "Mini" : "",
    packTag: packTag ? escapeHtml(packTag) : "",
    fullName: escapeHtml(fullName),
    email: escapeHtml(email),
    phone: escapeHtml(phone),
    requestSentence: escapeHtml(requestSentence),
    trackLabel:
      category === "ponctuelle"
        ? "Formation ponctuelle"
        : category === "certification"
          ? "Categorie certification"
          : "Parcours",
  }
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">
<p><strong>Nouvelle demande ${safe.categoryLabel}</strong> depuis le site CSF.</p>
<p>${safe.requestSentence}</p>
<table style="border-collapse:collapse;max-width:620px">
<tr><td style="padding:6px 12px 6px 0;vertical-align:top"><strong>${safe.trackLabel}</strong></td><td style="padding:6px 0">${safe.trackName}</td></tr>
<tr><td style="padding:6px 12px 6px 0;vertical-align:top"><strong>${safe.itemLabel}</strong></td><td style="padding:6px 0">${safe.formationTitle}${safe.packType ? ` (${safe.packType})` : ""}</td></tr>
${safe.packTag ? `<tr><td style="padding:6px 12px 6px 0;vertical-align:top"><strong>Tag</strong></td><td style="padding:6px 0">${safe.packTag}</td></tr>` : ""}
<tr><td style="padding:6px 12px 6px 0;vertical-align:top"><strong>Nom</strong></td><td style="padding:6px 0">${safe.fullName}</td></tr>
<tr><td style="padding:6px 12px 6px 0;vertical-align:top"><strong>Email</strong></td><td style="padding:6px 0"><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
<tr><td style="padding:6px 12px 6px 0;vertical-align:top"><strong>Telephone</strong></td><td style="padding:6px 0">${safe.phone}</td></tr>
</table>
</body></html>`

  try {
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
          to: to.split(","),
          subject,
          text: body,
          html,
          reply_to: email,
        }),
      })
      if (!res.ok) {
        const raw = await res.text()
        const detail = parseResendErrorBody(raw)
        throw new Error(`Resend ${res.status}: ${detail}`)
      }
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
      to,
      subject,
      text: body,
      html,
      replyTo: email,
    })

    return Response.json({ ok: true })
  } catch (e) {
    console.error("[reservation-request] provider error:", e)
    return Response.json({ ok: false, error: "Envoi email echoue." }, { status: 502 })
  }
}
