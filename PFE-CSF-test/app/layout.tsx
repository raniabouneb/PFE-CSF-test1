import type { Metadata } from 'next'
import { Geist, Geist_Mono, Crimson_Pro } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geistSans = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-crimson",
})

export const metadata: Metadata = {
  title: 'CSF - Conseil Solution Formation',
  description: 'Conseil stratégique, ingénierie sur mesure et formation d\'experts. CSF réunit trois pôles d\'excellence pour vos défis technologiques.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} ${crimsonPro.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
