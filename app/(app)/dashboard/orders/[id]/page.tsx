"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useOrder, useUpdateOrderStatus, useDeleteOrder } from "@/lib/useOrders"
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge"
import { OrderPriorityBadge } from "@/components/orders/OrderPriorityBadge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Package,
  Phone,
  Mail,
  User,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string

  const { data: order, isLoading } = useOrder(orderId)
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()

  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [statusNotes, setStatusNotes] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando encomenda...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Encomenda não encontrada</h3>
          <Link href="/dashboard/orders">
            <Button variant="outline" className="mt-4">
              Voltar para encomendas
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const promisedDate = order.promisedAt ? new Date(order.promisedAt) : null
  const now = new Date()
  const isOverdue = promisedDate && promisedDate < now && order.status !== "DELIVERED" && order.status !== "CANCELLED"

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      toast.error("Selecione um status")
      return
    }

    try {
      await updateStatus.mutateAsync({
        id: order.id,
        status: selectedStatus as any,
        notes: statusNotes || undefined,
      })
      toast.success("Status atualizado com sucesso!")
      setSelectedStatus("")
      setStatusNotes("")
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status")
    }
  }

  const handleDelete = async () => {
    try {
      await deleteOrder.mutateAsync(order.id)
      toast.success("Encomenda deletada com sucesso!")
      router.push("/dashboard/orders")
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar encomenda")
    }
  }

  const statusHistory = order.statusHistory as any
  const events = statusHistory?.events || []

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Criado {formatDistanceToNow(new Date(order.orderedAt), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <OrderStatusBadge status={order.status} className="text-sm px-3 py-1" />
          <OrderPriorityBadge priority={order.priority} className="text-sm px-3 py-1" />
        </div>
      </div>

      {/* Overdue Alert */}
      {isOverdue && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">Encomenda atrasada!</p>
          </div>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            A data prometida era {promisedDate.toLocaleDateString("pt-BR")}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos ({order.items.length})
            </h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name} {item.product.size}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x R$ {item.unitPrice.toFixed(2)}
                      {item.discount > 0 && ` (desc. R$ ${item.discount.toFixed(2)})`}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        📝 {item.notes}
                      </p>
                    )}
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium text-muted-foreground">Personalizações:</p>
                        {Object.entries(item.customizations).map(([key, value]) => (
                          <p key={key} className="text-muted-foreground">
                            • {key}: {value as string}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      R$ {item.subtotal.toFixed(2)}
                    </p>
                    <OrderStatusBadge
                      status={item.status === "ready" ? "READY" : item.status === "in_production" ? "PREPARING" : "PENDING"}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountValue > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Desconto</span>
                  <span>- R$ {order.discountValue.toFixed(2)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Taxa de Entrega</span>
                  <span>R$ {order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
              {order.depositPaid > 0 && (
                <>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Sinal Pago</span>
                    <span>R$ {order.depositPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Saldo Restante</span>
                    <span className={cn(
                      order.balanceDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                    )}>
                      R$ {order.balanceDue.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {(order.notes || order.specialRequests || order.internalNotes) && (
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-xl font-semibold">Observações</h2>
              
              {order.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Observações do Cliente
                  </h3>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}

              {order.specialRequests && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Pedidos Especiais
                  </h3>
                  <p className="text-sm">{order.specialRequests}</p>
                </div>
              )}

              {order.internalNotes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Notas Internas
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">{order.internalNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Activity Log */}
          {events.length > 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Histórico de Atividades</h2>
              <div className="space-y-4">
                {events.reverse().map((event: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="relative">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      {index < events.length - 1 && (
                        <div className="absolute left-1 top-4 h-full w-px bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            Status alterado para:{" "}
                            <OrderStatusBadge status={event.status} />
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {event.userName} •{" "}
                            {new Date(event.timestamp).toLocaleString("pt-BR")}
                          </p>
                          {event.notes && (
                            <p className="text-sm mt-1">{event.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {order.customerPhone}
                </a>
              </div>
              {order.customerEmail && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="flex items-center gap-2 text-primary hover:underline break-all"
                  >
                    <Mail className="h-4 w-4" />
                    {order.customerEmail}
                  </a>
                </div>
              )}
              {order.customerAddress && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span className="text-sm">{order.customerAddress}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pedido Criado</p>
                <p className="text-sm">
                  {new Date(order.orderedAt).toLocaleString("pt-BR")}
                </p>
              </div>
              {order.confirmedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmado</p>
                  <p className="text-sm">
                    {new Date(order.confirmedAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              {promisedDate && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data Prometida</p>
                  <p className={cn(
                    "text-sm font-medium flex items-center gap-2",
                    isOverdue && "text-red-600 dark:text-red-400"
                  )}>
                    <Calendar className="h-4 w-4" />
                    {promisedDate.toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              {order.readyAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ficou Pronto</p>
                  <p className="text-sm">
                    {new Date(order.readyAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              {order.deliveredAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entregue</p>
                  <p className="text-sm">
                    {new Date(order.deliveredAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
              {order.cancelledAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cancelado</p>
                  <p className="text-sm">
                    {new Date(order.cancelledAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Update Status */}
          {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Atualizar Status</h2>
              <div className="space-y-3">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar novo status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                    <SelectItem value="PREPARING">Em Preparação</SelectItem>
                    <SelectItem value="READY">Pronto</SelectItem>
                    <SelectItem value="DELIVERED">Entregue</SelectItem>
                    <SelectItem value="CANCELLED">Cancelar</SelectItem>
                  </SelectContent>
                </Select>
                
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Observações (opcional)..."
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />

                <Button
                  className="w-full"
                  onClick={handleStatusChange}
                  disabled={!selectedStatus || updateStatus.isPending}
                >
                  {updateStatus.isPending ? "Atualizando..." : "Atualizar Status"}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rounded-lg border bg-card p-6 space-y-3">
            <h2 className="text-xl font-semibold mb-4">Ações</h2>
            
            <Button variant="outline" className="w-full" disabled>
              <Edit className="mr-2 h-4 w-4" />
              Editar Encomenda
            </Button>

            <Button variant="outline" className="w-full" disabled>
              Imprimir Comprovante
            </Button>

            <Button variant="outline" className="w-full" disabled>
              Notificar Cliente
            </Button>

            {order.status !== "DELIVERED" && (
              showDeleteConfirm ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Tem certeza que deseja deletar esta encomenda?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteOrder.isPending}
                    >
                      {deleteOrder.isPending ? "Deletando..." : "Confirmar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar Encomenda
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
