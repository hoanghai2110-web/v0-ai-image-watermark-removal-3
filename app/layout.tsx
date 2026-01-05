import type { Metadata } from "next"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"

import { Inter, Space_Grotesk } from "next/font/google"
import { Header } from "@/components/header"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" })

export const metadata: Metadata = {
  title: "ClearView – AI Image Restoration",
  description: "Fix blurry photos instantly with AI",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />
      </head>

      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background`}
      >
        {/* ✅ HEADER NẰM Ở ĐÂY */}
        <Header />

        {/* ✅ CONTENT SCROLL RIÊNG */}
        <main className="min-h-screen pt-16">
          {children}
        </main>

        <Analytics />
      </body>
    </html>
  )
}
