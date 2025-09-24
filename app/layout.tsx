import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/components/QueryProvider"
import { PWAInstall } from "@/components/PWAInstall"

export const metadata: Metadata = {
  title: "NitroBeer",
  description: "Sistema de Ponto de Venda para NitroBeer",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NitroBeer POS",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fbbf24",
}

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        <PWAInstall />
      </body>
    </html>
  )
}
