"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

// Mapeamento de rotas para labels amigáveis
const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/sales": "PDV",
  "/dashboard/sales/ledger": "Registro de Vendas",
  "/dashboard/delivery": "Delivery",
  "/dashboard/clientes": "Clientes",
  "/dashboard/orders": "Encomendas",
  "/dashboard/bonificacoes": "Bonificações",
  "/dashboard/inventory": "Inventário",
  "/dashboard/inventory-by-point": "Inventário por Ponto",
  "/dashboard/products": "Produtos",
  "/dashboard/reports/daily": "Relatórios Z",
  "/dashboard/reports/sales": "Análise de Vendas",
  "/dashboard/points": "Pontos de Venda",
  "/dashboard/settings": "Preferências",
  "/dashboard/admin/users": "Usuários",
}

export function Breadcrumb({ 
  items, 
  className,
  showHome = true 
}: BreadcrumbProps) {
  const pathname = usePathname()

  // Gerar breadcrumbs automaticamente a partir da rota
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const parts = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    let currentPath = ""
    for (const part of parts) {
      currentPath += `/${part}`
      
      // Pular partes que não são relevantes ou já foram cobertas
      if (part === "app" || part === "dashboard") {
        if (part === "dashboard" && showHome) {
          breadcrumbs.push({
            label: "Dashboard",
            href: "/dashboard",
          })
        }
        continue
      }

      const label = routeLabels[currentPath] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ")
      breadcrumbs.push({
        label,
        href: currentPath,
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = items || generateBreadcrumbs()

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav
      className={cn(
        "flex items-center gap-1 text-sm",
        className
      )}
      aria-label="Breadcrumb"
    >
      {showHome && !items && (
        <>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Ir para Dashboard"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
          {breadcrumbs.length > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          )}
        </>
      )}

      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1

        return (
          <div key={item.href} className="flex items-center gap-1">
            {isLast ? (
              <span
                className="font-medium text-foreground truncate"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <>
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px] lg:max-w-[200px]"
                >
                  {item.label}
                </Link>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </>
            )}
          </div>
        )
      })}
    </nav>
  )
}
