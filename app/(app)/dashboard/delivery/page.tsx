"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin,
  Phone,
  Calendar,
  DollarSign
} from "lucide-react"
import { useDeliveries } from "@/lib/useDeliveries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/EmptyState"
import { Loader } from "@/components/Loader"

type DeliveryStatus = 
  | "PENDING" 
  | "PREPARING" 
  | "READY_FOR_PICKUP" 
  | "IN_TRANSIT" 
  | "DELIVERED" 
  | "CANCELLED" 
  | "FAILED"

const statusConfig: Record<DeliveryStatus, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  PREPARING: { label: "Preparando", color: "bg-purple-100 text-purple-800 border-purple-300", icon: Package },
  READY_FOR_PICKUP: { label: "Pronto", color: "bg-indigo-100 text-indigo-800 border-indigo-300", icon: Package },
  IN_TRANSIT: { label: "Em Trânsito", color: "bg-orange-100 text-orange-800 border-orange-300", icon: Truck },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
  FAILED: { label: "Falhou", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
}

export default function DeliveryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "ALL">("ALL")
  
  const { data: deliveries, isLoading, error } = useDeliveries()

  // Filtrar deliveries
  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return []
    
    return deliveries.filter((delivery) => {
      const matchesSearch = 
        searchTerm === "" ||
        delivery.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.deliveryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.customerPhone?.includes(searchTerm) ||
        delivery.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "ALL" || delivery.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [deliveries, searchTerm, statusFilter])

  // Estatísticas
  const stats = useMemo(() => {
    if (!deliveries) return { total: 0, pending: 0, inProgress: 0, delivered: 0, cancelled: 0 }
    
    return {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === "PENDING").length,
      inProgress: deliveries.filter(d => 
        d.status === "PREPARING" || 
        d.status === "READY_FOR_PICKUP" || 
        d.status === "IN_TRANSIT"
      ).length,
      delivered: deliveries.filter(d => d.status === "DELIVERED").length,
      cancelled: deliveries.filter(d => d.status === "CANCELLED" || d.status === "FAILED").length,
    }
  }, [deliveries])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Erro ao carregar entregas: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Entregas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todas as entregas
          </p>
        </div>
        
        <Link href="/dashboard/delivery/new">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nova Entrega
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 p-4">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-500">Pendentes</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 p-4">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.inProgress}</div>
          <div className="text-xs text-blue-600 dark:text-blue-500">Em Andamento</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.delivered}</div>
          <div className="text-xs text-green-600 dark:text-green-500">Entregues</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 p-4">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.cancelled}</div>
          <div className="text-xs text-red-600 dark:text-red-500">Canceladas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, número, telefone ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | "ALL")}
          className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm"
        >
          <option value="ALL">Todos os Status</option>
          {Object.entries(statusConfig).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Entregas */}
      {filteredDeliveries.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nenhuma entrega encontrada"
          description={
            searchTerm || statusFilter !== "ALL"
              ? "Tente ajustar os filtros de busca"
              : "Crie sua primeira entrega clicando no botão acima"
          }
        />
      ) : (
        <div className="grid gap-3">
          {filteredDeliveries.map((delivery) => {
            const statusInfo = statusConfig[delivery.status as DeliveryStatus]
            const StatusIcon = statusInfo?.icon || Package
            
            return (
              <Link
                key={delivery.id}
                href={`/dashboard/delivery/${delivery.id}`}
                className="block bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg">
                        #{delivery.deliveryNumber}
                      </span>
                      <Badge className={`${statusInfo?.color} border`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo?.label || delivery.status}
                      </Badge>
                    </div>

                    {/* Cliente */}
                    <div className="space-y-1">
                      <div className="font-medium">{delivery.customerName}</div>
                      {delivery.customerPhone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {delivery.customerPhone}
                        </div>
                      )}
                    </div>

                    {/* Endereço */}
                    <div className="flex items-start gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {delivery.deliveryAddress}, {delivery.district} - {delivery.city}
                      </span>
                    </div>

                    {/* Info adicional */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {delivery.scheduledFor && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(delivery.scheduledFor).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                      
                      {delivery.driverName && (
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {delivery.driverName}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        R$ {delivery.total.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Rating (se entregue) */}
                  {delivery.rating && (
                    <div className="text-right">
                      <div className="text-yellow-500 font-semibold">
                        ★ {delivery.rating}
                      </div>
                      <div className="text-xs text-muted-foreground">Avaliação</div>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
