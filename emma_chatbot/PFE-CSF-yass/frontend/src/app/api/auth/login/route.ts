import { proxyBackendAuthPost } from "@/lib/auth/proxy-backend-auth-post"

export async function POST(req: Request) {
  return proxyBackendAuthPost("auth/login", req, "login")
}
