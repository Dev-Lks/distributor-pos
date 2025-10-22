"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, Receipt, DollarSign, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

const periodOptions = [
  { value: "today", label: "Hoje", emoji: "📅" },
  { value: "week", label: "Esta semana", emoji: "📊" },
  { value: "month", label: "Este mês", emoji: "🗓️" },
  { value: "year", label: "Este ano", emoji: "📈" }
] as const

export type DashboardPeriod = (typeof periodOptions)[number]["value"]

interface DashboardHeaderProps {
  period: DashboardPeriod
  onPeriodChange: (value: DashboardPeriod) => void
  quickStats?: {
    sessionDuration?: string
    todaySales?: string
    alertsCount?: number
  }
}

export function DashboardHeader({ period, onPeriodChange, quickStats }: DashboardHeaderProps) {
  const { data: session } = useSession()

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  // Get current date formatted
  const getCurrentDate = () => {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const firstName = session?.user?.name?.split(" ")[0] || "Operador"

  return (
    <div className="space-y-5">
      {/* Main Header - Greeting and Period Selector */}
      <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {getGreeting()}, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {getCurrentDate()}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => onPeriodChange(value as DashboardPeriod)}>
            <SelectTrigger className="w-full sm:w-[180px] border-primary/20">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent align="end">
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{option.emoji}</span>
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {/* Session Duration */}
        {quickStats?.sessionDuration && (
          <div className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur transition-all hover:border-primary/30 hover:bg-card/80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Sessão</p>
              <p className="font-semibold truncate">{quickStats.sessionDuration}</p>
            </div>
          </div>
        )}

        {/* Today's Sales */}
        {quickStats?.todaySales && (
          <div className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur transition-all hover:border-primary/30 hover:bg-card/80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Vendas Hoje</p>
              <p className="font-semibold truncate text-green-600 dark:text-green-400">
                {quickStats.todaySales}
              </p>
            </div>
          </div>
        )}

        {/* Stock Alerts */}
        {quickStats?.alertsCount !== undefined && quickStats.alertsCount > 0 && (
          <div className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur transition-all hover:border-primary/30 hover:bg-card/80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
              <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Alertas</p>
              <Badge className="mt-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30">
                {quickStats.alertsCount}
              </Badge>
            </div>
          </div>
        )}

        {/* Quick Action Button */}
        <div className="group flex items-center gap-3 rounded-lg border-2 border-dashed border-primary/30 bg-card/20 p-4 backdrop-blur transition-all hover:border-primary/60 hover:bg-card/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">Status</p>
            <p className="font-semibold text-xs">Operacional</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <Link href="/dashboard/sales">
          <Button size="sm" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Venda</span>
            <span className="inline sm:hidden">Venda</span>
          </Button>
        </Link>
        <Link href="/dashboard/inventory">
          <Button size="sm" variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Estoque</span>
            <span className="inline sm:hidden">Estq.</span>
          </Button>
        </Link>
        <Link href="/dashboard/orders">
          <Button size="sm" variant="outline" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Encomendas</span>
            <span className="inline sm:hidden">Enc.</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
