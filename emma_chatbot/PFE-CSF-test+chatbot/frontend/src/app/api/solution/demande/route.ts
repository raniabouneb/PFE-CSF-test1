import { NextResponse } from "next/server"
import { escapeHtml } from "@/lib/email/escape-html"
import { isSiteMailError, sendSiteMail } from "@/lib/email/send-site-mail"

type Body = {
  nom?: string
  prenom?: string
  email?: string
  telephone?: string
  entreprise?: string | null
  poste?: string | null
  /** Description projet / besoin (formulaire aligné page Conseil) */
  descriptionProjet?: string | null
  titreSolution?: string
  typeSolution?: string
  technologies?: string | null
  piecesJointes?: string[]
  phaseProjet?: string
  delaiSouhaite?: string | null
  nombreUtilisateursFinaux?: string | null
}

type MailAttachment = {
  filename: string
  content: Uint8Array
  contentType?: string
}

const TYPE_SOLUTION_LABEL: Record<string, string> = {
  "systemes-embarques": "Systèmes Embarqués",
  "test-logiciel": "Test Logiciel",
  metier: "Application Métier",
  portail: "Portail / Plateforme Web",
  "supervision-data": "Supervision & Data",
}

const PHASE_LABEL: Record<string, string> = {
  ideation: "Idéation / cadrage",
  conception: "Conception",
  dev: "Développement en cours",
  recette: "Recette / mise en production",
  maintenance: "Maintenance / évolution",
  autre: "Autre",
}

const DELAI_LABEL: Record<string, string> = {
  urgent: "Urgent (< 1 mois)",
  "1-3m": "1 à 3 mois",
  "3-6m": "3 à 6 mois",
  "6m+": "6 mois et plus",
  undef: "Non défini pour l’instant",
}

const NB_USERS_LABEL: Record<string, string> = {
  "1-100": "1 – 100",
  "100-1000": "100 – 1 000",
  "1000-10000": "1 000 – 10 000",
  "10000+": "10 000+",
  na: "Non applicable",
}

function lbl(map: Record<string, string>, key: string | null | undefined): string {
  const k = (key ?? "").trim()
  return k ? (map[k] ?? k) : "—"
}

function buildMailParts(input: {
  nom: string
  prenom: string
  email: string
  telephone: string
  entreprise: string | null
  poste: string | null
  descriptionProjet: string | null
  titreSolution: string
  typeSolution: string
  technologies: string | null
  piecesJointes: string[]
  phaseProjet: string
  delaiSouhaite: string | null
  nombreUtilisateursFinaux: string | null
}) {
  const fullName = `${input.prenom} ${input.nom}`.trim()
  const entrepriseLine = input.entreprise?.trim() || "—"
  const posteLine = input.poste?.trim() || "—"
  const descriptionLine =
    input.descriptionProjet?.trim() && input.descriptionProjet.trim().length > 0
      ? input.descriptionProjet.trim()
      : "—"

  const subject = `[CSF] demande de solution - ${input.titreSolution}`
  const text = [
    "Nouvelle demande depuis le site — Pôle Solution.",
    "",
    `Titre de la solution : ${input.titreSolution}`,
    "",
    `Nom : ${fullName}`,
    `Email : ${input.email}`,
    `Téléphone : ${input.telephone}`,
    `Entreprise : ${entrepriseLine}`,
    `Poste : ${posteLine}`,
    "",
    "Description du besoin :",
    descriptionLine,
    "",
    `Type de solution : ${lbl(TYPE_SOLUTION_LABEL, input.typeSolution)}`,
    `Technologies : ${input.technologies?.trim() || "—"}`,
    `Pièces jointes : ${input.piecesJointes.length > 0 ? input.piecesJointes.join(", ") : "—"}`,
    `Phase du projet : ${lbl(PHASE_LABEL, input.phaseProjet)}`,
    `Délai souhaité : ${lbl(DELAI_LABEL, input.delaiSouhaite)}`,
    `Nombre d'utilisateurs finaux visés : ${lbl(NB_USERS_LABEL, input.nombreUtilisateursFinaux)}`,
  ].join("\n")

  const safeEmailHref = encodeURIComponent(input.email)
  const rows: [string, string][] = [
    ["Titre de la solution", input.titreSolution],
    ["Nom complet", fullName],
    ["Email", input.email],
    ["Téléphone", input.telephone],
    ["Entreprise", entrepriseLine],
    ["Poste", posteLine],
    ["Description du besoin", descriptionLine],
    ["Type de solution", lbl(TYPE_SOLUTION_LABEL, input.typeSolution)],
    ["Technologies", input.technologies?.trim() || ""],
    ["Pièces jointes", input.piecesJointes.length > 0 ? input.piecesJointes.join(", ") : ""],
    ["Phase du projet", lbl(PHASE_LABEL, input.phaseProjet)],
    ["Délai souhaité", lbl(DELAI_LABEL, input.delaiSouhaite)],
    ["Utilisateurs finaux visés", lbl(NB_USERS_LABEL, input.nombreUtilisateursFinaux)],
  ]

  const tableRows = rows
    .map(
      ([label, val]) =>
        `<tr><td style="padding:6px 12px 6px 0;vertical-align:top"><strong>${escapeHtml(label)}</strong></td><td style="padding:6px 0;white-space:pre-wrap;font-size:14px">${
          label === "Email"
            ? `<a href="mailto:${safeEmailHref}">${escapeHtml(val || "—")}</a>`
            : label === "Description du besoin"
              ? escapeHtml(val.trim() || "—").replace(/\r?\n/g, "<br>")
              : escapeHtml(val.trim() || "—")
        }</td></tr>`,
    )
    .join("")

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">
<p><strong>Nouvelle demande — Pôle Solution</strong></p>
<table style="border-collapse:collapse;max-width:620px">${tableRows}</table>
</body></html>`

  return { subject, text, html }
}

/** Réception des demandes Pôle Solution + envoi par email (Resend ou SMTP). */
export async function POST(req: Request) {
  try {
    let body: Body = {}
    let attachments: MailAttachment[] = []
    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData()
      const read = (k: string) => {
        const v = fd.get(k)
        return typeof v === "string" ? v.trim() : ""
      }
      body = {
        nom: read("nom"),
        prenom: read("prenom"),
        email: read("email"),
        telephone: read("telephone"),
        entreprise: read("entreprise") || null,
        poste: read("poste") || null,
        descriptionProjet: read("descriptionProjet") || null,
        titreSolution: read("titreSolution"),
        typeSolution: read("typeSolution"),
        technologies: read("technologies") || null,
        phaseProjet: read("phaseProjet"),
        delaiSouhaite: read("delaiSouhaite") || null,
        nombreUtilisateursFinaux: read("nombreUtilisateursFinaux") || null,
      }
      const fileEntries = fd.getAll("piecesJointes")
      attachments = (
        await Promise.all(
          fileEntries.map(async (entry) => {
            if (!(entry instanceof File)) return null
            if (!entry.name || entry.size <= 0) return null
            const ab = await entry.arrayBuffer()
            return {
              filename: entry.name,
              content: new Uint8Array(ab),
              contentType: entry.type || "application/octet-stream",
            } satisfies MailAttachment
          }),
        )
      ).filter((x): x is MailAttachment => x != null)
    } else {
      body = (await req.json()) as Body
    }

    const email = (body.email ?? "").trim()
    const nom = (body.nom ?? "").trim()
    const prenom = (body.prenom ?? "").trim()
    const tel = (body.telephone ?? "").trim()
    const entrepriseRaw = body.entreprise != null ? String(body.entreprise).trim() : ""
    const posteRaw = body.poste != null ? String(body.poste).trim() : ""
    const entreprise = entrepriseRaw.length > 0 ? entrepriseRaw : null
    const poste = posteRaw.length > 0 ? posteRaw : null
    const descriptionProjet = (body.descriptionProjet ?? "").trim()
    const titreSolution = (body.titreSolution ?? "").trim()
    const typeSolution = (body.typeSolution ?? "").trim()
    const phaseProjet = (body.phaseProjet ?? "").trim()

    if (!email || !nom || !prenom || !tel) {
      return NextResponse.json(
        { ok: false, detail: "Nom, prénom, email et téléphone sont obligatoires." },
        { status: 400 },
      )
    }
    if (!descriptionProjet) {
      return NextResponse.json({ ok: false, detail: "La description du besoin est obligatoire." }, { status: 400 })
    }
    if (!titreSolution) {
      return NextResponse.json({ ok: false, detail: "Le titre de la solution est obligatoire." }, { status: 400 })
    }
    if (!typeSolution || !phaseProjet) {
      return NextResponse.json(
        { ok: false, detail: "Type de solution et phase du projet sont requis." },
        { status: 400 },
      )
    }

    const { subject, text, html } = buildMailParts({
      nom,
      prenom,
      email,
      telephone: tel,
      entreprise,
      poste,
      descriptionProjet,
      titreSolution,
      typeSolution,
      technologies: body.technologies?.trim() || null,
      piecesJointes: Array.isArray(body.piecesJointes) ? body.piecesJointes.map((x) => String(x)) : [],
      phaseProjet,
      delaiSouhaite: body.delaiSouhaite?.trim() || null,
      nombreUtilisateursFinaux: body.nombreUtilisateursFinaux?.trim() || null,
    })

    try {
      await sendSiteMail({ subject, text, html, replyTo: email, attachments })
    } catch (e) {
      if (isSiteMailError(e)) {
        console.error("[solution/demande]", e.message)
        return NextResponse.json({ ok: false, detail: e.message }, { status: e.status })
      }
      console.error("[solution/demande] unexpected:", e)
      return NextResponse.json({ ok: false, detail: "Envoi impossible." }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, detail: "Corps invalide." }, { status: 400 })
  }
}
