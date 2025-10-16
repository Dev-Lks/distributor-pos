"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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
  DollarSign,
  Settings,
  Users,
  TrendingUp,
  Printer,
} from "lucide-react"
import { useDeliveries } from "@/hooks/useDeliveries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/EmptyState"
import { Loader } from "@/components/Loader"
import { CreateDeliveryDialog } from "@/components/delivery/CreateDeliveryDialog"
import { DeliveryPrintButtons } from "./components/DeliveryPrintButtons"

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
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "ALL">("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  const { data: deliveries, isLoading, error } = useDeliveries()

  const handleDeliveryClick = (deliveryId: string) => {
    router.push(`/dashboard/delivery/${deliveryId}`)
  }

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
    if (!deliveries) return { 
      total: 0, 
      pending: 0, 
      inProgress: 0, 
      delivered: 0, 
      cancelled: 0,
      totalRevenue: 0,
      avgDeliveryFee: 0,
      avgRating: 0,
    }
    
    const delivered = deliveries.filter(d => d.status === "DELIVERED")
    const totalRevenue = deliveries.reduce((sum, d) => sum + (d.total ?? 0), 0)
    const totalDeliveryFees = deliveries.reduce((sum, d) => sum + (d.deliveryFee ?? 0), 0)
    const ratingsCount = deliveries.filter(d => d.rating).length
    const totalRating = deliveries.reduce((sum, d) => sum + (d.rating || 0), 0)
    
    return {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === "PENDING").length,
      inProgress: deliveries.filter(d => 
        d.status === "PREPARING" || 
        d.status === "READY_FOR_PICKUP" || 
        d.status === "IN_TRANSIT"
      ).length,
      delivered: delivered.length,
      cancelled: deliveries.filter(d => d.status === "CANCELLED" || d.status === "FAILED").length,
      totalRevenue,
      avgDeliveryFee: deliveries.length > 0 ? totalDeliveryFees / deliveries.length : 0,
      avgRating: ratingsCount > 0 ? totalRating / ratingsCount : 0,
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
            Gerencie todas as entregas do sistema
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/dashboard/delivery/drivers"}
            className="hidden sm:flex"
          >
            <Users className="w-4 h-4 mr-2" />
            Entregadores
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Entrega
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 sm:col-span-1 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-500">Pendentes</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 sm:col-span-1 bg-blue-50 dark:bg-blue-950/30 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.inProgress}</div>
            <div className="text-xs text-blue-600 dark:text-blue-500">Em Andamento</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 sm:col-span-1 bg-green-50 dark:bg-green-950/30 border-green-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.delivered}</div>
            <div className="text-xs text-green-600 dark:text-green-500">Entregues</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 sm:col-span-1 bg-red-50 dark:bg-red-950/30 border-red-200">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.cancelled}</div>
            <div className="text-xs text-red-600 dark:text-red-500">Canceladas</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-6">
            <div className="text-xl font-bold">R$ {stats.totalRevenue.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Receita</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-6">
            <div className="text-xl font-bold">R$ {stats.avgDeliveryFee.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Taxa Média</div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-6">
            <div className="text-xl font-bold flex items-center gap-1">
              ⭐ {stats.avgRating.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Avaliação</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, número, telefone ou endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs de Filtro por Status */}
      <Tabs defaultValue="ALL" className="space-y-4" onValueChange={(value) => setStatusFilter(value as DeliveryStatus | "ALL")}>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-auto w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg p-1 md:grid md:w-full md:grid-cols-8">
            <TabsTrigger value="ALL" className="text-xs sm:text-sm shrink-0">
              Todas
              {filteredDeliveries.length > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {filteredDeliveries.length}
                </span>
              )}
            </TabsTrigger>
            {Object.entries(statusConfig).map(([key, config]) => {
              const count = filteredDeliveries.filter(d => d.status === key).length
              return (
                <TabsTrigger key={key} value={key} className="text-xs sm:text-sm shrink-0">
                  {config.label}
                  {count > 0 && (
                    <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        <TabsContent value="ALL" className="space-y-0">
          {/* Lista será renderizada abaixo */}
        </TabsContent>
        {Object.keys(statusConfig).map((key) => (
          <TabsContent key={key} value={key} className="space-y-0">
            {/* Lista será renderizada abaixo */}
          </TabsContent>
        ))}
      </Tabs>

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
              <div
                key={delivery.id}
                className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    onClick={() => handleDeliveryClick(delivery.id)}
                    className="flex-1 space-y-2 text-left"
                  >
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
                        R$ {(delivery.total ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </button>

                  {/* Botões de Ação */}
                  <div className="flex flex-col gap-2">
                    {/* Rating (se entregue) */}
                    {delivery.rating && (
                      <div className="text-right">
                        <div className="text-yellow-500 font-semibold">
                          ★ {delivery.rating}
                        </div>
                        <div className="text-xs text-muted-foreground">Avaliação</div>
                      </div>
                    )}

                    {/* Botão de Impressão */}
                    <DeliveryPrintButtons 
                      deliveryId={delivery.id}
                      deliveryData={{
                        customer: { 
                          name: delivery.customerName, 
                          phone: delivery.customerPhone 
                        },
                        deliveryAddress: delivery.deliveryAddress,
                        addressNumber: "",
                        district: delivery.district,
                        city: delivery.city,
                        state: "SP",
                        items: [],
                        subtotal: delivery.subtotal,
                        deliveryFee: delivery.deliveryFee,
                        total: delivery.total,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog de Nova Entrega */}
      <CreateDeliveryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}
