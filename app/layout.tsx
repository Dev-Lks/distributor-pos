import type React from "react"
import type { Metadata, Viewport } from "next"
import { getServerSession } from "next-auth"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthSessionProvider } from "@/components/AuthSessionProvider"
import { QueryProvider } from "@/components/QueryProvider"
import { PWAInstall } from "@/components/PWAInstall"
import { Toaster } from "@/components/ui/sonner"
import { authOptions } from "@/lib/auth"

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>
        <AuthSessionProvider session={session}>
          <QueryProvider>{children}</QueryProvider>
          <PWAInstall />
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  )
}
