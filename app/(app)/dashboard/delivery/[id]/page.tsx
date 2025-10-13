"use client"

import { use } from "react"
import Link from "next/link"
import { 
  ChevronLeft, 
  Phone, 
  MapPin, 
  Package, 
  DollarSign, 
  Clock,
  User,
  Truck,
  Edit,
  Printer,
  MessageSquare,
  XCircle
} from "lucide-react"
import { useDelivery, useUpdateDeliveryStatus } from "@/lib/useDeliveries"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/Loader"
import { toast } from "sonner"

type DeliveryStatus = 
  | "PENDING" 
  | "PREPARING" 
  | "READY_FOR_PICKUP" 
  | "IN_TRANSIT" 
  | "DELIVERED" 
  | "CANCELLED" 
  | "FAILED"

const statusConfig: Record<DeliveryStatus, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800" },
  PREPARING: { label: "Preparando", color: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800" },
  READY_FOR_PICKUP: { label: "Pronto", color: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800" },
  IN_TRANSIT: { label: "Em Trânsito", color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800" },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800" },
  FAILED: { label: "Falhou", color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800" },
}

const nextStatusMap: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  PENDING: "PREPARING",
  PREPARING: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
}

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: delivery, isLoading, error } = useDelivery(id)
  const updateStatus = useUpdateDeliveryStatus()

  const handleStatusChange = async (newStatus: DeliveryStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus })
      toast.success("Status atualizado com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status")
    }
  }

  const handleWhatsApp = () => {
    if (delivery?.customer?.phone) {
      const message = encodeURIComponent(
        `Olá ${delivery.customer.name}! Sua entrega #${delivery.deliveryNumber} está a caminho!`
      )
      window.open(`https://wa.me/55${delivery.customer.phone.replace(/\D/g, "")}?text=${message}`, "_blank")
    }
  }

  const handlePrint = async () => {
    try {
      const res = await fetch(`/api/delivery/${id}/print`, {
        method: "POST",
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Falha ao imprimir")
      }
      
      toast.success("Impressão enviada com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao imprimir")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          Erro ao carregar entrega
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[delivery.status as DeliveryStatus]
  const nextStatus = nextStatusMap[delivery.status as DeliveryStatus]
  const canAdvance = nextStatus && delivery.status !== "DELIVERED" && delivery.status !== "CANCELLED"
  const canCancel = delivery.status !== "DELIVERED" && delivery.status !== "CANCELLED"

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/delivery">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Entrega #{delivery.deliveryNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Criada em {new Date(delivery.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        <Badge className={`${statusInfo?.color} border text-lg px-3 py-1`}>
          {statusInfo?.label || delivery.status}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {canAdvance && nextStatus && (
          <Button onClick={() => handleStatusChange(nextStatus)} disabled={updateStatus.isPending}>
            Avançar para {statusConfig[nextStatus].label}
          </Button>
        )}
        
        {delivery.customer?.phone && (
          <Button variant="outline" onClick={handleWhatsApp}>
            <MessageSquare className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
        )}

        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>

        {canCancel && (
          <Button 
            variant="outline" 
            className="text-red-600 hover:bg-red-50"
            onClick={() => handleStatusChange("CANCELLED")}
            disabled={updateStatus.isPending}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do Cliente */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Cliente</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Nome</div>
                <div className="font-medium">{delivery.customer?.name}</div>
              </div>
              
              {delivery.customer?.phone && (
                <div>
                  <div className="text-sm text-muted-foreground">Telefone</div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${delivery.customer.phone}`} className="hover:underline">
                      {delivery.customer.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Endereço de Entrega */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Endereço de Entrega</h2>
            </div>
            
            <div className="space-y-2">
              <div>
                {delivery.deliveryAddress}
                {delivery.addressNumber && `, ${delivery.addressNumber}`}
                {delivery.addressComplement && ` - ${delivery.addressComplement}`}
              </div>
              <div>
                {delivery.district}, {delivery.city} - {delivery.state}
              </div>
              {delivery.postalCode && (
                <div className="text-sm text-muted-foreground">CEP: {delivery.postalCode}</div>
              )}
              {delivery.referencePoint && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Ponto de Referência
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {delivery.referencePoint}
                  </div>
                </div>
              )}
              {delivery.deliveryInstructions && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/50 rounded border border-amber-200 dark:border-amber-800">
                  <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Instruções de Entrega
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    {delivery.deliveryInstructions}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {delivery.notes && (
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-3">Observações</h2>
              <p className="text-muted-foreground">{delivery.notes}</p>
            </div>
          )}
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Resumo Financeiro */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Resumo</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {(delivery.subtotal ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de Entrega</span>
                <span>R$ {(delivery.deliveryFee ?? 0).toFixed(2)}</span>
              </div>
              {(delivery.discountValue ?? 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>- R$ {(delivery.discountValue ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {(delivery.total ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {delivery.paymentMethod && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-1">Forma de Pagamento</div>
                <div className="font-medium">{delivery.paymentMethod}</div>
                {delivery.paidInAdvance && (
                  <Badge className="mt-2 bg-green-100 text-green-800 border-green-300">
                    Pago Antecipadamente
                  </Badge>
                )}
                {delivery.changeFor && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Troco para: </span>
                    <span className="font-medium">R$ {(delivery.changeFor ?? 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Informações da Entrega */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Detalhes</h2>
            </div>
            
            <div className="space-y-3">
              {delivery.driver?.name && (
                <div>
                  <div className="text-sm text-muted-foreground">Entregador</div>
                  <div className="font-medium">{delivery.driver.name}</div>
                </div>
              )}

              {delivery.vehicleUsed && (
                <div>
                  <div className="text-sm text-muted-foreground">Veículo</div>
                  <div className="font-medium">{delivery.vehicleUsed}</div>
                </div>
              )}

              {delivery.distance && (
                <div>
                  <div className="text-sm text-muted-foreground">Distância</div>
                  <div className="font-medium">{(delivery.distance ?? 0).toFixed(2)} km</div>
                </div>
              )}

              {delivery.estimatedTime && (
                <div>
                  <div className="text-sm text-muted-foreground">Tempo Estimado</div>
                  <div className="font-medium">{delivery.estimatedTime} min</div>
                </div>
              )}

              {delivery.scheduledFor && (
                <div>
                  <div className="text-sm text-muted-foreground">Agendado Para</div>
                  <div className="flex items-center gap-1 font-medium">
                    <Clock className="w-4 h-4" />
                    {new Date(delivery.scheduledFor).toLocaleString("pt-BR")}
                  </div>
                </div>
              )}

              {delivery.deliveredAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Entregue Em</div>
                  <div className="font-medium text-green-600">
                    {new Date(delivery.deliveredAt).toLocaleString("pt-BR")}
                  </div>
                </div>
              )}

              {delivery.rating && (
                <div>
                  <div className="text-sm text-muted-foreground">Avaliação</div>
                  <div className="text-yellow-500 font-semibold text-lg">
                    ★ {delivery.rating}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
