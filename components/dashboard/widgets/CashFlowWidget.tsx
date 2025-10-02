"use client"

import { DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { useCashSession } from "@/lib/useCashSession"

export function CashFlowWidget() {
  const { session, isLoading, refetch } = useCashSession()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Nenhum caixa aberto</p>
            <p className="text-xs text-muted-foreground mt-1">
              Abra um caixa para começar a registrar movimentações
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDuration = (openedAt: string | Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(openedAt).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  const currentBalance = session.runningBalance
  const openingBalance = session.openingAmount
  const salesTotal = session.totals.cashPayments + session.totals.nonCashPayments

  const netChange = currentBalance - openingBalance
  const percentChange = openingBalance > 0 
    ? ((netChange / openingBalance) * 100).toFixed(1)
    : '0.0'

  // Criar dados do gráfico baseado no histórico de vendas (simplificado)
  const chartData = [
    { value: openingBalance },
    { value: openingBalance + (salesTotal * 0.2) },
    { value: openingBalance + (salesTotal * 0.4) },
    { value: openingBalance + (salesTotal * 0.6) },
    { value: openingBalance + (salesTotal * 0.8) },
    { value: currentBalance },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Fluxo de Caixa</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(session.openedAt)}</span>
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
                R$ {currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
                +R$ {salesTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg bg-amber-500/5 p-3">
              <p className="text-xs text-muted-foreground">Abertura</p>
              <p className="mt-1 font-semibold">
                R$ {openingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {session.totals.supplies > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Suprimentos</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                +R$ {session.totals.supplies.toFixed(2)}
              </span>
            </div>
          )}

          {session.totals.withdrawals > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sangrias</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -R$ {session.totals.withdrawals.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}