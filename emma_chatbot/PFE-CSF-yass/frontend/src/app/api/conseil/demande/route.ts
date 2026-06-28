import { NextResponse } from "next/server"
import { escapeHtml } from "@/lib/email/escape-html"
import { conseilContactRecipients, isSiteMailError, sendSiteMail } from "@/lib/email/send-site-mail"

type Body = {
  nom?: string
  prenom?: string
  email?: string
  telephone?: string
  entreprise?: string | null
  poste?: string | null
  descriptionBesoin?: string
  titreConseil?: string
  piecesJointes?: string[]
  secteurActivite?: string | null
  typeConseil?: string | null
  tailleEquipe?: string | null
  delaiSouhaite?: string | null
}

type MailAttachment = {
  filename: string
  content: Uint8Array
  contentType?: string
}

const SECTEUR_LABEL: Record<string, string> = {
  "industrie-automatisme": "Industrie & Automatisme",
  "automobile-transport": "Automobile & Transport",
  "sante-medtech": "Santé & MedTech",
  "energie-smart-city": "Énergie & Smart City",
  "logistique-retail": "Logistique & Retail",
  autre: "Autre",
}

const TYPE_CONSEIL_LABEL: Record<string, string> = {
  "audit-technique": "Audit Technique",
  "architecture-iot-embarque": "Architecture IoT & Embarqué",
  "strategie-test-qa": "Stratégie de Test & QA",
  "developpement-full-stack": "Développement Full-Stack",
  "cybersecurite-industrielle": "Cybersécurité Industrielle",
  "prototypage-rapide-rd": "Prototypage Rapide (R&D)",
  autre: "Autre",
}

const TAILLE_LABEL: Record<string, string> = {
  "1-5": "1 à 5 personnes",
  "6-15": "6 à 15 personnes",
  "16-50": "16 à 50 personnes",
  "51-200": "51 à 200 personnes",
  "200+": "Plus de 200 personnes",
}

const DELAI_LABEL: Record<string, string> = {
  urgent: "Urgent (< 1 mois)",
  "1-3m": "1 à 3 mois",
  "3-6m": "3 à 6 mois",
  "6m+": "6 mois et plus",
  undef: "Non défini pour l’instant",
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
  descriptionBesoin: string
  titreConseil: string
  piecesJointes: string[]
  secteurActivite: string
  typeConseil: string
  tailleEquipe: string | null
  delaiSouhaite: string | null
}) {
  const fullName = `${input.prenom} ${input.nom}`.trim()
  const subject = `[CSF] demande de conseil - ${input.titreConseil}`
  const text = [
    "Nouvelle demande depuis le site — Pôle Conseil.",
    "",
    `Titre du conseil : ${input.titreConseil}`,
    "",
    `Nom : ${fullName}`,
    `Email : ${input.email}`,
    `Téléphone : ${input.telephone}`,
    `Entreprise : ${input.entreprise?.trim() || "—"}`,
    `Poste : ${input.poste?.trim() || "—"}`,
    `Pièces jointes : ${input.piecesJointes.length > 0 ? input.piecesJointes.join(", ") : "—"}`,
    "",
    `Secteur d'activité : ${lbl(SECTEUR_LABEL, input.secteurActivite)}`,
    `Type de conseil : ${lbl(TYPE_CONSEIL_LABEL, input.typeConseil)}`,
    `Taille de l'équipe : ${lbl(TAILLE_LABEL, input.tailleEquipe)}`,
    `Délai souhaité : ${lbl(DELAI_LABEL, input.delaiSouhaite)}`,
    "",
    "Description du besoin :",
    input.descriptionBesoin,
  ].join("\n")

  const safeEmailHref = encodeURIComponent(input.email)
  const rows: [string, string][] = [
    ["Titre du conseil", input.titreConseil],
    ["Nom complet", fullName],
    ["Email", input.email],
    ["Téléphone", input.telephone],
    ["Entreprise", input.entreprise?.trim() || ""],
    ["Poste", input.poste?.trim() || ""],
    ["Pièces jointes", input.piecesJointes.length > 0 ? input.piecesJointes.join(", ") : ""],
    ["Secteur", lbl(SECTEUR_LABEL, input.secteurActivite)],
    ["Type de conseil", lbl(TYPE_CONSEIL_LABEL, input.typeConseil)],
    ["Taille équipe", lbl(TAILLE_LABEL, input.tailleEquipe)],
    ["Délai", lbl(DELAI_LABEL, input.delaiSouhaite)],
  ]

  const tableRows = rows
    .map(
      ([label, val]) =>
        `<tr><td style="padding:6px 12px 6px 0;vertical-align:top"><strong>${escapeHtml(label)}</strong></td><td style="padding:6px 0">${
          label === "Email"
            ? `<a href="mailto:${safeEmailHref}">${escapeHtml(val || "—")}</a>`
            : escapeHtml(val.trim() || "—")
        }</td></tr>`,
    )
    .join("")
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">
<p><strong>Nouvelle demande — Pôle Conseil</strong></p>
<table style="border-collapse:collapse;max-width:620px">${tableRows}</table>
<p><strong>Description du besoin</strong></p>
<p style="white-space:pre-wrap">${escapeHtml(input.descriptionBesoin)}</p>
</body></html>`

  return { subject, text, html }
}

/** Réception des demandes Pôle Conseil + envoi par email (Resend ou SMTP). */
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
        descriptionBesoin: read("descriptionBesoin"),
        titreConseil: read("titreConseil"),
        secteurActivite: read("secteurActivite") || null,
        typeConseil: read("typeConseil") || null,
        tailleEquipe: read("tailleEquipe") || null,
        delaiSouhaite: read("delaiSouhaite") || null,
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
    const desc = (body.descriptionBesoin ?? "").trim()
    const titreConseil = (body.titreConseil ?? "").trim()
    const tel = (body.telephone ?? "").trim()
    const secteur = (body.secteurActivite ?? "").trim()
    const typeConseil = (body.typeConseil ?? "").trim()

    if (!email || !nom || !prenom || !tel || !desc || !titreConseil) {
      return NextResponse.json(
        { ok: false, detail: "Champs obligatoires manquants." },
        { status: 400 },
      )
    }
    if (!secteur || !typeConseil) {
      return NextResponse.json(
        { ok: false, detail: "Secteur et type de conseil sont requis." },
        { status: 400 },
      )
    }

    const { subject, text, html } = buildMailParts({
      nom,
      prenom,
      email,
      telephone: tel,
      entreprise: body.entreprise?.trim() || null,
      poste: body.poste?.trim() || null,
      descriptionBesoin: desc,
      titreConseil,
      piecesJointes: Array.isArray(body.piecesJointes) ? body.piecesJointes.map((x) => String(x)) : [],
      secteurActivite: secteur,
      typeConseil,
      tailleEquipe: body.tailleEquipe?.trim() || null,
      delaiSouhaite: body.delaiSouhaite?.trim() || null,
    })

    try {
      await sendSiteMail({ subject, text, html, replyTo: email, to: conseilContactRecipients(), attachments })
    } catch (e) {
      if (isSiteMailError(e)) {
        console.error("[conseil/demande]", e.message)
        return NextResponse.json({ ok: false, detail: e.message }, { status: e.status })
      }
      console.error("[conseil/demande] unexpected:", e)
      return NextResponse.json({ ok: false, detail: "Envoi impossible." }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, detail: "Corps invalide." }, { status: 400 })
  }
}
