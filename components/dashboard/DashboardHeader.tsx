"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Package, Receipt, DollarSign, Clock } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

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
    <div className="space-y-6">
      {/* Greeting and Date */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {getCurrentDate()}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => onPeriodChange(value as DashboardPeriod)}>
            <SelectTrigger className="w-[180px]">
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

      {/* Quick Stats & Actions Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Quick Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {quickStats?.sessionDuration && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Sessão atual</p>
                <p className="font-semibold">{quickStats.sessionDuration}</p>
              </div>
            </div>
          )}
          {quickStats?.todaySales && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Vendas hoje</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {quickStats.todaySales}
                </p>
              </div>
            </div>
          )}
          {quickStats?.alertsCount !== undefined && quickStats.alertsCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
              <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs text-muted-foreground">Alertas</p>
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  {quickStats.alertsCount}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="default">
            <Link href="/dashboard/sales">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nova Venda
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/orders/new">
              <Receipt className="mr-2 h-4 w-4" />
              Nova Encomenda
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/inventory">
              <Package className="mr-2 h-4 w-4" />
              Entrada Estoque
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
