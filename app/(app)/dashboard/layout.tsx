import type { ReactNode } from "react"

import { SidebarLayout } from "@/components/SidebarLayout"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <SidebarLayout>
      {children}
      <PWAInstallPrompt />
    </SidebarLayout>
  )
}
