"use client"

import type { ComponentType, ReactNode } from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Package2,
  Settings,
  ShoppingCart,
  Store,
  Users2,
  X
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./ThemeToggle"

interface SidebarLayoutProps {
  children: ReactNode
}

interface NavItem {
  label: string
  description?: string
  href: string
  icon: ComponentType<{ className?: string }>
  tag?: string
}

const navSections: Array<{
  heading: string
  items: NavItem[]
}> = [
  {
    heading: "Principal",
    items: [
      {
        label: "Visão geral",
        description: "Indicadores consolidados",
        href: "/dashboard",
        icon: BarChart3
      },
      {
        label: "Ponto de venda",
        description: "Registrador rápido",
        href: "/dashboard/sales",
        icon: ShoppingCart,
        tag: "Live"
      }
    ]
  },
  {
    heading: "Operações",
    items: [
      {
        label: "Estoque geral",
        description: "Controle de lotes e saldos",
        href: "/dashboard/inventory",
        icon: Package2
      },
      {
        label: "Estoque por ponto",
        description: "Distribuição por unidade",
        href: "/dashboard/inventory-by-point",
        icon: Store
      },
      {
        label: "Produtos",
        description: "Ficha técnica e preços",
        href: "/dashboard/products",
        icon: Building2
      },
      {
        label: "Pontos de venda",
        description: "Configuração dos PDVs",
        href: "/dashboard/points",
        icon: Users2
      }
    ]
  },
  {
    heading: "Sistema",
    items: [
      {
        label: "Configurações",
        description: "Preferências e integrações",
        href: "/dashboard/settings",
        icon: Settings
      }
    ]
  }
]

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const flatNav = useMemo(() => navSections.flatMap((section) => section.items), [])

  const activeItem = useMemo(
    () =>
      flatNav.find((item) => {
        if (pathname === item.href) return true
        if (item.href === "/dashboard") {
          return pathname === "/dashboard"
        }
        return pathname.startsWith(`${item.href}/`)
      }) ?? flatNav[0],
    [flatNav, pathname]
  )

  const activeSection = useMemo(
    () => navSections.find((section) => section.items.some((item) => item === activeItem)) ?? navSections[0],
    [activeItem]
  )

  const closeMobile = () => setIsMobileOpen(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/40 via-background to-background text-foreground">
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-border/70 bg-card/95 backdrop-blur transition-[width,transform] duration-300",
          isCollapsed ? "w-20" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-2xl">🍺</div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-semibold tracking-tight">NitroBeer POS</p>
                <p className="text-xs text-muted-foreground">Operações em tempo real</p>
              </div>
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="hidden h-10 w-10 md:flex"
            onClick={() => setIsCollapsed((state) => !state)}
          >
            {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            <span className="sr-only">Alternar largura do menu</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-muted-foreground md:hidden"
            onClick={closeMobile}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fechar menu</span>
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
          {navSections.map((section) => (
            <div key={section.heading} className="space-y-2">
              {!isCollapsed && (
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                  {section.heading}
                </p>
              )}
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const isActive = activeItem === item
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      className={cn(
                        "group relative flex items-center gap-3 overflow-hidden rounded-xl border border-transparent px-3 py-3 text-sm font-medium transition-all",
                        isActive
                          ? "border-amber-500/40 bg-amber-500/10 text-foreground shadow-inner"
                          : "text-muted-foreground hover:border-border/60 hover:bg-muted/60 hover:text-foreground",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && (
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{item.label}</span>
                            {item.tag && (
                              <Badge variant="secondary" className="h-5 rounded-full px-2 text-[11px]">
                                {item.tag}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="truncate text-xs text-muted-foreground/80">{item.description}</p>
                          )}
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute inset-y-2 right-2 w-1 rounded-full bg-amber-500/80" aria-hidden />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border/70 px-3 py-4">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-3">
            {!isCollapsed && (
              <div>
                <p className="text-sm font-semibold">Modo escuro</p>
                <p className="text-xs text-muted-foreground">Personalize a interface</p>
              </div>
            )}
            <ThemeToggle />
          </div>
          {!isCollapsed && (
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              NitroBeer • Versão 2.5
            </p>
          )}
        </div>
      </aside>

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          isCollapsed ? "md:pl-20" : "md:pl-72"
        )}
      >
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 md:hidden"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir navegação</span>
              </Button>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{activeSection.heading}</p>
                <h1 className="text-xl font-semibold leading-tight">{activeItem.label}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden text-xs md:inline-flex">
                Sessão segura
              </Badge>
              <Button asChild size="sm" className="hidden md:inline-flex">
                <Link href="/dashboard/sales">Nova venda</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}