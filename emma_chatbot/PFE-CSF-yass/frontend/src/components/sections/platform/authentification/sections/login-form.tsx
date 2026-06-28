"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuthModal } from "@/components/platform/auth/auth-modal-context"
import { emailFieldSchema } from "@/lib/auth/email-schema"
import { messageFromAuthFetchResponse, safeParseAuthJson } from "@/lib/auth/auth-fetch-message"
import { getPostLoginPath } from "@/lib/auth/roles"
import {
  AUTH_GLASS_INPUT_CLASS,
  AUTH_INPUT_ICON_CLASS,
  AuthIconField,
  AuthOrDivider,
  authSwitchLinkClass,
  GoogleOAuthButton,
} from "./auth-form-primitives"
import { cn } from "@/lib/utils"

type Props = {
  variant?: "modal" | "page"
  onSwitchToSignup?: () => void
}

export function LoginForm({ variant = "page", onSwitchToSignup }: Props) {
  const router = useRouter()
  const { close } = useAuthModal()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [afterLoginPath, setAfterLoginPath] = useState("/dashboard")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get("error")
    if (err) {
      toast.error(err)
      window.history.replaceState({}, "", window.location.pathname)
    }
    const redir = params.get("redirect")
    if (redir?.startsWith("/") && !redir.startsWith("//")) {
      setAfterLoginPath(redir)
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const emailCheck = emailFieldSchema.safeParse(email)
    if (!emailCheck.success) {
      const msg = emailCheck.error.issues[0]?.message ?? "Adresse email invalide."
      toast.error(msg)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailCheck.data, password }),
      })
      const raw = await res.text()
      const data = safeParseAuthJson(raw)
      if (!res.ok) {
        const msg = messageFromAuthFetchResponse(res, raw, data)
        toast.error(msg || "Connexion impossible")
        return
      }
      let role: string | null | undefined
      try {
        const body = JSON.parse(raw) as { user?: { role?: string | null } }
        role = body.user?.role ?? undefined
      } catch {
        role = undefined
      }
      if (role === undefined || role === "") {
        try {
          const me = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
          if (me.ok) {
            const u = (await me.json()) as { role?: string | null }
            if (typeof u.role === "string" && u.role.trim() !== "") role = u.role.trim()
          }
        } catch {
          /* ignore */
        }
      }
      const nextPath = getPostLoginPath({
        role,
        requestedPath: variant === "page" ? afterLoginPath : null,
      })
      toast.success("Connexion réussie")
      if (variant === "modal") close()
      router.push(nextPath)
      router.refresh()
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  const signupAction =
    variant === "modal" ? (
      <button type="button" onClick={onSwitchToSignup} className={authSwitchLinkClass}>
        SIGN UP
      </button>
    ) : (
      <Link href="/authentification/inscription" className={authSwitchLinkClass}>
        SIGN UP
      </Link>
    )

  if (variant === "modal") {
    return (
      <div className="mx-auto w-full max-w-md pb-4 pt-2 md:pb-6 md:pt-4">
        <div className="text-center md:text-left">
          <h2 id="auth-modal-title" className="text-2xl font-bold tracking-tight text-[#0f172a]">
            Connexion
          </h2>
          <p className="mt-1 text-sm text-slate-600">Avec votre e-mail et mot de passe</p>
        </div>

        <div className="mt-6 space-y-4">
          <GoogleOAuthButton
            disabled={loading}
            className="border-white/60 bg-white/60 backdrop-blur-sm hover:bg-white/80"
          />
        </div>

        <div className="relative mt-6">
          <AuthOrDivider />
        </div>

        <form id="auth-login-form" onSubmit={handleLogin} className="mt-6 space-y-4">
          <Input
            type="email"
            name="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={loading}
            className={AUTH_GLASS_INPUT_CLASS}
          />
          <Input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={loading}
            className={AUTH_GLASS_INPUT_CLASS}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-slate-600">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(c) => setRememberMe(c === true)}
                disabled={loading}
                className="border-slate-400 data-[state=checked]:bg-[#104070] data-[state=checked]:border-[#104070]"
              />
              <span>Se souvenir de moi</span>
            </label>
            <a
              href="#"
              className="text-slate-500 underline-offset-2 transition hover:text-[#104070]"
              onClick={(e) => e.preventDefault()}
            >
              Mot de passe oublié ?
            </a>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 w-full rounded-xl bg-[#104070] text-sm font-bold uppercase tracking-widest text-white shadow-[0_10px_28px_-8px_rgba(16,64,112,0.55)] hover:bg-[#104070]/80 disabled:opacity-60"
          >
            {loading ? "…" : "Se connecter"}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-[380px] pb-10 pt-2">
      <h2 id="auth-modal-title" className="sr-only">
        Connexion
      </h2>

      <div className="relative rounded-[28px] border border-white/60 bg-white/[0.97] px-6 pb-10 pt-14 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.28)]">
        <div className="absolute -top-12 left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full bg-[#0c2744] shadow-lg ring-4 ring-white/90">
          <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        <form id="auth-login-form" onSubmit={handleLogin} className="space-y-4">
          <AuthIconField icon={<User className="h-5 w-5 text-white" strokeWidth={2} />}>
            <Input
              type="email"
              name="email"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
              className={cn("min-w-0 flex-1", AUTH_INPUT_ICON_CLASS)}
            />
          </AuthIconField>

          <AuthIconField icon={<Lock className="h-5 w-5 text-white" strokeWidth={2} />}>
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
              className={cn("min-w-0 flex-1", AUTH_INPUT_ICON_CLASS)}
            />
          </AuthIconField>

          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-slate-500">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(c) => setRememberMe(c === true)}
                disabled={loading}
                className="border-slate-400 data-[state=checked]:bg-[#0c2744] data-[state=checked]:border-[#0c2744]"
              />
              <span>Remember me</span>
            </label>
            <a
              href="#"
              className="italic text-slate-500 transition hover:text-slate-700"
              onClick={(e) => e.preventDefault()}
            >
              Forgot Password?
            </a>
          </div>
        </form>

        <div className="relative mt-8 space-y-5">
          <AuthOrDivider />
          <GoogleOAuthButton disabled={loading} />
        </div>

        <p className="mt-8 text-center text-sm text-slate-600">
          Don&apos;t have an account? {signupAction}
        </p>
      </div>

      <div className="relative z-20 flex justify-center -mt-7">
        <Button
          type="submit"
          form="auth-login-form"
          disabled={loading}
          className="h-[52px] min-w-[200px] rounded-full bg-[#104070] px-14 text-base font-bold uppercase tracking-widest text-white shadow-[0_8px_24px_rgba(16,64,112,0.35)] hover:bg-[#104070]/80 disabled:opacity-60"
        >
          {loading ? "…" : "LOGIN"}
        </Button>
      </div>
    </div>
  )
}
