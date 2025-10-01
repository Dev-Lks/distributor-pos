"use client"

import { DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, ResponsiveContainer } from "recharts"

interface CashFlowWidgetProps {
  currentSession?: {
    openedAt: Date
    duration: string
    openingBalance: number
    currentBalance: number
    salesTotal: number
    supplies: number
    withdrawals: number
  }
}

export function CashFlowWidget({ currentSession }: CashFlowWidgetProps) {
  // Mock data
  const session = currentSession || {
    openedAt: new Date(),
    duration: "3h 27min",
    openingBalance: 500,
    currentBalance: 3347.5,
    salesTotal: 2847.5,
    supplies: 0,
    withdrawals: 0,
  }

  const chartData = [
    { value: 500 },
    { value: 780 },
    { value: 1200 },
    { value: 1650 },
    { value: 2100 },
    { value: 2550 },
    { value: 2847.5 },
    { value: 3347.5 },
  ]

  const netChange = session.currentBalance - session.openingBalance
  const percentChange = ((netChange / session.openingBalance) * 100).toFixed(1)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Fluxo de Caixa</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{session.duration}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Saldo Atual */}
          <div>
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">
                R$ {session.currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span>+{percentChange}%</span>
              </div>
            </div>
          </div>

          {/* Mini Chart */}
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-500/5 p-3">
              <p className="text-xs text-muted-foreground">Vendas</p>
              <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                +R$ {session.salesTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg bg-amber-500/5 p-3">
              <p className="text-xs text-muted-foreground">Abertura</p>
              <p className="mt-1 font-semibold">
                R$ {session.openingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {session.supplies > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Suprimentos</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                +R$ {session.supplies.toFixed(2)}
              </span>
            </div>
          )}

          {session.withdrawals > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sangrias</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -R$ {session.withdrawals.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
