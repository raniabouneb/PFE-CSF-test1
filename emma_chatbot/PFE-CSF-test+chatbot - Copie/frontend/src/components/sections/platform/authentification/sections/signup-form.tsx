"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthModal } from "@/components/platform/auth/auth-modal-context"
import { emailFieldSchema } from "@/lib/auth/email-schema"
import { messageFromAuthFetchResponse, safeParseAuthJson } from "@/lib/auth/auth-fetch-message"
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
  onSwitchToLogin?: () => void
}

export function SignupForm({ variant = "page", onSwitchToLogin }: Props) {
  const router = useRouter()
  const { close } = useAuthModal()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }
    const emailCheck = emailFieldSchema.safeParse(email)
    if (!emailCheck.success) {
      const msg = emailCheck.error.issues[0]?.message ?? "Adresse email invalide."
      toast.error(msg)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: emailCheck.data, password }),
      })
      const raw = await res.text()
      const data = safeParseAuthJson(raw)
      if (!res.ok) {
        const msg = messageFromAuthFetchResponse(res, raw, data)
        toast.error(msg || "Inscription impossible")
        return
      }
      toast.success("Compte créé — bienvenue !")
      if (variant === "modal") close()
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  const loginAction =
    variant === "modal" ? (
      <button type="button" onClick={onSwitchToLogin} className={authSwitchLinkClass}>
        LOGIN
      </button>
    ) : (
      <Link href="/authentification/connexion" className={authSwitchLinkClass}>
        LOGIN
      </Link>
    )

  if (variant === "modal") {
    return (
      <div className="mx-auto w-full max-w-md pb-4 pt-2 md:pb-6 md:pt-4">
        <div className="text-center md:text-left">
          <h2 id="auth-modal-title" className="text-2xl font-bold tracking-tight text-[#0f172a]">
            Créer un compte
          </h2>
          <p className="mt-1 text-sm text-slate-600">Inscription avec votre e-mail et un mot de passe sécurisé</p>
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

        <form id="auth-signup-form" onSubmit={handleSignUp} className="mt-6 space-y-4">
          <Input
            type="text"
            placeholder="Nom complet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={loading}
            className={AUTH_GLASS_INPUT_CLASS}
          />
          <Input
            type="email"
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
            placeholder="Mot de passe (min. 6 caractères)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
            disabled={loading}
            className={AUTH_GLASS_INPUT_CLASS}
          />
          <Input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            disabled={loading}
            className={AUTH_GLASS_INPUT_CLASS}
          />

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 w-full rounded-xl bg-[#0D3570] text-sm font-bold uppercase tracking-widest text-white shadow-[0_10px_28px_-8px_rgba(13,53,112,0.55)] hover:bg-[#0a2d5c] disabled:opacity-60"
          >
            {loading ? "…" : "S'inscrire"}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-[400px] pb-10 pt-2">
      <h2 id="auth-modal-title" className="sr-only">
        Inscription
      </h2>

      <div className="relative overflow-visible rounded-[28px] border border-white/60 bg-white/[0.97] shadow-[0_24px_60px_-12px_rgba(15,23,42,0.28)]">
        <div className="pointer-events-none absolute -top-12 left-1/2 z-30 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full bg-[#0c2744] shadow-lg ring-4 ring-white/90">
          <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        <div className="px-6 pb-8 pt-14">
          <div className="max-h-[min(65vh,560px)] overflow-y-auto overflow-x-hidden overscroll-contain pr-1 [scrollbar-gutter:stable]">
            <form id="auth-signup-form" onSubmit={handleSignUp} className="space-y-4">
              <AuthIconField icon={<User className="h-5 w-5 text-white" strokeWidth={2} />}>
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  disabled={loading}
                  className={cn("min-w-0 flex-1", AUTH_INPUT_ICON_CLASS)}
                />
              </AuthIconField>
              <AuthIconField icon={<Mail className="h-5 w-5 text-white" strokeWidth={2} />}>
                <Input
                  type="email"
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
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={loading}
                  className={cn("min-w-0 flex-1", AUTH_INPUT_ICON_CLASS)}
                />
              </AuthIconField>
              <AuthIconField icon={<Lock className="h-5 w-5 text-white" strokeWidth={2} />}>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                  className={cn("min-w-0 flex-1", AUTH_INPUT_ICON_CLASS)}
                />
              </AuthIconField>
            </form>

            <div className="relative mt-8 space-y-5">
              <AuthOrDivider />
              <GoogleOAuthButton disabled={loading} />

              <p className="text-center text-sm text-slate-600">
                Already have an account? {loginAction}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 flex justify-center -mt-7">
        <Button
          type="submit"
          form="auth-signup-form"
          disabled={loading}
          className="h-[52px] min-w-[200px] rounded-full bg-[#5b9bd5] px-12 text-base font-bold uppercase tracking-widest text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-[#4a8cc9] disabled:opacity-60 sm:px-14"
        >
          {loading ? "…" : "SIGN UP"}
        </Button>
      </div>
    </div>
  )
}
