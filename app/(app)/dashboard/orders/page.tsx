"use client"

import { useState } from "react"
import { useOrders, useOrderStats, OrderStatus, OrderPriority } from "@/lib/useOrders"
import { OrderCard } from "@/components/orders/OrderCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Filter, Download, Calendar as CalendarIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function OrdersPage() {
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<OrderPriority | "ALL">("ALL")
  const [viewMode, setViewMode] = useState<"all" | "kanban" | "list">("all")

  const { data: stats, isLoading: statsLoading } = useOrderStats()
  const { data: orders, isLoading: ordersLoading } = useOrders({
    search: search || undefined,
    priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
  })

  const filterOrdersByStatus = (status: OrderStatus | "ALL") => {
    if (!orders) return []
    if (status === "ALL") return orders
    return orders.filter((o) => o.status === status)
  }

  return (
    <div className="container mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Encomendas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie pedidos especiais e sob encomenda
          </p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button size="lg" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nova Encomenda</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total de Encomendas
            </div>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalOrders}</div>
          </div>
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="text-xs sm:text-sm font-medium text-muted-foreground">
              Em Andamento
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.pendingOrders + stats.confirmedOrders + stats.preparingOrders}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="text-xs sm:text-sm font-medium text-muted-foreground">
              Prontas
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.readyOrders}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="text-xs sm:text-sm font-medium text-muted-foreground">
              {stats.overdueOrders > 0 ? "Atrasadas" : "Receita Total"}
            </div>
            <div className={cn(
              "text-xl sm:text-2xl font-bold",
              stats.overdueOrders > 0 ? "text-red-600 dark:text-red-400" : ""
            )}>
              {stats.overdueOrders > 0 ? stats.overdueOrders : (
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: 0,
                }).format(stats.totalRevenue)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            <SelectItem value="URGENT">Urgente</SelectItem>
            <SelectItem value="HIGH">Alta</SelectItem>
            <SelectItem value="MEDIUM">Média</SelectItem>
            <SelectItem value="LOW">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* Orders List */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-auto w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg p-1 md:grid md:w-full md:grid-cols-6">
            <TabsTrigger value="all" className="text-xs sm:text-sm shrink-0">
              <span className="hidden sm:inline">Todas</span>
              <span className="sm:hidden">All</span>
              {!ordersLoading && orders && (
                <span className="ml-1 sm:ml-1.5 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-xs">
                  {orders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="PENDING" className="text-xs sm:text-sm shrink-0">
              <span className="hidden sm:inline">Pendentes</span>
              <span className="sm:hidden">Pend</span>
              {!ordersLoading && orders && (
                <span className="ml-1 sm:ml-1.5 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-xs">
                  {filterOrdersByStatus("PENDING").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="CONFIRMED" className="text-xs sm:text-sm shrink-0">
              <span className="hidden sm:inline">Confirmadas</span>
              <span className="sm:hidden">Conf</span>
              {!ordersLoading && orders && (
                <span className="ml-1 sm:ml-1.5 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-xs">
                  {filterOrdersByStatus("CONFIRMED").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="PREPARING" className="text-xs sm:text-sm shrink-0">
              <span className="hidden sm:inline">Preparando</span>
              <span className="sm:hidden">Prep</span>
              {!ordersLoading && orders && (
                <span className="ml-1 sm:ml-1.5 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-xs">
                  {filterOrdersByStatus("PREPARING").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="READY" className="text-xs sm:text-sm shrink-0">
              <span className="hidden sm:inline">Prontas</span>
              <span className="sm:hidden">Ready</span>
              {!ordersLoading && orders && (
                <span className="ml-1 sm:ml-1.5 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-xs">
                  {filterOrdersByStatus("READY").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="DELIVERED" className="text-xs sm:text-sm shrink-0">
              <span className="hidden sm:inline">Entregues</span>
              <span className="sm:hidden">Entr</span>
              {!ordersLoading && orders && (
                <span className="ml-1 sm:ml-1.5 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-xs">
                  {filterOrdersByStatus("DELIVERED").length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando encomendas...</p>
            </div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma encomenda encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie sua primeira encomenda clicando no botão acima.
            </p>
          </div>
        ) : (
          <>
            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </TabsContent>

            {(["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"] as OrderStatus[]).map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filterOrdersByStatus(status).map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </>
        )}
      </Tabs>
    </div>
  )
}
