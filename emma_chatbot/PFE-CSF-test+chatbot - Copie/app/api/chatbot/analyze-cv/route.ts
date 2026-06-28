import { NextRequest, NextResponse } from "next/server"
import { analyzeCVText } from "@/lib/chatbot/cv-analyzer"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni. Veuillez uploader un PDF." },
        { status: 400 },
      )
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Format non supporté. Seuls les fichiers PDF sont acceptés." },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Fichier trop volumineux. Taille maximale : 5 Mo." },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractPdfText(buffer)

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible d'extraire le texte du PDF. Le fichier est peut-être scanné (image) ou vide.",
        },
        { status: 422 },
      )
    }

    const result = analyzeCVText(text, file.name)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[chatbot/analyze-cv]", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne lors de l'analyse du CV." },
      { status: 500 },
    )
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default
  const data = await pdfParse(buffer)
  return data.text ?? ""
}
