import type { ReactNode } from "react"

import { SidebarLayout } from "@/components/SidebarLayout"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { ThemeProvider } from "@/components/ThemeProvider"

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
      </SidebarLayout>
    </ThemeProvider>
  )
}
