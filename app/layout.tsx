import type React from "react"
import type { Metadata, Viewport } from "next"
import { getServerSession } from "next-auth"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthSessionProvider } from "@/components/AuthSessionProvider"
import { QueryProvider } from "@/components/QueryProvider"
import { CustomerProvider } from "@/components/providers/CustomerProvider"
import { PWAInstall } from "@/components/PWAInstall"
import { ProgressBar } from "@/components/ProgressBar"
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
  minimumScale: 1,
  themeColor: "#fbbf24",
  viewportFit: "cover",
}

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <ProgressBar />
        <AuthSessionProvider session={session}>
          <QueryProvider>
            <CustomerProvider>
              {children}
            </CustomerProvider>
            <PWAInstall />
            <Toaster />
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
