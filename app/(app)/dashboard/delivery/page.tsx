"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  Users,
  ArrowUpRight,
} from "lucide-react"
import { useDeliveries } from "@/hooks/useDeliveries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/EmptyState"
import { Loader } from "@/components/Loader"
import { DeliveryPrintButtons } from "./components/DeliveryPrintButtons"

type DeliveryStatus =
  | "PENDING"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
type StatusConfig = {
  label: string
  color: string
  icon: typeof Package
}

const statusConfig: Record<DeliveryStatus, StatusConfig> = {
  PENDING: {
    label: "Pendente",
    color:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800",
    icon: Clock,
  },
  PREPARING: {
    label: "Preparando",
    color:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
    icon: Package,
  },
  READY_FOR_PICKUP: {
    label: "Pronto",
    color:
      "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
    icon: Package,
  },
  IN_TRANSIT: {
    label: "Em trânsito",
    color:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
    icon: Truck,
  },
  DELIVERED: {
    label: "Entregue",
    color:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelada",
    color:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    icon: XCircle,
  },
  FAILED: {
    label: "Falhou",
    color:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    icon: XCircle,
  },
}

const statusTabs: Array<DeliveryStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "PREPARING",
  "READY_FOR_PICKUP",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
]

export default function DeliveryPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "ALL">("ALL")

  const { data: deliveries, isLoading, error } = useDeliveries()

  const statusCounts = useMemo(() => {
    const counts: Record<DeliveryStatus, number> = {
      PENDING: 0,
      PREPARING: 0,
      READY_FOR_PICKUP: 0,
      IN_TRANSIT: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      FAILED: 0,
    }

    deliveries?.forEach((delivery) => {
      const status = delivery.status as DeliveryStatus
      if (counts[status] !== undefined) {
        counts[status] += 1
      }
    })

    return counts
  }, [deliveries])

  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return []

    return deliveries.filter((delivery) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        delivery.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.deliveryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.customerPhone?.includes(searchTerm) ||
        delivery.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.pointOfSaleName?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" || (delivery.status as DeliveryStatus) === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [deliveries, searchTerm, statusFilter])

  const stats = useMemo(() => {
    if (!deliveries) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
        avgDeliveryFee: 0,
        avgRating: 0,
      }
    }

    const inProgressStatuses: DeliveryStatus[] = [
      "PREPARING",
      "READY_FOR_PICKUP",
      "IN_TRANSIT",
    ]

    const delivered = deliveries.filter((delivery) => delivery.status === "DELIVERED")
    const totalRevenue = deliveries.reduce((sum, delivery) => sum + (delivery.total ?? 0), 0)
    const totalDeliveryFees = deliveries.reduce(
      (sum, delivery) => sum + (delivery.deliveryFee ?? 0),
      0,
    )
    const ratings = deliveries.filter((delivery) => delivery.rating)
    const totalRating = ratings.reduce((sum, delivery) => sum + (delivery.rating ?? 0), 0)

    return {
      total: deliveries.length,
      pending: statusCounts.PENDING,
      inProgress: deliveries.filter((delivery) =>
        inProgressStatuses.includes(delivery.status as DeliveryStatus),
      ).length,
      delivered: delivered.length,
      cancelled: statusCounts.CANCELLED + statusCounts.FAILED,
      totalRevenue,
      avgDeliveryFee: deliveries.length ? totalDeliveryFees / deliveries.length : 0,
      avgRating: ratings.length ? totalRating / ratings.length : 0,
    }
  }, [deliveries, statusCounts])

  const handleDeliveryClick = (deliveryId: string) => {
    router.push(`/dashboard/delivery/${deliveryId}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erro ao carregar entregas: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Entregas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe pedidos em tempo real e agilize o despacho com poucos cliques.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/delivery/drivers")}
            className="hidden sm:flex"
          >
            <Users className="mr-2 h-4 w-4" />
            Entregadores
          </Button>
          <Button onClick={() => router.push("/dashboard/delivery/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova entrega
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Card>
          <CardContent className="space-y-1 pt-6">
            <div className="text-xs uppercase text-muted-foreground">Total</div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900/60 dark:bg-yellow-950/20">
          <CardContent className="space-y-1 pt-6">
            <div className="text-xs uppercase text-yellow-700 dark:text-yellow-400">Pendentes</div>
            <div className="text-2xl font-semibold text-yellow-700 dark:text-yellow-300">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/20">
          <CardContent className="space-y-1 pt-6">
            <div className="text-xs uppercase text-blue-700 dark:text-blue-300">Em andamento</div>
            <div className="text-2xl font-semibold text-blue-700 dark:text-blue-200">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/20">
          <CardContent className="space-y-1 pt-6">
            <div className="text-xs uppercase text-green-700 dark:text-green-300">Entregues</div>
            <div className="text-2xl font-semibold text-green-700 dark:text-green-200">
              {stats.delivered}
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/20">
          <CardContent className="space-y-1 pt-6">
            <div className="text-xs uppercase text-red-700 dark:text-red-300">Canceladas</div>
            <div className="text-2xl font-semibold text-red-700 dark:text-red-200">
              {stats.cancelled}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <div className="text-xs uppercase text-muted-foreground">Receita</div>
            <div className="text-xl font-semibold">R$ {stats.totalRevenue.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <div className="text-xs uppercase text-muted-foreground">Taxa média</div>
            <div className="text-xl font-semibold">R$ {stats.avgDeliveryFee.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <div className="text-xs uppercase text-muted-foreground">Avaliação</div>
            <div className="flex items-center gap-1 text-xl font-semibold">
              ⭐ {stats.avgRating.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar por cliente, número, telefone, origem ou endereço..."
          className="pl-10"
        />
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as DeliveryStatus | "ALL")}
        className="space-y-4"
      >
        <TabsList className="w-full justify-start overflow-x-auto bg-muted/40 p-1">
          {statusTabs.map((status) => {
            const isAll = status === "ALL"
            const label = isAll ? "Todas" : statusConfig[status].label
            const count = isAll
              ? filteredDeliveries.length
              : statusCounts[status] ?? 0

            return (
              <TabsTrigger
                key={status}
                value={status}
                className="flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm"
              >
                {label}
                <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {count}
                </span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {filteredDeliveries.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nenhuma entrega encontrada"
          description={
            searchTerm || statusFilter !== "ALL"
              ? "Ajuste os filtros ou termos de busca."
              : "Cadastre sua primeira entrega e acompanhe aqui."
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredDeliveries.map((delivery) => {
            const statusInfo = statusConfig[delivery.status as DeliveryStatus]
            const StatusIcon = statusInfo?.icon ?? Package
            const scheduledLabel = delivery.scheduledFor
              ? new Date(delivery.scheduledFor).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null
            const createdLabel = new Date(delivery.createdAt).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <article
                key={delivery.id}
                className="rounded-xl border border-border/60 bg-card/70 shadow-sm transition hover:border-primary/40"
              >
                <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold text-foreground">
                        #{delivery.deliveryNumber}
                      </span>
                      <Badge
                        className={`flex items-center gap-1 border px-2 py-1 text-xs font-medium ${statusInfo?.color ?? ""}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo?.label ?? delivery.status}
                      </Badge>
                      {delivery.pointOfSaleName && (
                        <Badge variant="outline" className="text-xs">
                          Origem: {delivery.pointOfSaleName}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="text-base font-medium text-foreground">
                        {delivery.customerName}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {delivery.deliveryAddress}, {delivery.district} -
                          {delivery.city}
                          {delivery.state ? `/${delivery.state}` : ""}
                        </span>
                        {delivery.customerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {delivery.customerPhone}
                          </span>
                        )}
                        {delivery.driverName && (
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {delivery.driverName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Criado em {createdLabel}
                      </div>
                    </div>

                    <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-muted/40 bg-muted/10 p-3">
                        <div className="text-muted-foreground">Total</div>
                        <div className="text-sm font-semibold text-foreground">
                          R$ {(delivery.total ?? 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-muted/40 bg-muted/10 p-3">
                        <div className="text-muted-foreground">Taxa</div>
                        <div className="text-sm font-semibold text-foreground">
                          R$ {(delivery.deliveryFee ?? 0).toFixed(2)}
                        </div>
                      </div>
                      {typeof delivery.distance === "number" && (
                        <div className="rounded-lg border border-muted/40 bg-muted/10 p-3">
                          <div className="text-muted-foreground">Distância</div>
                          <div className="text-sm font-semibold text-foreground">
                            {delivery.distance.toFixed(2)} km
                          </div>
                        </div>
                      )}
                      {typeof delivery.estimatedTime === "number" && (
                        <div className="rounded-lg border border-muted/40 bg-muted/10 p-3">
                          <div className="text-muted-foreground">ETA</div>
                          <div className="text-sm font-semibold text-foreground">
                            {delivery.estimatedTime} min
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex min-w-[200px] flex-col items-end gap-3">
                    {delivery.rating && (
                      <div className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                        ★ {delivery.rating.toFixed(1)}
                      </div>
                    )}

                    {scheduledLabel && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {scheduledLabel}
                      </div>
                    )}

                    <DeliveryPrintButtons
                      deliveryId={delivery.id}
                      deliveryData={{
                        customer: {
                          name: delivery.customerName,
                          phone: delivery.customerPhone,
                        },
                        deliveryAddress: delivery.deliveryAddress,
                        addressNumber: "",
                        district: delivery.district,
                        city: delivery.city,
                        state: delivery.state ?? "SP",
                        items: [],
                        subtotal: delivery.subtotal,
                        deliveryFee: delivery.deliveryFee,
                        total: delivery.total,
                      }}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleDeliveryClick(delivery.id)}
                    >
                      Ver detalhes
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
