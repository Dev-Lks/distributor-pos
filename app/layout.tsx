import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "NitroBeer - Cerveja Artesanal Premium",
  description: "Descubra o sabor único da nossa cerveja artesanal. Qualidade, tradição e inovação em cada gole.",
  keywords: ["cerveja artesanal", "nitrobeer", "cerveja premium", "chopp", "ituiutaba", "cerveja gelada", "cerveja de qualidade"],
  authors: [{ name: "NitroBeer" }],
  openGraph: {
    title: "NitroBeer - Cerveja Artesanal Premium",
    description: "Descubra o sabor único da nossa cerveja artesanal.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning={true}>
        <Suspense fallback={null}>{children}</Suspense>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
