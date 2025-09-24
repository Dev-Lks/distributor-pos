import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { QueryProvider } from "@/components/QueryProvider"
import { PWAInstall } from "@/components/PWAInstall"

export const metadata: Metadata = {
  title: "NitroBeer",
  description: "Sistema de Ponto de Venda para NitroBeer",
  manifest: "/manifest.json",
  themeColor: "#fbbf24",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NitroBeer POS",
  },
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
