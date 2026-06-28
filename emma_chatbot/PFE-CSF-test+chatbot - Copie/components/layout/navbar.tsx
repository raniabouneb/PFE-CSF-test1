"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
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

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
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
                    className="text-sm font-medium text-[#335FA1]/45 cursor-not-allowed"
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
                        className="text-sm font-medium text-[#335FA1] hover:text-[#2a4f8a] transition-colors duration-200"
                      >
                        {link.label}
                      </Link>

                      <button
                        type="button"
                        className="flex items-center justify-center text-[#335FA1] hover:text-[#2a4f8a] transition-colors duration-200"
                        aria-label="Open formation dropdown"
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
                        <div className="bg-white border-l-2 border-[#335FA1] shadow-lg py-2 min-w-48">
                          {link.subLinks.map((subLink) => (
                            <Link
                              key={subLink.href}
                              href={subLink.href}
                              className="block px-4 py-2 text-sm text-[#335FA1] hover:text-[#2a4f8a] hover:bg-gray-50 transition-colors"
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
                    className="text-sm font-medium text-[#335FA1] hover:text-[#2a4f8a] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* CTA Button - pilule, bleu pervenche, style plat */}
          <div className="hidden lg:block">
            <Link
              href="#login"
              className="inline-flex items-center justify-center bg-[#2B5E94] hover:bg-[#2F68A1] text-white text-sm font-normal tracking-wide rounded-full px-10 py-3.5 transition-colors duration-200 border-0 shadow-none font-sans"
            >
              Se connecter
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-[#335FA1]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <div key={link.label}>
                  {"disabled" in link && link.disabled ? (
                    <span
                      className="block text-sm font-medium text-[#335FA1]/45 py-2 cursor-not-allowed"
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
                          className="text-sm font-medium text-[#335FA1] hover:text-[#2a4f8a] transition-colors duration-200"
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
                          className="flex items-center justify-center text-[#335FA1] hover:text-[#2a4f8a] transition-colors duration-200"
                          aria-label="Toggle dropdown"
                        >
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                      {isDropdownOpen && (
                        <div className="pl-4 border-l-2 border-[#335FA1] ml-2">
                          {link.subLinks.map((subLink) => (
                            <Link
                              key={subLink.href}
                              href={subLink.href}
                              className="block py-2 text-sm text-[#335FA1] hover:text-[#2a4f8a]"
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
                      className="block text-sm font-medium text-[#335FA1] hover:text-[#2a4f8a] py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
              <Link
                href="#login"
                className="inline-flex items-center justify-center bg-[#6D8EDB] hover:bg-[#5f7dc9] text-white text-sm font-normal tracking-wide rounded-full px-10 py-3.5 mt-4 transition-colors duration-200 border-0 shadow-none font-sans"
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
