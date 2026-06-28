"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState, type MouseEvent } from "react"
import {
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Home,
} from "lucide-react"
import { toast } from "sonner"
import type { AuthUser } from "@/components/platform/auth/auth-user-context"
import { useAuthUser } from "@/components/platform/auth/auth-user-context"
import { useAuthModal } from "@/components/platform/auth/auth-modal-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formationPageUrl } from "@/lib/formation-routes"
import { navDebug } from "@/lib/client/nav-debug"
import { smoothScrollToIdWhenReady } from "@/lib/smooth-scroll-to-id"

/** Logo barre claire (scroll / pages fond blanc). */
const NAV_LOGO_ON_LIGHT = "/images/logo-new.png"
/** Logo sur hero transparent (non scrollé). */
const NAV_LOGO_ON_TRANSPARENT = "/images/logo-text-blanc.png"

/** Numéro par défaut : +216 29 008 173. Surcharge : `NEXT_PUBLIC_WHATSAPP_URL` dans `.env`. */
const DEFAULT_WHATSAPP_HREF = "https://wa.me/21629008173"

function whatsappContactHref(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim()
  if (fromEnv) return fromEnv
  return DEFAULT_WHATSAPP_HREF
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 448 512"
      fill="currentColor"
      aria-hidden
    >
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 223.8-99.6 223.8-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-9.2-93.8-26.5l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
  )
}

/** Verre sur fond sombre : bordure alignée sur le texte blanc de la navbar. */
const glassPillOnDark =
  "rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition hover:border-white/40 hover:bg-white/15"

/** Verre sur barre claire : bordure alignée sur les liens `#104070`. */
const glassPillOnLight =
  "rounded-full border border-[#104070]/22 bg-white/15 backdrop-blur-md transition hover:border-[#104070]/35 hover:bg-white/30"

function NavWhatsAppLink({ light }: { light: boolean }) {
  const pill = light ? glassPillOnLight : glassPillOnDark
  return (
    <a
      href={whatsappContactHref()}
      target="_blank"
      rel="noopener noreferrer"
      className={`${pill} flex h-11 w-11 shrink-0 items-center justify-center ${
        light ? "text-[#25D366]" : "text-white"
      }`}
      aria-label="Contact WhatsApp"
    >
      <WhatsAppGlyph className="h-6 w-6" />
    </a>
  )
}

// --- Liens navigation (anciennement site-nav-config) ---

export type NavSubLink = { href: string; label: string }

export type NavLinkItem =
  | { label: string; disabled: true }
  | { label: string; href: string; hasDropdown?: false; subLinks?: never }
  | { label: string; href: string; hasDropdown: true; subLinks: NavSubLink[] }

const siteNavLinks: NavLinkItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/conseil", label: "Conseil" },
  { href: "/solution", label: "Solution" },
  {
    href: "/formation",
    label: "Formation",
    hasDropdown: true,
    subLinks: [
      { href: formationPageUrl("reconversion"), label: "Reconversion Métier" },
      { href: formationPageUrl("ponctuelle"), label: "Formation Par Module" },
      { href: formationPageUrl("parcours"), label: "Formation Sur Mesure" },
    ],
  },
  { href: "/certifications", label: "Certification" },
  { href: "#partenaires", label: "Partenaires" },
  { href: "#contact", label: "Contact" },
]

const HOME_PATH = "/"

type NavRouterPush = { push: (href: string) => void }

/** Incrémenté à chaque interaction nav : invalide tout `router.push` différé après Partenaires/Contact. */
let _navHashFallbackEpoch = 0

function bumpNavHashFallbackEpoch(): void {
  _navHashFallbackEpoch += 1
}

/**
 * Accueil : sur `/` → hero (`#accueil`). Partenaires / Contact : toujours la section sur la page courante
 * (même scroll que l’accueil) ; si l’élément n’existe pas → repli `/ #…` (ex. admin).
 */
function handleSiteNavLinkClick(
  pathname: string | null,
  href: string,
  e: MouseEvent<HTMLAnchorElement>,
  router: NavRouterPush,
): void {
  bumpNavHashFallbackEpoch()
  if (href === "/" && pathname === HOME_PATH) {
    e.preventDefault()
    window.history.pushState(null, "", HOME_PATH)
    void smoothScrollToIdWhenReady("accueil")
    return
  }
  if (href === "#partenaires" || href === "#contact") {
    e.preventDefault()
    const id = href === "#partenaires" ? "partenaires" : "contact"
    /** Si l’utilisateur a navigué vers une autre page entre-temps, ne pas écraser sa destination. */
    const pathnameWhenClicked = window.location.pathname
    const epochForThisFallback = _navHashFallbackEpoch
    const base = `${pathnameWhenClicked}${window.location.search}`
    window.history.pushState(null, "", `${base}#${id}`)
    navDebug("ancre navbar", {
      id,
      pathnameAuClic: pathnameWhenClicked,
      epochFallback: epochForThisFallback,
    })
    void smoothScrollToIdWhenReady(id, { maxWaitMs: 1200 }).then((ok) => {
      navDebug("fin scroll / fallback ancre", {
        ok,
        id,
        epochEncoreOk: epochForThisFallback === _navHashFallbackEpoch,
        pathnameActuel: window.location.pathname,
        pathnameAuClic: pathnameWhenClicked,
      })
      if (epochForThisFallback !== _navHashFallbackEpoch) return
      if (!ok && window.location.pathname === pathnameWhenClicked) {
        navDebug("router.push accueil + hash (secours)", `/#${id}`)
        router.push(`/#${id}`)
      }
    })
  }
}

/**
 * Navigation client explicite (évite que le hash `#partenaires` / `#contact` reste couplé à la route Next,
 * ce qui ramenait souvent à la « page précédente » ou à l’accueil avec ancre au lieu de `/certifications`, etc.).
 * Ne pas intercepter : clic milieu, Ctrl/Cmd/Maj+clic, ou navigation déjà gérée (preventDefault).
 */
function pushInternalRoute(
  href: string,
  e: MouseEvent<HTMLAnchorElement>,
  router: NavRouterPush,
): void {
  if (e.defaultPrevented) return
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.button !== 0) return
  if (!href.startsWith("/") || href.startsWith("//")) return
  if (href === "/") return
  navDebug("pushInternalRoute", {
    href,
    avant: `${window.location.pathname}${window.location.search}${window.location.hash}`,
  })
  e.preventDefault()
  router.push(href)
  queueMicrotask(() => {
    navDebug(
      "pushInternalRoute (microtask)",
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    )
  })
}

// --- Menu compte (anciennement navbar-profile-menu) ---

function userInitials(name: string | null, email: string) {
  const n = name?.trim()
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase()
    }
    return n.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function ProfileMenuItems({ user }: { user: AuthUser }) {
  const router = useRouter()
  const display = user.name?.trim() || user.email

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      if (!res.ok) throw new Error("logout")
      toast.success("Déconnexion réussie")
      router.push("/")
      router.refresh()
    } catch {
      toast.error("Impossible de se déconnecter")
    }
  }

  return (
    <>
      <DropdownMenuLabel className="font-normal">
        <p className="truncate text-sm font-medium text-slate-900">{display}</p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/dashboard" className="cursor-pointer">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Tableau de bord
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/dashboard/profil" className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Mon profil
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/dashboard/parametres" className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Paramètres
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/" className="cursor-pointer">
          <Home className="mr-2 h-4 w-4" />
          Site public
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-red-600 focus:text-red-600"
        onClick={() => void handleLogout()}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Déconnexion
      </DropdownMenuItem>
    </>
  )
}

/** Pastille WhatsApp + profil : verre transparent (clair ou sombre). */
function LoggedInNavActions({
  user,
  light,
}: {
  user: AuthUser
  light: boolean
}) {
  const initials = userInitials(user.name, user.email)
  const displayName =
    user.name?.trim() ||
    (user.email.includes("@") ? user.email.split("@")[0] : user.email) ||
    user.email

  const photoSrc = user.photoUrl
    ? `/api/profile/photo?url=${encodeURIComponent(user.photoUrl)}`
    : null

  const profilePill = light ? glassPillOnLight : glassPillOnDark
  const ringFocus = light
    ? "focus-visible:ring-[#104070]/35"
    : "focus-visible:ring-white/40"

  return (
    <div className="flex items-center gap-2">
      <NavWhatsAppLink light={light} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`${profilePill} flex max-w-[min(100vw-10rem,17.5rem)] items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2.5 text-left outline-none ring-offset-2 focus-visible:ring-2 ${ringFocus} sm:max-w-[17.5rem] sm:pr-3`}
            aria-label="Menu compte"
            aria-haspopup="menu"
          >
            <Avatar className="h-9 w-9 shrink-0 border-0 ring-0">
              {photoSrc && (
                <AvatarImage src={photoSrc} alt="" className="object-cover" />
              )}
              <AvatarFallback
                delayMs={photoSrc ? 120 : 0}
                className={`text-xs font-semibold text-white ${
                  light ? "bg-[#104070]" : "bg-[#0d9488]/90"
                }`}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 max-sm:hidden">
              <p
                className={`truncate text-base font-semibold leading-tight ${
                  light ? "text-slate-900" : "text-white"
                }`}
              >
                {displayName}
              </p>
              <p
                className={`truncate text-sm leading-tight ${
                  light ? "text-slate-500" : "text-white/75"
                }`}
              >
                {user.email}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 ${light ? "text-slate-600" : "text-white/90"}`}
              aria-hidden
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <ProfileMenuItems user={user} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// --- Barre principale ---

/**
 * - `solid` / `matchSection` : barre **blanche** (sticky), pour fonds **clairs**.
 * - `hero` : barre **fixed** ; par défaut **transparente** sur `[data-navbar-hero]` puis **blanche** quand le bas du hero dépasse la navbar.
 * - `hero` + `heroScrollMode="homeInset"` (accueil) : **blanche** sur la marge claire du haut et après le hero ; **transparente** lorsque la carte sombre passe sous la navbar.
 * `matchSection` = alias de `solid`.
 */
export type NavbarVariant = "solid" | "hero" | "matchSection"

function navbarVariantCore(v: NavbarVariant): "solid" | "hero" {
  return v === "matchSection" ? "solid" : v
}

export type NavbarHeroScrollMode = "default" | "homeInset"

type UseHeroScrollOptions = {
  /**
   * Accueil : marge claire sous la navbar puis carte hero sombre (`data-navbar-hero`).
   * Barre **blanche** sur la marge et après le hero ; **transparente** quand la carte sombre passe sous la navbar.
   */
  mode?: NavbarHeroScrollMode
}

function useHeroScroll(variant: "solid" | "hero", options?: UseHeroScrollOptions) {
  const mode = options?.mode ?? "default"
  const homeInset = variant === "hero" && mode === "homeInset"

  const headerRef = useRef<HTMLElement | null>(null)
  const [isScrolled, setIsScrolled] = useState(() => {
    if (variant !== "hero") return true
    if (homeInset) return true
    return false
  })

  useEffect(() => {
    if (variant !== "hero") return

    let cancelled = false
    let attempts = 0
    const maxAttempts = 60

    const tryInit = () => {
      if (cancelled) return
      attempts += 1
      const hero = document.querySelector("[data-navbar-hero]") as HTMLElement | null
      if (!hero) {
        if (attempts >= maxAttempts) {
          setIsScrolled(true)
          return
        }
        requestAnimationFrame(tryInit)
        return
      }

      const update = () => {
        const headerEl = headerRef.current
        if (!headerEl) return
        const navH = headerEl.getBoundingClientRect().height
        const rect = hero.getBoundingClientRect()
        if (homeInset) {
          const whiteBar =
            rect.top >= navH || rect.bottom <= navH
          setIsScrolled(whiteBar)
        } else {
          setIsScrolled(rect.bottom <= navH)
        }
      }

      update()
      window.addEventListener("scroll", update, { passive: true })
      window.addEventListener("resize", update)

      return () => {
        window.removeEventListener("scroll", update)
        window.removeEventListener("resize", update)
      }
    }

    const cleanup = tryInit()
    return () => {
      cancelled = true
      if (typeof cleanup === "function") cleanup()
    }
  }, [variant, homeInset])

  return { headerRef, isScrolled }
}

function NavLinksDesktop({
  navLinks,
  light,
  isDropdownOpen,
  setIsDropdownOpen,
  pathname,
  router,
}: {
  navLinks: NavLinkItem[]
  light: boolean
  isDropdownOpen: boolean
  setIsDropdownOpen: (v: boolean) => void
  pathname: string | null
  router: NavRouterPush
}) {
  return (
    <div className="hidden lg:flex items-center gap-14">
      {navLinks.map((link) => (
        <div key={link.label} className="relative">
          {"disabled" in link && link.disabled ? (
            <span
              className={`text-base font-medium cursor-not-allowed ${
                light ? "text-[#104070]/45" : "text-white/40"
              }`}
              title="Bientôt disponible"
              aria-disabled="true"
            >
              {link.label}
            </span>
          ) : "hasDropdown" in link && link.hasDropdown ? (
            <div
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="flex items-center gap-1">
                <Link
                  href={link.href}
                  className={`text-base font-medium transition-colors duration-200 ${
                    light ? "text-[#104070] hover:text-[#0c3254]" : "text-white/95 hover:text-white"
                  }`}
                  onClick={(e) => {
                    bumpNavHashFallbackEpoch()
                    pushInternalRoute(link.href, e, router)
                  }}
                >
                  {link.label}
                </Link>
                <button
                  type="button"
                  aria-label="Menu Formation"
                  className={`flex items-center justify-center transition-colors duration-200 ${
                    light ? "text-[#104070] hover:text-[#0c3254]" : "text-white/95 hover:text-white"
                  }`}
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 pt-2">
                  <div
                    className={`py-2 min-w-50 shadow-lg ${
                      light
                        ? "bg-white border-l-2 border-[#104070]/70"
                        : "bg-white/10 border-l-2 border-white/40 backdrop-blur-md"
                    }`}
                  >
                    {link.subLinks.map((subLink) => (
                      <Link
                        key={subLink.href}
                        href={subLink.href}
                        className={`block whitespace-nowrap px-4 py-2 text-base transition-colors ${
                          light
                            ? "text-[#104070] hover:text-[#0c3254] hover:bg-gray-50"
                            : "text-white/95 hover:text-white hover:bg-white/10"
                        }`}
                        onClick={(e) => {
                          bumpNavHashFallbackEpoch()
                          pushInternalRoute(subLink.href, e, router)
                          setIsDropdownOpen(false)
                        }}
                      >
                        {subLink.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={"href" in link ? link.href : "#"}
              className={`text-base font-medium transition-colors duration-200 ${
                light ? "text-[#104070] hover:text-[#0c3254]" : "text-white/95 hover:text-white"
              }`}
              onClick={(e) => {
                const h = "href" in link ? link.href : "#"
                handleSiteNavLinkClick(pathname, h, e, router)
                pushInternalRoute(h, e, router)
              }}
            >
              {link.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}

type NavbarProps = {
  variant?: NavbarVariant
  /**
   * Avec `variant="hero"` : le hero a un fond **clair** (ex. formation) — liens / logo en mode « barre
   * claire » tout en gardant le fond de la barre **transparent** jusqu’au scroll (comme un hero sombre).
   */
  heroReadableOnLight?: boolean
  /** Avec `variant="hero"` : logique scroll spécifique page d’accueil (marge claire + carte sombre). */
  heroScrollMode?: NavbarHeroScrollMode
}

export function Navbar({
  variant = "solid",
  heroReadableOnLight = false,
  heroScrollMode = "default",
}: NavbarProps) {
  const user = useAuthUser()
  const { openLogin } = useAuthModal()
  const pathname = usePathname()
  const router = useRouter()
  const core = navbarVariantCore(variant)
  const homeInset = core === "hero" && heroScrollMode === "homeInset"
  const { headerRef, isScrolled } = useHeroScroll(core, { mode: heroScrollMode })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const light =
    core === "solid" ||
    isScrolled ||
    (core === "hero" && !homeInset && Boolean(heroReadableOnLight))
  /** Liens / logo : mode clair (bleu) vs mode hero sombre (blanc). */
  const navLight = light
  const logoSrc = light ? NAV_LOGO_ON_LIGHT : NAV_LOGO_ON_TRANSPARENT

  const headerClass =
    core === "hero"
      ? isScrolled
        ? "fixed top-0 z-50 w-full transition-colors duration-200 bg-white backdrop-none "
        : "fixed top-0 z-50 w-full transition-colors duration-200 bg-transparent"
      : user
        ? "sticky top-0 z-50 w-full bg-white"
        : "sticky top-0 z-50 w-full bg-white"

  const menuIconClass =
    core === "hero" && !light ? "text-white" : "text-[#104070]"

  return (
    <header ref={core === "hero" ? headerRef : undefined} className={headerClass}>
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between min-h-22">
          <Link
            href="/"
            className="flex-shrink-0"
            onClick={(e) => {
              bumpNavHashFallbackEpoch()
              if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.button !== 0) return
              if (!window.location.hash) return
              e.preventDefault()
              router.push("/")
            }}
          >
            <Image
              key={logoSrc}
              src={logoSrc}
              alt="CSF - Consulting Solutions Formation"
              width={192}
              height={192}
              className="h-22 w-22 object-contain"
              sizes="96px"
              quality={95}
              priority
            />
          </Link>

          <NavLinksDesktop
            navLinks={siteNavLinks}
            light={navLight}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            pathname={pathname}
            router={router}
          />

          {user ? (
            <>
              <div className="hidden lg:flex items-center gap-3">
                <LoggedInNavActions user={user} light={light} />
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <LoggedInNavActions user={user} light={light} />
                <button
                  type="button"
                  className={`p-2 ${menuIconClass}`}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Ouvrir le menu"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="hidden lg:flex items-center gap-3">
                <NavWhatsAppLink light={light} />
                <button
                  type="button"
                  onClick={openLogin}
                  className={`inline-flex cursor-pointer items-center justify-center rounded-full px-10 py-3.5 font-sans text-base font-normal tracking-wide transition-colors duration-200 ${
                    core === "hero"
                      ? light
                        ? " bg-[#104070] text-white shadow-none hover:bg-[#104070]/80"
                        : " bg-white/10 text-white shadow-none hover:bg-[#104070]/80"
                      : "bg-[#104070] text-white shadow-none hover:bg-[#104070]/80"
                  }`}
                >
                  Se connecter
                </button>
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <NavWhatsAppLink light={light} />
                <button
                  type="button"
                  className={`p-2 ${menuIconClass}`}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Ouvrir le menu"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </>
          )}
        </div>

        {isMenuOpen && (
          <div
            className={`lg:hidden border-t py-4 ${
              navLight ? "border-slate-200" : "border-white/10"
            }`}
          >
            <div className="flex flex-col gap-4">
              {siteNavLinks.map((link) => (
                <div key={link.label}>
                  {"disabled" in link && link.disabled ? (
                    <span
                      className={`block text-base font-medium py-2 cursor-not-allowed ${
                        navLight ? "text-[#104070]/45" : "text-white/40"
                      }`}
                      title="Bientôt disponible"
                      aria-disabled="true"
                    >
                      {link.label}
                    </span>
                  ) : "hasDropdown" in link && link.hasDropdown ? (
                    <div>
                      <div className="flex items-center justify-between w-full py-2">
                        <Link
                          href={link.href}
                          className={`text-base font-medium transition-colors duration-200 ${
                            navLight ? "text-[#104070] hover:text-[#0c3254]" : "text-white/95 hover:text-white"
                          }`}
                          onClick={(e) => {
                            bumpNavHashFallbackEpoch()
                            pushInternalRoute(link.href, e, router)
                            setIsMenuOpen(false)
                            setIsDropdownOpen(false)
                          }}
                        >
                          {link.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className={`flex items-center justify-center transition-colors duration-200 ${
                            navLight ? "text-[#104070]" : "text-white"
                          }`}
                          aria-label="Toggle dropdown"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                      {isDropdownOpen && (
                        <div
                          className={`pl-4 border-l-2 ml-2 ${
                            navLight ? "border-[#104070]/70" : "border-white/40"
                          }`}
                        >
                          {link.subLinks.map((subLink) => (
                            <Link
                              key={subLink.href}
                              href={subLink.href}
                              className={`block py-2 text-base transition-colors ${
                                navLight
                                  ? "text-[#104070] hover:text-[#0c3254]"
                                  : "text-white/95 hover:text-white"
                              }`}
                              onClick={(e) => {
                                bumpNavHashFallbackEpoch()
                                pushInternalRoute(subLink.href, e, router)
                                setIsMenuOpen(false)
                                setIsDropdownOpen(false)
                              }}
                            >
                              {subLink.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={"href" in link ? link.href : "#"}
                      className={`block text-base font-medium py-2 transition-colors ${
                        navLight ? "text-[#104070] hover:text-[#0c3254]" : "text-white/95 hover:text-white"
                      }`}
                      onClick={(e) => {
                        const h = "href" in link ? link.href : "#"
                        handleSiteNavLinkClick(pathname, h, e, router)
                        pushInternalRoute(h, e, router)
                        setIsMenuOpen(false)
                      }}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}

              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    openLogin()
                    setIsMenuOpen(false)
                  }}
                  className={`mt-4 inline-flex w-full items-center justify-center rounded-full border-0 px-10 py-3.5 font-sans text-base font-normal tracking-wide transition-colors duration-200 ${
                    core === "hero" && !light
                      ? " bg-white/10 text-white shadow-none hover:bg-[#104070]/80"
                      : "bg-[#104070] text-white shadow-none hover:bg-[#104070]/80"
                  }`}
                >
                  Se connecter
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}