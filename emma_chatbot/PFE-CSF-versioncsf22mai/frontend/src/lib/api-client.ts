/**
 * Centralised HTTP client for client-side React components.
 *
 * Auth is handled automatically: the httpOnly session cookie is sent by the
 * browser to Next.js API proxy routes which forward the Bearer token to the
 * FastAPI backend. No manual token handling is needed on the client side.
 *
 * Two base helpers:
 *   adminFetch  → /api/admin/backend/{path}
 *   learnerFetch → /api/learner/{path}
 */

type FetchOptions = Omit<RequestInit, "method">

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(`HTTP ${status}: ${statusText}`)
    this.name = "ApiError"
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/authentification/connexion?redirect=" + encodeURIComponent(window.location.pathname)
    }
    throw new ApiError(401, "Non authentifié", null)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, res.statusText, body)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

function buildFetcher(baseUrl: string) {
  return async function baseFetch<T>(
    path: string,
    method: string,
    options?: FetchOptions,
  ): Promise<T> {
    const url = `${baseUrl}/${path.replace(/^\//, "")}`
    const res = await fetch(url, {
      ...options,
      method,
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
    })
    return handleResponse<T>(res)
  }
}

const adminBase = buildFetcher("/api/admin/backend")
const learnerBase = buildFetcher("/api/learner")

// ── Admin helpers ────────────────────────────────────────────────────────

export function adminGet<T>(path: string, options?: FetchOptions): Promise<T> {
  return adminBase<T>(path, "GET", options)
}

export function adminPost<T>(path: string, body?: unknown, options?: FetchOptions): Promise<T> {
  return adminBase<T>(path, "POST", {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export function adminPatch<T>(path: string, body?: unknown, options?: FetchOptions): Promise<T> {
  return adminBase<T>(path, "PATCH", {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export function adminDelete<T = void>(path: string, options?: FetchOptions): Promise<T> {
  return adminBase<T>(path, "DELETE", options)
}

// ── Learner helpers ──────────────────────────────────────────────────────

export function learnerGet<T>(path: string, options?: FetchOptions): Promise<T> {
  return learnerBase<T>(path, "GET", options)
}

export function learnerPost<T>(path: string, body?: unknown, options?: FetchOptions): Promise<T> {
  return learnerBase<T>(path, "POST", {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export { ApiError }
