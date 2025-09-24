"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "./ThemeToggle"
import {
  BarChart3,
  ShoppingCart,
  Package,
  Menu,
  X,
  Home,
  TrendingUp,
  Users,
  Settings
} from "lucide-react"

interface SidebarProps {
  children: React.ReactNode
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Visão geral"
  },
  {
    name: "Vendas",
    href: "/sales",
    icon: ShoppingCart,
    description: "Ponto de venda"
  },
  {
    name: "Inventário",
    href: "/inventory",
    icon: Package,
    description: "Controle de estoque"
  },
  {
    name: "Produtos",
    href: "/products",
    icon: Package,
    description: "Gerenciar produtos"
  },
  {
    name: "Estoque por Ponto",
    href: "/inventory-by-point",
    icon: Package,
    description: "Estoque específico por ponto"
  },
  {
    name: "Pontos de Venda",
    href: "/points",
    icon: Settings,
    description: "Configurar pontos"
  }
]

export function SidebarLayout({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Temporariamente revertido
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-12 md:w-16" : "w-48 md:w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-12 md:h-16 items-center justify-between px-2 md:px-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                🍺
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm md:text-lg font-bold">NitroBeer</h1>
                <p className="text-xs text-muted-foreground">POS System</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-6 h-6 md:w-8 md:h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto">
              🍺
            </div>
          )}

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex h-6 w-6 md:h-8 md:w-8 p-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Menu className="h-3 w-3 md:h-4 md:w-4" />
          </Button>

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-6 w-6 md:h-8 md:w-8 p-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 md:px-3 py-2 md:py-4 space-y-1 md:space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                  sidebarCollapsed && "justify-center px-1 md:px-2"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0 hidden md:block">
                    <div className="truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 md:p-3 border-t">
          {!sidebarCollapsed && (
            <div className="text-xs text-muted-foreground text-center hidden md:block">
              Versão 2.0
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "md:ml-12 lg:ml-16" : "md:ml-48 lg:ml-64"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
          <div className="flex h-12 md:h-16 items-center justify-between px-2 md:px-4 lg:px-6">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-6 w-6 md:h-8 md:w-8 p-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-3 w-3 md:h-5 md:w-5" />
            </Button>

            {/* Desktop collapse button */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex h-6 w-6 md:h-8 md:w-8 p-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-4 ml-auto">
              <ThemeToggle />
              <Badge variant="outline" className="hidden sm:flex text-xs">
                Online
              </Badge>
              <div className="hidden md:block text-xs md:text-sm text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-2 md:p-4 lg:p-6 max-w-full md:max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}