import nodemailer from "nodemailer"
import { z } from "zod"

const bodySchema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(200),
  email: z.string().trim().email("Email invalide").max(254),
  telephone: z.string().trim().max(50).optional().default(""),
  entreprise: z.string().trim().max(200).optional().default(""),
  besoin: z.string().trim().min(10, "Décrivez votre besoin (au moins quelques mots)").max(8000),
  approche: z.enum(["module_existant", "nouveau_ou_libre"]).optional().default("nouveau_ou_libre"),
  ponctuelleFormationTitle: z.string().trim().max(200).optional().default(""),
  ponctuelleModuleTitle: z.string().trim().max(200).optional().default(""),
  besoinsPredefinis: z.array(z.string().trim().min(1).max(120)).max(20).optional().default([]),
  detailsCustomisation: z.string().trim().max(4000).optional().default(""),
})

function recipientEmails(): string[] {
  const raw =
    process.env.PARCOURS_DEMANDE_TO?.trim() ||
    process.env.CONTACT_EMAIL?.trim() ||
    "formation@csfgroupe.tn"
    
  return raw
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean)
}

function buildMailBody(input: {
  nom: string
  email: string
  telephone: string
  besoin: string
  approche: "module_existant" | "nouveau_ou_libre"
  ponctuelleFormationTitle: string
  ponctuelleModuleTitle: string
  detailsCustomisation: string
}): string {
  const profile = [`Nom: ${input.nom}`, `Email: ${input.email}`, `Téléphone: ${input.telephone || "-"}`]
  if (input.approche === "module_existant") {
    const selected = [
      `Formation: ${input.ponctuelleFormationTitle || "-"}`,
      `Module: ${input.ponctuelleModuleTitle || "-"}`,
    ]
    return [
      "Demande parcours sur mesure — modification d'un module existant",
      "",
      ...profile,
      "",
      ...selected,
      "",
      "Modifications demandées:",
      input.detailsCustomisation || "-",
    ].join("\n")
  }
  return [
    "Demande parcours sur mesure — nouveau module / besoin libre",
    "",
    ...profile,
    "",
    "Besoin:",
    input.besoin || "-",
  ].join("\n")
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

  const {
    nom,
    email,
    telephone,
    besoin,
    approche,
    ponctuelleFormationTitle,
    ponctuelleModuleTitle,
    detailsCustomisation,
  } = parsed.data
  const to = recipientEmails()
  if (to.length === 0) {
    return Response.json(
      { ok: false, error: "Aucune adresse destinataire (PARCOURS_DEMANDE_TO)." },
      { status: 500 },
    )
  }
  const formationSubject = ponctuelleFormationTitle.trim()
  const moduleSubject = ponctuelleModuleTitle.trim()
  const subjectTail =
    approche === "module_existant"
      ? [
          formationSubject ? `Formation: ${formationSubject}` : "",
          moduleSubject ? `Module: ${moduleSubject}` : "",
        ]
          .filter(Boolean)
          .join(" | ") || "Formation/Module non précisés"
      : "demande libre"
  const subject = `[CSF] Parcours sur mesure - ${nom} - ${subjectTail}`
  const body = buildMailBody({
    nom,
    email,
    telephone,
    besoin,
    approche,
    ponctuelleFormationTitle,
    ponctuelleModuleTitle,
    detailsCustomisation,
  })

  const cfg = smtpConfig()
  if (!cfg.host || !cfg.user || !cfg.pass || !cfg.from || !Number.isFinite(cfg.port)) {
    return Response.json(
      {
        ok: false,
        error: "Configuration SMTP manquante (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).",
      },
      { status: 503 },
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
      to: to.join(","),
      subject,
      text: body,
      replyTo: email,
    })
    return Response.json({ ok: true })
  } catch (e) {
    console.error("[parcours-demande] SMTP error:", e)
    return Response.json({ ok: false, error: "Envoi email échoué." }, { status: 502 })
  }
}
