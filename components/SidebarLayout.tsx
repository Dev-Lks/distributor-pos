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
  Bell
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeTogglePopover } from "./ThemeTogglePopover"
import { signOut, useSession } from "next-auth/react"
import { useCashSession } from "@/lib/useCashSession"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
    heading: "Operacional",
    items: [
      {
        label: "Dashboard",
        description: "Indicadores consolidados",
        href: "/dashboard",
        icon: BarChart3
      },
      {
        label: "Encomendas",
        description: "Pedidos especiais",
        href: "/dashboard/orders",
        icon: Receipt,
        tag: "Novo"
      },
      {
        label: "Clientes",
        description: "Cadastro e bonificações",
        href: "/dashboard/customers",
        icon: UserRound
      }
    ]
  },
  {
    heading: "Vendas",
    items: [
      {
        label: "PDV",
        description: "Ponto de venda rápido",
        href: "/dashboard/sales",
        icon: ShoppingCart,
        tag: "Live"
      },
      {
        label: "Registro de Vendas",
        description: "Histórico e auditoria",
        href: "/dashboard/sales/ledger",
        icon: FileText,
        tag: "Novo"
      }
    ]
  },
  {
    heading: "Estoque",
    items: [
      {
        label: "Inventário",
        description: "Controle de lotes e saldos",
        href: "/dashboard/inventory",
        icon: Package2
      },
      {
        label: "Por Ponto",
        description: "Distribuição por unidade",
        href: "/dashboard/inventory-by-point",
        icon: Store
      },
      {
        label: "Produtos",
        description: "Ficha técnica e preços",
        href: "/dashboard/products",
        icon: Building2
      }
    ]
  },
  {
    heading: "Relatórios",
    items: [
      {
        label: "Relatórios Z",
        description: "Fechamentos diários",
        href: "/dashboard/reports/daily",
        icon: FileText
      },
      {
        label: "Análise de Vendas",
        description: "Relatórios e estatísticas",
        href: "/dashboard/reports/sales",
        icon: ListChecks
      }
    ]
  },
  {
    heading: "Configurações",
    items: [
      {
        label: "Pontos de Venda",
        description: "Configuração dos PDVs",
        href: "/dashboard/points",
        icon: Users2
      },
      {
        label: "Preferências",
        description: "Configurações do sistema",
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
  const { data: session } = useSession()
  const { session: cashSession } = useCashSession()
  const [isOnline, setIsOnline] = useState(true)

  const flatNav = useMemo(() => navSections.flatMap((section) => section.items), [])

  const activeItem = useMemo(
    () => {
      // Primeiro, tentar correspondência exata
      const exactMatch = flatNav.find((item) => pathname === item.href)
      if (exactMatch) return exactMatch

      // Depois, tentar correspondência de subrotas (mais específico primeiro)
      // Ordenar por comprimento de href (mais longo primeiro) para pegar rotas mais específicas
      const sortedNav = [...flatNav].sort((a, b) => b.href.length - a.href.length)
      
      const subRouteMatch = sortedNav.find((item) => {
        // Dashboard só fica ativo na rota exata (já verificado acima)
        if (item.href === "/dashboard") return false
        
        // Verificar se pathname começa com o href + /
        return pathname.startsWith(`${item.href}/`)
      })
      
      return subRouteMatch ?? flatNav[0]
    },
    [flatNav, pathname]
  )

  const activeSection = useMemo(
    () => navSections.find((section) => section.items.some((item) => item === activeItem)) ?? navSections[0],
    [activeItem]
  )

  const closeMobile = () => setIsMobileOpen(false)

  // Format cash session duration
  const formatDuration = (openedAt: string | Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(openedAt).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

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
          <div className="space-y-3">
            {/* Status Indicators */}
            {!isCollapsed && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1">
                    {isOnline ? (
                      <>
                        <Wifi className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">Offline</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Sincronizado</span>
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-3">
              {!isCollapsed && (
                <div>
                  <p className="text-sm font-semibold">Temas</p>
                  <p className="text-xs text-muted-foreground">Escolha seu estilo</p>
                </div>
              )}
              <ThemeTogglePopover />
            </div>

            {/* Version */}
            {!isCollapsed && (
              <p className="text-center text-[11px] text-muted-foreground">
                NitroBeer • Versão 2.5.0
              </p>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="border-t border-border/70 px-4 py-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl transition-colors hover:bg-muted/60"
              >
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-amber-500/20 text-lg font-semibold text-amber-600 dark:text-amber-400">
                    {(session?.user?.name ?? session?.user?.email ?? "N").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{session?.user?.name ?? "Operador(a) NitroBeer"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {session?.user?.email ?? "Sem e-mail cadastrado"}
                    </p>
                    {session?.user?.role && (
                      <Badge className="mt-1 bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        {session.user.role.toUpperCase()}
                      </Badge>
                    )}
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
              {cashSession ? (
                <DropdownMenuItem>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Caixa Aberto</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(cashSession.openedAt)}
                    </span>
                  </div>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>Abrir Caixa</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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