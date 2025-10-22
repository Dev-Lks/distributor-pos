"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useDelivery, useUpdateDelivery } from "@/hooks/useDeliveries"
import { useDeliveryDrivers } from "@/hooks/useDeliveryDrivers"
import { useDeliveryNotifications } from "@/hooks/useDeliveryNotifications"
import type { DeliveryStatus } from "@/types/delivery"
import { toast } from "sonner"
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  User,
  DollarSign,
  Calendar,
  Star,
  MessageSquare,
} from "lucide-react"

interface DeliveryDetailsDialogProps {
  deliveryId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusConfig: Record<DeliveryStatus, { 
  label: string
  color: string
  icon: any 
}> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  PREPARING: { label: "Preparando", color: "bg-purple-100 text-purple-800 border-purple-300", icon: Package },
  READY_FOR_PICKUP: { label: "Pronto", color: "bg-indigo-100 text-indigo-800 border-indigo-300", icon: Package },
  IN_TRANSIT: { label: "Em Trânsito", color: "bg-orange-100 text-orange-800 border-orange-300", icon: Truck },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
  FAILED: { label: "Falhou", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
}

export function DeliveryDetailsDialog({
  deliveryId,
  open,
  onOpenChange,
}: DeliveryDetailsDialogProps) {
  const [newStatus, setNewStatus] = useState<DeliveryStatus | "">("")
  const [newDriverId, setNewDriverId] = useState<string>("")
  const [rating, setRating] = useState<number>(5)
  const [ratingComment, setRatingComment] = useState("")
  
  const { data: delivery, isLoading } = useDelivery(deliveryId)
  const { data: drivers = [], isLoading: isLoadingDrivers } = useDeliveryDrivers({ activeOnly: true })
  const updateDelivery = useUpdateDelivery()
  const { notifyDeliveryStatusChange } = useDeliveryNotifications()

  const handleUpdateStatus = async () => {
    if (!deliveryId || !newStatus) return

    try {
      await updateDelivery.mutateAsync({
        id: deliveryId,
        status: newStatus,
      })

      // 🔔 Enviar notificação
      const driverName = drivers?.find(d => d.id === delivery?.driverId)?.name
      await notifyDeliveryStatusChange(
        deliveryId,
        newStatus,
        driverName,
        delivery?.customer?.name
      )
      
      toast.success("Status atualizado com sucesso!")
      setNewStatus("")
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status")
    }
  }

  const handleUpdateDriver = async () => {
    if (!deliveryId) return

    try {
      await updateDelivery.mutateAsync({
        id: deliveryId,
        driverId: newDriverId === "REMOVE" ? null : newDriverId || null,
      })
      
      toast.success(newDriverId === "REMOVE" ? "Entregador removido" : "Entregador atribuído com sucesso!")
      setNewDriverId("")
    } catch (error: any) {
      toast.error(error.message || "Erro ao atribuir entregador")
    }
  }

  const handleAddRating = async () => {
    if (!deliveryId) return

    try {
      await updateDelivery.mutateAsync({
        id: deliveryId,
        rating,
        ratingComment: ratingComment || undefined,
      })
      
      toast.success("Avaliação adicionada!")
      setRating(5)
      setRatingComment("")
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar avaliação")
    }
  }

  if (!delivery && !isLoading) {
    return null
  }

  const statusInfo = delivery ? statusConfig[delivery.status] : null
  const StatusIcon = statusInfo?.icon || Package

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Detalhes da Entrega
          </DialogTitle>
          <DialogDescription>
            {delivery?.deliveryNumber}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : delivery ? (
          <div className="space-y-6">
            {/* Status Atual */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-muted-foreground">Status Atual</Label>
                <Badge className={`${statusInfo?.color} border mt-1 text-base`}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {statusInfo?.label}
                </Badge>
              </div>
              
              {delivery.rating && (
                <div className="text-right">
                  <Label className="text-xs text-muted-foreground">Avaliação</Label>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < delivery.rating!
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-1 font-semibold">{delivery.rating}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Cliente */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">{delivery.customer?.name}</span>
                </div>
                {delivery.customer?.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {delivery.customer.phone}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço de Entrega
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  {delivery.deliveryAddress}
                  {delivery.addressNumber && `, ${delivery.addressNumber}`}
                  {delivery.addressComplement && ` - ${delivery.addressComplement}`}
                </p>
                <p className="text-muted-foreground">
                  {delivery.district} - {delivery.city}, {delivery.state}
                </p>
                {delivery.postalCode && (
                  <p className="text-muted-foreground">CEP: {delivery.postalCode}</p>
                )}
                {delivery.referencePoint && (
                  <p className="text-muted-foreground italic">
                    Ref: {delivery.referencePoint}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Logística */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {delivery.zone && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Zona</Label>
                  <p className="font-medium">{delivery.zone.name}</p>
                </div>
              )}
              
              {delivery.driver && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Entregador</Label>
                  <p className="font-medium">
                    {delivery.driver.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({delivery.driver.vehicleType})
                    </span>
                  </p>
                </div>
              )}
              
              {delivery.scheduledFor && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Agendado Para</Label>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(delivery.scheduledFor).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              
              {delivery.estimatedTime && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tempo Estimado</Label>
                  <p>{delivery.estimatedTime} minutos</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Valores */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valores
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal (itens):</span>
                  <span>R$ {(delivery.subtotal ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Entrega:</span>
                  <span>R$ {(delivery.deliveryFee ?? 0).toFixed(2)}</span>
                </div>
                {(delivery.discountValue ?? 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto:</span>
                    <span>- R$ {(delivery.discountValue ?? 0).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total:</span>
                  <span>R$ {(delivery.total ?? 0).toFixed(2)}</span>
                </div>
                
                {delivery.paymentMethod && (
                  <div className="flex items-center gap-2 text-muted-foreground pt-2">
                    <span className="text-xs">Pagamento:</span>
                    <Badge variant="outline">{delivery.paymentMethod}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Instruções e Notas */}
            {(delivery.deliveryInstructions || delivery.notes) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Observações
                  </h3>
                  {delivery.deliveryInstructions && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Instruções de Entrega
                      </Label>
                      <p className="text-sm mt-1">{delivery.deliveryInstructions}</p>
                    </div>
                  )}
                  {delivery.notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Observações do Cliente
                      </Label>
                      <p className="text-sm mt-1">{delivery.notes}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Atualizar Status */}
            <div className="space-y-3">
              <h3 className="font-semibold">Atualizar Status</h3>
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as DeliveryStatus)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={!newStatus || updateDelivery.isPending}
                >
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Atribuir/Alterar Entregador */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {delivery.driver ? "Alterar Entregador" : "Atribuir Entregador"}
              </h3>
              <div className="flex gap-2">
                <Select 
                  value={newDriverId} 
                  onValueChange={setNewDriverId}
                  disabled={isLoadingDrivers}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={
                      delivery.driver 
                        ? `Atual: ${delivery.driver.name}` 
                        : "Selecione um entregador"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REMOVE">Remover entregador</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} ({driver.vehicleType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleUpdateDriver}
                  disabled={updateDelivery.isPending || isLoadingDrivers}
                  variant={newDriverId === "REMOVE" && delivery.driver ? "destructive" : "default"}
                >
                  {newDriverId === "REMOVE" && delivery.driver ? "Remover" : "Atribuir"}
                </Button>
              </div>
            </div>

            {/* Adicionar Avaliação */}
            {delivery.status === "DELIVERED" && !delivery.rating && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Adicionar Avaliação
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Nota (1-5)</Label>
                      <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Comentário (opcional)</Label>
                      <Textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Como foi a experiência?"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAddRating} disabled={updateDelivery.isPending}>
                      Salvar Avaliação
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
