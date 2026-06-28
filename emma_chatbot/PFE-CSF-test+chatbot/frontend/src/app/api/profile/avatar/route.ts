import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

/**
 * Redirige vers Gravatar (même principe que Gmail / comptes utilisant l’e-mail).
 * Paramètre requis : `email`.
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? ""
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 })
  }
  const hash = createHash("md5").update(email).digest("hex")
  const url = `https://www.gravatar.com/avatar/${hash}?s=256&d=identicon`
  return NextResponse.redirect(url)
}
