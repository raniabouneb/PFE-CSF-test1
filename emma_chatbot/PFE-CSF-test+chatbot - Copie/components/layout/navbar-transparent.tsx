"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import { formationPageUrl } from "@/lib/formation-routes"

type NavSubLink = { href: string; label: string }

type NavLinkItem =
  | { label: string; disabled: true }
  | { label: string; href: string; hasDropdown?: false; subLinks?: never }
  | { label: string; href: string; hasDropdown: true; subLinks: NavSubLink[] }

const navLinks: NavLinkItem[] = [
  { href: "/", label: "Accueil" },
  { label: "Conseil", disabled: true },
  { label: "Solution", disabled: true },
  {
    href: "/formation",
    label: "Formation",
    hasDropdown: true,
    subLinks: [
      { href: formationPageUrl("reconversion"), label: "Reconversion Métier" },
      { href: formationPageUrl("ponctuelle"), label: "Formation à la carte" },
      { href: formationPageUrl("parcours"), label: "Formation sur mesure" },
    ],
  },
  { href: "#partenaires", label: "Partenaires" },
  { href: "/certifications", label: "Certification" },
  { href: "#contact", label: "Contact" },
]

export function NavbarTransparent() {
  const headerRef = useRef<HTMLElement | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  // true = navbar "ancienne" (bg blanc / textes bleus)
  // false = navbar transparente au-dessus de la hero (texte blanc)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    const maxAttempts = 60 // ~1s à 60fps

    const tryInit = () => {
      if (cancelled) return
      attempts += 1
      const hero = document.querySelector("[data-navbar-hero]") as HTMLElement | null
      if (!hero) {
        if (attempts >= maxAttempts) {
          setIsScrolled(true) // fallback: on n'a pas de hero => fond blanc => navbar solide
          return
        }
        requestAnimationFrame(tryInit)
        return
      }

      const update = () => {
        const headerEl = headerRef.current
        if (!headerEl) return

        const headerHeightPx = headerEl.getBoundingClientRect().height
        const rect = hero.getBoundingClientRect()

        // Si le bas du hero est au-dessus du bas du header sticky,
        // alors le header n'est plus au-dessus de l'image => navbar "ancienne".
        setIsScrolled(rect.bottom <= headerHeightPx)
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
  }, [])

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 z-50 w-full transition-colors duration-200 ${
        isScrolled ? "bg-white backdrop-none border-b border-gray-100" : "bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
          <Image
              src="/images/logo-new.png"
              alt="CSF - Consulting Solutions Formation"
              width={0}
              height={80}
              className="w-20 h-20 object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-14">
            {navLinks.map((link) => (
              <div key={link.label} className="relative">
                {"disabled" in link && link.disabled ? (
                  <span
                    className={`text-sm font-medium cursor-not-allowed ${
                      isScrolled ? "text-[#335FA1]/45" : "text-white/40"
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
                        className={`text-sm font-medium transition-colors duration-200 ${
                          isScrolled ? "text-[#335FA1] hover:text-[#2a4f8a]" : "text-white/95 hover:text-white"
                        }`}
                      >
                        {link.label}
                      </Link>

                      <button
                        type="button"
                        aria-label="Open formation dropdown"
                        className={`flex items-center justify-center transition-colors duration-200 ${
                          isScrolled ? "text-[#335FA1] hover:text-[#2a4f8a]" : "text-white/95 hover:text-white"
                        }`}
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 pt-2">
                        <div
                          className={`py-2 min-w-48 shadow-lg ${
                            isScrolled
                              ? "bg-white border-l-2 border-[#335FA1]/70"
                              : "bg-white/10 border-l-2 border-white/40 backdrop-blur-md"
                          }`}
                        >
                          {link.subLinks.map((subLink) => (
                            <Link
                              key={subLink.href}
                              href={subLink.href}
                              className={`block px-4 py-2 text-sm transition-colors ${
                                isScrolled
                                  ? "text-[#335FA1] hover:text-[#2a4f8a] hover:bg-gray-50"
                                  : "text-white/95 hover:text-white hover:bg-white/10"
                              }`}
                              onClick={() => setIsDropdownOpen(false)}
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
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isScrolled ? "text-[#335FA1] hover:text-[#2a4f8a]" : "text-white/95 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* CTA Button - pill transparent */}
          <div className="hidden lg:block">
            <Link
              href="#login"
              className={`inline-flex items-center justify-center rounded-full px-10 py-3.5 transition-colors duration-200 text-sm font-normal tracking-wide font-sans ${
                isScrolled
                  ? "bg-[#1F6CA3] hover:bg-[#1F6CA3]/60 text-white border-0 shadow-none"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-none"
              }`}
            >
              Se connecter
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div
            className={`lg:hidden py-4 border-t ${
              isScrolled ? "border-gray-100" : "border-white/10"
            }`}
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <div key={link.label}>
                  {"disabled" in link && link.disabled ? (
                    <span
                      className={`block text-sm font-medium py-2 cursor-not-allowed ${
                        isScrolled ? "text-[#335FA1]/45" : "text-white/40"
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
                          className={`text-sm font-medium transition-colors duration-200 ${
                            isScrolled ? "text-[#335FA1] hover:text-[#2a4f8a]" : "text-white/95 hover:text-white"
                          }`}
                          onClick={() => {
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
                            isScrolled ? "text-[#335FA1]" : "text-white"
                          }`}
                          aria-label="Toggle dropdown"
                        >
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                      {isDropdownOpen && (
                        <div
                          className={`pl-4 border-l-2 ml-2 ${
                            isScrolled ? "border-[#335FA1]/70" : "border-white/40"
                          }`}
                        >
                          {link.subLinks.map((subLink) => (
                            <Link
                              key={subLink.href}
                              href={subLink.href}
                              className={`block py-2 text-sm transition-colors ${
                                isScrolled
                                  ? "text-[#335FA1] hover:text-[#2a4f8a]"
                                  : "text-white/95 hover:text-white"
                              }`}
                              onClick={() => {
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
                      className={`block text-sm font-medium py-2 transition-colors ${
                        isScrolled ? "text-[#335FA1] hover:text-[#2a4f8a]" : "text-white/95 hover:text-white"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}

              <Link
                href="#login"
                className={`inline-flex items-center justify-center rounded-full px-10 py-3.5 mt-4 transition-colors duration-200 text-sm font-normal tracking-wide font-sans ${
                  isScrolled
                    ? "bg-[#6D8EDB] hover:bg-[#5f7dc9] text-white border-0 shadow-none"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-none"
                }`}
              >
                Se connecter
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

