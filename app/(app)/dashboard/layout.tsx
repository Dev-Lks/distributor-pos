import type { ReactNode } from "react"

import { SidebarLayout } from "@/components/SidebarLayout"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { ThemeProvider } from "@/components/ThemeProvider"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { FloatingActionButton } from "@/components/FloatingActionButton"

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
