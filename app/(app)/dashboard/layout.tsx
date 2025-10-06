import type { ReactNode } from "react"

import { SidebarLayout } from "@/components/SidebarLayout"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { ThemeProvider } from "@/components/ThemeProvider"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { FloatingActionButton } from "@/components/FloatingActionButton"

// Forçar revalidação para evitar cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ThemeProvider>
      <SidebarLayout>
        {children}
        <PWAInstallPrompt />
        <MobileBottomNav />
        <FloatingActionButton />
      </SidebarLayout>
    </ThemeProvider>
  )
}
