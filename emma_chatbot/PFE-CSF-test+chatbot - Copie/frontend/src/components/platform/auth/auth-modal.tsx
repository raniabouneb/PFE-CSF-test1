"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { useAuthModal } from "@/components/platform/auth/auth-modal-context"
import { LoginForm } from "@/components/sections/platform/authentification/sections/login-form"
import { SignupForm } from "@/components/sections/platform/authentification/sections/signup-form"
import { cn } from "@/lib/utils"

export function AuthModal() {
  const { isOpen, mode, close, setMode } = useAuthModal()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, close])

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex max-h-[100dvh] items-start justify-center overflow-y-auto overscroll-contain p-4 py-8 sm:items-center sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        className="absolute inset-0 bg-[#0D3570]/20 backdrop-blur-md"
        onClick={close}
      />

      <div className="relative z-10 w-full max-w-[min(96vw,900px)] animate-in fade-in zoom-in-95 duration-200">
        <div
          className={cn(
            "relative overflow-hidden rounded-[28px] border border-white/50 shadow-[0_28px_90px_-24px_rgba(13,53,112,0.55)]",
            "bg-gradient-to-br from-white/35 via-white/20 to-[#0D3570]/15 backdrop-blur-2xl"
          )}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/50 text-[#0f172a] shadow-md backdrop-blur-md transition hover:bg-white/80"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex min-h-[min(100dvh-6rem,520px)] flex-col pt-14 md:min-h-[480px] md:flex-row md:pt-0">
            {/* Panneau CSF — CTA + bascule mode */}
            <aside
              className={cn(
                "relative flex flex-col justify-center gap-5 px-8 py-10 md:w-[42%] md:min-w-[260px] md:border-r md:border-white/25 md:py-12",
                "border-b border-white/25 bg-gradient-to-br from-[#0D3570]/75 via-[#0D3570]/55 to-[#0a2d5c]/50 backdrop-blur-xl"
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
              <div className="relative text-center md:text-left">
                {mode === "login" ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                      Centre de formation
                    </p>
                    <h2 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
                      Bienvenue sur <span className="text-sky-100">CSF</span>
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/90">
                      Pas encore de compte ? Créez-le en quelques instants et accédez à vos parcours et ressources.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="mt-4 w-full rounded-xl border-2 border-white/90 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 md:mt-6 md:w-auto md:self-start"
                    >
                      S&apos;inscrire
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                      Heureux de vous revoir
                    </p>
                    <h2 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
                      Déjà membre&nbsp;?
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/90">
                      Connectez-vous avec l'e-mail et le mot de passe de votre compte CSF.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="mt-4 w-full rounded-xl border-2 border-white/90 bg-white/5 px-5 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 md:mt-6 md:w-auto md:self-start"
                    >
                      Se connecter
                    </button>
                  </>
                )}
              </div>
            </aside>

            {/* Formulaire — vitre claire */}
            <div
              className={cn(
                "relative flex flex-1 flex-col justify-center px-6 py-8 backdrop-blur-xl sm:px-10 md:py-10",
                "bg-white/35"
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 to-transparent md:to-white/10" />
              <div className="relative max-h-[min(72dvh,560px)] min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
                {mode === "login" ? (
                  <LoginForm variant="modal" onSwitchToSignup={() => setMode("signup")} />
                ) : (
                  <SignupForm variant="modal" onSwitchToLogin={() => setMode("login")} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
