"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingCart, Package, Receipt, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useProducts } from "@/lib/useProducts"
import { useCashSession } from "@/lib/useCashSession"

interface BottomNavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  matchPattern?: RegExp
  badge?: number | boolean
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { data: products = [] } = useProducts()
  const { session: cashSession } = useCashSession()

  // Contar alertas de estoque baixo
  const lowStockCount = products.filter(
    p => (p.inventory?.totalQuantity ?? 0) <= 10
  ).length

  // Verificar se tem sessão de caixa aberta
  const hasOpenCashSession = cashSession?.status === "OPEN"

  const navItems: BottomNavItem[] = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Painel",
      matchPattern: /^\/dashboard$/,
    },
    {
      href: "/dashboard/sales",
      icon: ShoppingCart,
      label: "Vendas",
      matchPattern: /^\/dashboard\/sales/,
      badge: hasOpenCashSession,
    },
    {
      href: "/dashboard/inventory",
      icon: Package,
      label: "Estoque",
      matchPattern: /^\/dashboard\/inventory/,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      href: "/dashboard/orders",
      icon: Receipt,
      label: "Pedidos",
      matchPattern: /^\/dashboard\/orders/,
    },
    {
      href: "/dashboard/settings",
      icon: Menu,
      label: "Menu",
      matchPattern: /^\/dashboard\/(settings|admin|themes|points|products|customers)/,
    },
  ]

  // Não mostrar em rotas específicas ou em desktop
  if (
    pathname.includes("/auth") ||
    pathname === "/" ||
    pathname === "/unauthorized"
  ) {
    return null
  }

  return (
    <>
      {/* Spacer para evitar que o conteúdo fique por baixo da bottom nav */}
      <div className="h-20 md:hidden" />
      
      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe md:hidden"
        role="navigation"
        aria-label="Navegação principal"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.matchPattern
              ? item.matchPattern.test(pathname)
              : pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 min-h-[56px] gap-1 transition-all duration-150",
                  "hover:bg-accent/50 active:scale-95 active:bg-accent",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                  
                  {/* Badge para notificações */}
                  {item.badge && (
                    <div className="absolute -top-1 -right-1">
                      {typeof item.badge === "number" ? (
                        <Badge
                          variant="destructive"
                          className="h-4 min-w-[16px] px-1 text-[10px] font-bold"
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                  )}
                </div>
                
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    isActive && "font-semibold"
                  )}
                >
                  {item.label}
                </span>

                {/* Indicador de página ativa */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-12 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
