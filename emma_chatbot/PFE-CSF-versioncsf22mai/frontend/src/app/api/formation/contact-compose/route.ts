import { z } from "zod"

const bodySchema = z.object({
  category: z.enum(["reconversion", "ponctuelle"]),
  requestType: z.enum(["inscription", "catalogue"]).optional().default("inscription"),
  trackName: z.string().trim().min(2).max(200).optional(),
  formationTitle: z.string().trim().min(2).max(200),
  packType: z.enum(["full", "mini"]).optional(),
  packTag: z.string().trim().min(1).max(80).optional(),
  userName: z.string().trim().max(120).optional().default(""),
  userEmail: z.string().trim().email().max(254),
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

function buildBody(input: {
  category: "reconversion" | "ponctuelle"
  requestType: "inscription" | "catalogue"
  trackName?: string
  formationTitle: string
  packType?: "full" | "mini"
  packTag?: string
  userName: string
  userEmail: string
}): string {
  const categoryLabel =
    input.category === "reconversion" ? "Reconversion professionnelle" : "Formation ponctuelle"
  const packTypeLabel =
    input.packType === "full" ? "Pack Full" : input.packType === "mini" ? "Pack Mini" : null
  const intro =
    input.requestType === "catalogue"
      ? "Je souhaite recevoir le catalogue correspondant."
      : "Je souhaite finaliser mon inscription."
  return [
    "Bonjour equipe CSF,",
    "",
    intro,
    "",
    `Parcours: ${categoryLabel}`,
    ...(input.trackName ? [`Nom reconversion/formation: ${input.trackName}`] : []),
    `Formation choisie: ${input.formationTitle}`,
    ...(packTypeLabel ? [`Type de pack: ${packTypeLabel}`] : []),
    ...(input.packTag ? [`Tag pack: ${input.packTag}`] : []),
    `Nom: ${input.userName || "-"}`,
    `Email: ${input.userEmail}`,
    "",
    "Merci de me recontacter pour les prochaines etapes.",
  ].join("\n")
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

  const to = recipientEmails()
  if (to.length === 0) {
    return Response.json(
      { ok: false, error: "Aucune adresse destinataire (PARCOURS_DEMANDE_TO)." },
      { status: 500 },
    )
  }

  const { category, requestType, trackName, formationTitle, packType, packTag, userName, userEmail } =
    parsed.data
  const subjectMeta = [packType ? `pack ${packType}` : null, packTag ?? null]
    .filter(Boolean)
    .join(" | ")
  const subjectPrefix =
    requestType === "catalogue" ? "[CSF] Demande catalogue" : "[CSF] Demande inscription"
  const subject = subjectMeta
    ? `${subjectPrefix} - ${formationTitle} (${subjectMeta})`
    : `${subjectPrefix} - ${formationTitle}`
  const body = buildBody({
    category,
    requestType,
    trackName,
    formationTitle,
    packType,
    packTag,
    userName,
    userEmail,
  })
  const search = new URLSearchParams({
    view: "cm",
    fs: "1",
    tf: "1",
    to: to.join(","),
    su: subject,
    body,
  })
  const composeUrl = `https://mail.google.com/mail/?${search.toString()}`
  return Response.json({ ok: true, composeUrl })
}
