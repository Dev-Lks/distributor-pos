"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, Activity } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"

interface AppShellProps {
  children: React.ReactNode
  currentView: string
  onViewChange: (view: string) => void
  onLogout: () => void
  metrics?: {
    dailySales: number
    lowStockCount: number
    isOnline: boolean
  }
}

export function AppShell({ children, currentView, onViewChange, onLogout, metrics }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header profissional */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">NitroBeer POS</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>Sistema de Vendas</span>
                {metrics?.isOnline && (
                  <Badge variant="outline" className="pos-status-high text-xs">
                    Online
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Métricas rápidas no header */}
          {metrics && (
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">R$ {metrics.dailySales.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Vendas hoje</div>
              </div>
              {metrics.lowStockCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metrics.lowStockCount} alertas
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={onLogout} className="gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Navegação por abas - desktop */}
      <div className="hidden md:block border-b bg-card/50">
        <div className="px-6 py-3">
          <Tabs value={currentView} onValueChange={onViewChange}>
            <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-secondary/50">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Painel
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Vendas
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Estoque
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Histórico
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Relatórios
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1 p-6 pb-20 md:pb-6 max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
