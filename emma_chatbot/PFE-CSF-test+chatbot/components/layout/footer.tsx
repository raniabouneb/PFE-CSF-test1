import Image from "next/image"
import Link from "next/link"
import { Facebook, Linkedin, Mail, Phone, MapPin } from "lucide-react"

interface FooterLink {
  label: string
  href?: string
  disabled?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: "Quick Links",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Conseil", disabled: true },
      { label: "Solution", disabled: true },
      { label: "Formation", href: "/formation" },
      { label: "Partenaires", href: "#partenaires" },
      { label: "Témoignage", href: "/#temoignage" },
      { label: "Contact", href: "#contact" },
    ],
  },
]

const contactInfo = [
  { icon: Mail, label: "contact@csf.tn", href: "mailto:contact@csf.tn" },
  { icon: Phone, label: "+216 98 765 432", href: "tel:+21698765432" },
  { icon: MapPin, label: "El Ghazala, Ariana", href: "#contact" },
]

const socialLinks = [
  { label: "Linkedin", href: "https://linkedin.com", icon: Linkedin },
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
]

export function Footer() {
  return (
    <footer id="contact" className="bg-white scroll mt-60 ">
      {/* Top Section with Company Image and CTA */}

      
      {/* Bottom Blue Section */}
      <div className="bg-gradient-to-r from-[#337CA1] to-[#2B5E94] pt-20 pb-12 md:pt-70 md:pb-16 ">
        <div className="w-full px-4 lg:px-8">
        <div className="relative -mt-110 mb-16 rounded-3xl overflow-hidden h-full min-h-[500px]">
      {/* Background Image */}
      <Image
        src="/images/mesure-framer.jpg"
        alt="locatisation"
        fill
        className="object-cover"
      />
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(23, 91, 113, 0.8) 100%)"
        }}
      />
      {/* Map Section */}
      <div className=" relative mt-70 mb-8 ml-8 mr-230 rounded-3xl overflow-hidden shadow-lg h-80 border border-gray-300">
              <iframe
                title="CSF Location Map"
                className="w-full h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3185.0894447485!2d10.1815!3d36.8665!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12e34e1e1e1e1e1d%3A0x1e1e1e1e1e1e1e1e!2sEl%20Ghazala%2C%20Ariana%2C%20Tunisia!5e0!3m2!1sen!2s!4v1234567890"
              />
            </div>
    
    </div>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-12 items-start ml-12">
            {/* Logo Section */}
            <div className="flex flex-col items-start">
              <div className="relative w-24 h-24 mb-4">
                <Image
                  src="/images/logo-new.png"
                  alt="CSF Logo"
                  fill
                  className="object-contain filter brightness-0 invert"
                />
              </div>
              <p className="text-gray-100 text-sm max-w-xs">
                CSF - Votre partenaire pour l&apos;excellence en conseil et formation.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-6 text-lg">Quick Links</h4>
              <ul className="space-y-3">
                {footerSections[0].links.map((link) => (
                  <li key={link.label}>
                    {link.disabled ? (
                      <span
                        className="text-gray-200/45 text-sm cursor-not-allowed"
                        title="Bientôt disponible"
                      >
                        {link.label}
                      </span>
                    ) : (
                      <Link
                        href={link.href!}
                        className="text-gray-200 hover:text-white text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-white mb-6 text-lg">Contact</h4>
              <ul className="space-y-4">
                {contactInfo.map((item) => {
                  const Icon = item.icon
                  const isExternal = item.href.startsWith("http")
                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-3 text-gray-200 hover:text-white text-sm transition-colors"
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold text-white mb-6 text-lg">Suivez-nous</h4>
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          

          {/* Footer Bottom */}
          <div className="border-t border-white/20 mt-12  pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-200 text-sm">
            <p>&copy; 2026 CSF Consulting. Tous droits réservés.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">
                Politique de confidentialité
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Conditions d&apos;utilisation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}