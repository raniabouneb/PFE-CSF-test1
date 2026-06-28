import Image from "next/image"
import { Mail, MapPin, Phone } from "lucide-react"

/** Texte affiché dans le bloc contact (inchangé pour l’utilisateur). */
const MAP_ADDRESS_LINE_1 = "Pôle technologique El Ghazala, 2088 Ariana"
const MAP_ADDRESS_FOR_LINK = `${MAP_ADDRESS_LINE_1}, Tunisie`
/** Lien au clic sur l’adresse : même lieu que le libellé affiché. */
const MAP_SHARE_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_ADDRESS_FOR_LINK)}`
/** Repère uniquement pour la carte iframe (code plus / lieu précis). */
const MAP_EMBED_QUERY = "V5QJ+8V Cebalat Ben Ammar, Tunisie"
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(MAP_EMBED_QUERY)}&output=embed&z=16`

const contactBlocks = [
  {
    key: "address",
    heading: "Adresse",
    icon: MapPin,
    lines: [MAP_ADDRESS_LINE_1, "Tunisie"],
    href: MAP_SHARE_URL,
    external: true,
  },
  {
    key: "phone",
    heading: "Téléphone",
    icon: Phone,
    lines: ["+216 92 039 433"],
    href: "tel:+21692039433",
    external: false,
  },
  {
    key: "email",
    heading: "E-mail",
    icon: Mail,
    lines: ["formation@csfgroupe.tn"],
    href: "mailto:formation@csfgroupe.tn",
    external: false,
  },
] as const

function LinkedInGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function YouTubeGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a2.997 2.997 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A2.997 2.997 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.997 2.997 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a2.997 2.997 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/centre-sup%C3%A9rieur-de-formation-csf/posts/?feedView=all",
    Icon: LinkedInGlyph,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/Centre.CSF",
    Icon: FacebookGlyph,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@centresuperieurdeformation7523",
    Icon: YouTubeGlyph,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@centrecsf?_r=1&_t=ZS-97XAR6UAylo",
    Icon: TikTokGlyph,
  },
] as const

export function Footer() {
  return (
    <footer
      id="contact"
      className="h-[500px] max-h-[500px] scroll-mt-24 overflow-hidden bg-[#0c1929]"
      data-nav-bg="#0c1929"
      data-nav-tone="dark"
    >
      <div className="relative h-full w-full">
        <Image
          src="/images/mesure-framer.jpg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(5, 57, 65, 0.72) 0%, rgb(2, 17, 43) 100%)",
        }}
      />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-4 py-4 md:px-6 md:py-5">
          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden lg:grid-cols-2 lg:grid-rows-1 lg:items-stretch lg:gap-5">
            {/* Contact + réseaux — compact pour 500px */}
            <div className="flex min-h-0 flex-col justify-center gap-2 text-white lg:max-h-full lg:overflow-y-auto lg:pr-1">
              <div>
                <p
                  className="mb-0.5 text-[10px] font-semibold uppercase mt-12 tracking-[0.2em] text-[#43A193]"
                  
                >
                  Contact
                </p>
                <h2 className="font-sans text-2xl font-bold uppercase leading-tight tracking-tight text-white mb-10 md:text-3xl">
                  Restons en contact
                </h2>
              </div>

              <ul className="space-y-7.5">
                {contactBlocks.map((block) => {
                  const Icon = block.icon
                  return (
                    <li key={block.key}>
                      <a
                        href={block.href}
                        target={block.external ? "_blank" : undefined}
                        rel={block.external ? "noopener noreferrer" : undefined}
                        className="group flex gap-2.5 text-left transition-opacity hover:opacity-95"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors group-hover:border-white/35"
                          aria-hidden
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                        </span>
                        <span className="min-w-0">
                          <span
                            className="mb-0 block text-[12px] font-bold uppercase tracking-wider text-[#43A193]"
                            
                          >
                            {block.heading}
                          </span>
                          {block.lines.map((line) => (
                            <span
                              key={line}
                              className="block text-[16px] leading-snug text-white/95 md:text-[16px]"
                            >
                              {line}
                            </span>
                          ))}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-auto border-t border-white/15 pt-2.5">
                <p className="mb-1.5 text-[14px] font-bold uppercase tracking-wider text-white/80">Suivez-nous</p>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((s) => {
                    const G = s.Icon
                    return (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:border-white/40 hover:bg-white/10"
                      >
                        <G className="h-4.5 w-4.5" />
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Carte — un peu moins haute qu’avant tout en restant lisible */}
            <div className="flex min-h-0 flex-1 flex-col justify-center lg:min-h-0">
              <div className="h-[350px] w-full shrink-0 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/10 sm:h-[350px] lg:h-[350px] lg:rounded-xl">
                <iframe
                  title="Carte — CSF, El Ghazala"
                  src={MAP_EMBED_SRC}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
