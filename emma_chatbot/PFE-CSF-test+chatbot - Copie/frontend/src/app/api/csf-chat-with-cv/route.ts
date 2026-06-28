import { NextRequest, NextResponse } from "next/server"

/**
 * Proxy multipart vers POST /chat/with-cv (PDF + session_id + message).
 */
export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") ?? ""
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "multipart/form-data requis (fichier CV)." },
      { status: 400 },
    )
  }

  try {
    const formData = await req.formData()
    const res = await fetch(new URL("/api/csf-chat/with-cv", req.url), {
      method: "POST",
      headers: { cookie: req.headers.get("cookie") ?? "" },
      body: formData,
    })
    const text = await res.text()
    const outCt = res.headers.get("Content-Type") ?? "application/json"
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": outCt },
    })
  } catch (e) {
    console.error("[csf-chat-with-cv proxy]", e)
    return NextResponse.json(
      { error: "Impossible de joindre le service CSF AI." },
      { status: 502 },
    )
  }
}
