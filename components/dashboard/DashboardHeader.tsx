"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
}

export function DashboardHeader({ period, onPeriodChange }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Acompanhe vendas, estoque e desempenho em tempo real
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <span className="text-xs text-muted-foreground sm:text-sm">Atualizado a cada 5 minutos</span>
        <Select value={period} onValueChange={(value) => onPeriodChange(value as DashboardPeriod)}>
          <SelectTrigger className="w-full sm:w-48">
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
  )
}
