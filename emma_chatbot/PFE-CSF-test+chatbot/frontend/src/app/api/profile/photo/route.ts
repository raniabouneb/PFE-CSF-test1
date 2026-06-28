import { getBackendUrl } from "@/lib/server/backend"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const urlPath = searchParams.get("url")
  if (!urlPath) {
    return new Response("Missing url param", { status: 400 })
  }

  const backendUrl = `${getBackendUrl()}${urlPath}`
  const r = await fetch(backendUrl, { cache: "no-store" })
  if (!r.ok) {
    return new Response("Photo not found", { status: r.status })
  }

  const contentType = r.headers.get("content-type") || "image/jpeg"
  const body = await r.arrayBuffer()

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  })
}
