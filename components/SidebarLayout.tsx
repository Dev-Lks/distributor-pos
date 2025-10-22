"use client"

import type { ComponentType, ReactNode } from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { logger } from "@/lib/logger"
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Menu,
  Package2,
  FileText,
  Settings,
  ShoppingCart,
  Store,
  Users2,
  UserRound,
  X,
  Receipt,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  DollarSign,
  LogOut,
  User,
  Bell,
  Truck,
  Gift,
  Home,
  Zap,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeTogglePopover } from "./ThemeTogglePopover"
import { signOut, useSession } from "next-auth/react"
import { useCashSession } from "@/hooks/useCashSession"
import { usePermissions } from "@/hooks/usePermissions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/Breadcrumb"
import { SidebarNotifications } from "@/components/SidebarNotifications"
import { useInAppNotifications } from "@/hooks/useInAppNotifications"

interface SidebarLayoutProps {
  children: ReactNode
}

interface NavItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  badge?: string
  permission?: keyof ReturnType<typeof usePermissions>["can"]
}

const navItems: Array<{
  id: string
  label: string
  items: NavItem[]
  icon?: ComponentType<{ className?: string }>
}> = [
  {
    id: "main",
    label: "Principal",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: BarChart3,
        permission: "viewDashboard"
      }
    ]
  },
  {
    id: "sales",
    label: "Vendas",
    icon: ShoppingCart,
    items: [
      {
        label: "PDV",
        href: "/dashboard/sales",
        icon: ShoppingCart,
        badge: "Live",
        permission: "createSales"
      },
      {
        label: "Delivery",
        href: "/dashboard/delivery",
        icon: Truck,
        badge: "Novo",
        permission: "viewDeliveries"
      },
      {
        label: "Registro de Vendas",
        href: "/dashboard/sales/ledger",
        icon: FileText,
        permission: "viewOwnSales"
      }
    ]
  },
  {
    id: "customers",
    label: "Clientes",
    icon: Users2,
    items: [
      {
        label: "Clientes",
        href: "/dashboard/clientes",
        icon: UserRound,
        permission: "viewCustomers"
      },
      {
        label: "Encomendas",
        href: "/dashboard/orders",
        icon: Receipt,
        permission: "viewOrders"
      },
      {
        label: "Bonificações",
        href: "/dashboard/bonificacoes",
        icon: Gift,
        permission: "viewCustomers"
      }
    ]
  },
  {
    id: "inventory",
    label: "Estoque",
    icon: Package2,
    items: [
      {
        label: "Inventário",
        href: "/dashboard/inventory",
        icon: Package2,
        permission: "viewInventory"
      },
      {
        label: "Por Ponto",
        href: "/dashboard/inventory-by-point",
        icon: Store,
        permission: "viewInventory"
      },
      {
        label: "Produtos",
        href: "/dashboard/products",
        icon: Building2,
        permission: "viewProducts"
      }
    ]
  },
  {
    id: "reports",
    label: "Relatórios",
    icon: FileText,
    items: [
      {
        label: "Relatórios Z",
        href: "/dashboard/reports/daily",
        icon: FileText,
        permission: "viewReports"
      },
      {
        label: "Análise de Vendas",
        href: "/dashboard/reports/sales",
        icon: ListChecks,
        permission: "viewReports"
      }
    ]
  },
  {
    id: "settings",
    label: "Configuração",
    icon: Settings,
    items: [
      {
        label: "Pontos de Venda",
        href: "/dashboard/points",
        icon: Users2,
        permission: "viewPointsOfSale"
      },
      {
        label: "Preferências",
        href: "/dashboard/settings",
        icon: Settings,
        permission: "viewSettings"
      }
    ]
  },
  {
    id: "admin",
    label: "Administração",
    icon: User,
    items: [
      {
        label: "Usuários",
        href: "/dashboard/admin/users",
        icon: User,
        permission: "manageUsers"
      }
    ]
  }
]

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { data: session } = useSession()
  const { session: cashSession } = useCashSession()
  const { can, isAdmin } = usePermissions()
  const {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useInAppNotifications()

  logger.debug("SidebarLayout render", {
    isAdmin,
    email: session?.user?.email,
  })

  // Filtrar seções e itens baseado nas permissões do usuário
  const filteredNavItems = useMemo(() => {
    return navItems
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.permission) return true
          if (isAdmin) return true
          return item.permission in can && can[item.permission as keyof typeof can]
        }),
      }))
      .filter((section) => section.items.length > 0)
  }, [can, isAdmin])

  const flatNav = useMemo(
    () => filteredNavItems.flatMap((section) => section.items),
    [filteredNavItems]
  )

  const activeItem = useMemo(() => {
    const exactMatch = flatNav.find((item) => pathname === item.href)
    if (exactMatch) return exactMatch

    const sortedNav = [...flatNav].sort((a, b) => b.href.length - a.href.length)
    const subRouteMatch = sortedNav.find((item) => {
      if (item.href === "/dashboard") return false
      return pathname.startsWith(`${item.href}/`)
    })

    return subRouteMatch ?? flatNav[0]
  }, [flatNav, pathname])

  const activeSection = useMemo(() => {
    return filteredNavItems.find((section) =>
      section.items.some((item) => item === activeItem)
    )
  }, [activeItem, filteredNavItems])

  const closeMobile = () => setIsMobileOpen(false)

  const formatDuration = (openedAt: string | Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(openedAt).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/70 bg-card/95 backdrop-blur transition-all duration-300 md:relative md:translate-x-0",
          isCollapsed ? "w-20" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-lg font-bold text-white">
              🍺
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">NitroBeer</p>
                <p className="truncate text-xs text-muted-foreground">POS</p>
              </div>
            )}
          </Link>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="hidden h-8 w-8 md:flex"
            onClick={() => setIsCollapsed((prev) => !prev)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 md:hidden"
            onClick={closeMobile}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {filteredNavItems.map((section) => (
            <div key={section.id}>
              {/* Section Label */}
              {!isCollapsed && section.id !== "main" && (
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {section.label}
                </p>
              )}

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = activeItem === item
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/15 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        isCollapsed && "justify-center px-2"
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && (
                        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto h-5 shrink-0 rounded-full px-1.5 text-[10px] font-medium"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="absolute inset-y-2 right-2 w-1 rounded-full bg-primary" />
                      )}
                    </Link>
                  )
                })}
              </div>

              {/* Separator between sections */}
              {!isCollapsed && section.id !== "main" && section.id !== navItems[navItems.length - 1].id && (
                <Separator className="my-3" />
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border/70 px-2 py-4 space-y-3">
          {/* Quick Actions */}
          {!isCollapsed && (
            <div className="space-y-2 text-xs">
              {cashSession && (
                <div className="rounded-lg bg-muted/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <DollarSign className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">Caixa Aberto</p>
                      <p className="text-muted-foreground text-xs">
                        {formatDuration(cashSession.openedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Online Status */}
              <div className="rounded-lg bg-muted/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-foreground font-medium">Online</span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          )}

          {/* Theme Toggle */}
          <div className={cn(
            "flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2",
            isCollapsed && "justify-center"
          )}>
            {!isCollapsed && (
              <span className="text-sm font-medium">Tema</span>
            )}
            <ThemeTogglePopover />
          </div>
        </div>

        {/* User Profile Section */}
        <div className="border-t border-border/70 p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-primary/20 text-xs font-semibold">
                    {(session?.user?.name ?? session?.user?.email ?? "N")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium truncate">
                      {session?.user?.name ?? "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session?.user?.email ?? "email@example.com"}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              {session?.user?.isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Zap className="mr-2 h-4 w-4" />
                    <span>Painel Admin</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 w-9 md:hidden shrink-0"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
              {activeSection && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {activeSection.label}
                  </p>
                  <h1 className="text-lg font-semibold leading-tight truncate">
                    {activeItem?.label}
                  </h1>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SidebarNotifications
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onRemove={removeNotification}
                onClearAll={clearAll}
                isCollapsed={isCollapsed}
              />
              <Button asChild size="sm" className="hidden md:flex gap-2">
                <Link href="/dashboard/sales">
                  <Zap className="h-4 w-4" />
                  Novo PDV
                </Link>
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="border-t border-border/70 bg-background/50 px-4 py-2 md:px-6">
            <Breadcrumb className="text-xs" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="px-4 py-6 md:px-6 md:py-8">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}