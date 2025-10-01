"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCreateOrder, CreateOrderInput } from "@/lib/useOrders"
import { useCustomers } from "@/lib/useCustomers"
import { useProducts } from "@/lib/useProducts"
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
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, User, Package, FileText, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Step = "customer" | "items" | "details" | "review"

interface OrderItemInput {
  productId: string
  productName?: string
  quantity: number
  unitPrice: number
  discount: number
  notes?: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>("customer")
  const createOrder = useCreateOrder()

  // Customer data
  const [customerId, setCustomerId] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")

  // Items
  const [items, setItems] = useState<OrderItemInput[]>([])
  const [selectedProductId, setSelectedProductId] = useState("")

  // Details
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM")
  const [promisedDate, setPromisedDate] = useState("")
  const [notes, setNotes] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [discountValue, setDiscountValue] = useState(0)
  const [depositPaid, setDepositPaid] = useState(0)

  const { data: customers } = useCustomers()
  const { data: products } = useProducts()

  const steps: Record<Step, { label: string; icon: any }> = {
    customer: { label: "Cliente", icon: User },
    items: { label: "Produtos", icon: Package },
    details: { label: "Detalhes", icon: FileText },
    review: { label: "Revisar", icon: Check },
  }

  const stepOrder: Step[] = ["customer", "items", "details", "review"]
  const currentStepIndex = stepOrder.indexOf(currentStep)

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice - item.discount)
  }, 0)

  const total = subtotal - discountValue + deliveryFee
  const balanceDue = total - depositPaid

  const canGoNext = () => {
    if (currentStep === "customer") {
      return customerName.trim() !== "" && customerPhone.trim() !== ""
    }
    if (currentStep === "items") {
      return items.length > 0
    }
    return true
  }

  const handleNext = () => {
    if (canGoNext()) {
      const nextIndex = currentStepIndex + 1
      if (nextIndex < stepOrder.length) {
        setCurrentStep(stepOrder[nextIndex])
      }
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(stepOrder[prevIndex])
    }
  }

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto")
      return
    }

    const product = products?.find((p) => p.id === selectedProductId)
    if (!product) return

    const existingItem = items.find((i) => i.productId === selectedProductId)
    if (existingItem) {
      setItems(
        items.map((i) =>
          i.productId === selectedProductId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      )
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          productName: `${product.name} ${product.size}`,
          quantity: 1,
          unitPrice: product.salePrice,
          discount: 0,
        },
      ])
    }

    setSelectedProductId("")
    toast.success("Produto adicionado")
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
    toast.success("Produto removido")
  }

  const handleSubmit = async () => {
    try {
      const orderData: CreateOrderInput = {
        customerId: customerId || undefined,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        customerAddress: customerAddress || undefined,
        priority,
        promisedAt: promisedDate || undefined,
        notes: notes || undefined,
        specialRequests: specialRequests || undefined,
        deliveryFee,
        discountValue,
        depositPaid,
        source: "web",
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          notes: item.notes || undefined,
        })),
      }

      const order = await createOrder.mutateAsync(orderData)
      toast.success("Encomenda criada com sucesso!")
      router.push(`/dashboard/orders/${order.id}`)
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar encomenda")
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers?.find((c) => c.id === customerId)
    if (customer) {
      setCustomerId(customer.id)
      setCustomerName(customer.name)
      setCustomerPhone(customer.phone || "")
      setCustomerAddress(customer.address || "")
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Encomenda</h1>
          <p className="text-muted-foreground">
            Preencha os dados para criar uma nova encomenda
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {stepOrder.map((step, index) => {
          const StepIcon = steps[step].icon
          const isActive = step === currentStep
          const isCompleted = index < currentStepIndex

          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    !isActive && !isCompleted && "border-muted-foreground/25"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-sm font-medium",
                    (isActive || isCompleted) && "text-foreground",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {steps[step].label}
                </span>
              </div>
              {index < stepOrder.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/25"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="rounded-lg border bg-card p-6">
        {/* Step 1: Customer */}
        {currentStep === "customer" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Dados do Cliente</h2>

            <div>
              <label className="text-sm font-medium">Cliente Existente (Opcional)</label>
              <Select value={customerId} onValueChange={handleCustomerSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente cadastrado..." />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone && `- ${customer.phone}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone *</label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Endereço</label>
              <Input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>
          </div>
        )}

        {/* Step 2: Items */}
        {currentStep === "items" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Produtos</h2>

            <div className="flex gap-2">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar produto..." />
                </SelectTrigger>
                <SelectContent>
                  {products
                    ?.filter((p) => p.isActive)
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} {product.size} - R$ {product.salePrice.toFixed(2)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhum produto adicionado. Selecione produtos acima.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {item.unitPrice.toFixed(2)} cada
                      </p>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        setItems(
                          items.map((i, idx) =>
                            idx === index
                              ? { ...i, quantity: parseInt(e.target.value) || 1 }
                              : i
                          )
                        )
                      }
                      className="w-20"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) =>
                        setItems(
                          items.map((i, idx) =>
                            idx === index
                              ? { ...i, discount: parseFloat(e.target.value) || 0 }
                              : i
                          )
                        )
                      }
                      placeholder="Desc."
                      className="w-24"
                    />
                    <div className="font-semibold">
                      R$ {(item.quantity * item.unitPrice - item.discount).toFixed(2)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-2xl font-bold">
                      R$ {subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Details */}
        {currentStep === "details" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Detalhes da Encomenda</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Data Prometida</label>
                <Input
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Taxa de Entrega</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Desconto</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Sinal Pago</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Observações do Cliente</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Observações visíveis para o cliente..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Pedidos Especiais</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Personalizações, gravações, etc..."
              />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === "review" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Revisar Encomenda</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Cliente</h3>
                <div className="rounded-lg border p-4 space-y-1">
                  <p><strong>Nome:</strong> {customerName}</p>
                  <p><strong>Telefone:</strong> {customerPhone}</p>
                  {customerEmail && <p><strong>Email:</strong> {customerEmail}</p>}
                  {customerAddress && <p><strong>Endereço:</strong> {customerAddress}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Produtos ({items.length})</h3>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="rounded-lg border p-3 flex justify-between">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}x R$ {item.unitPrice.toFixed(2)}
                          {item.discount > 0 && ` (desc. R$ ${item.discount.toFixed(2)})`}
                        </p>
                      </div>
                      <p className="font-semibold">
                        R$ {(item.quantity * item.unitPrice - item.discount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Resumo Financeiro</h3>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto</span>
                      <span>- R$ {discountValue.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Taxa de Entrega</span>
                      <span>R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  {depositPaid > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Sinal Pago</span>
                        <span>R$ {depositPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Saldo Restante</span>
                        <span className="text-amber-600">R$ {balanceDue.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {(notes || specialRequests || promisedDate) && (
                <div>
                  <h3 className="font-medium mb-2">Informações Adicionais</h3>
                  <div className="rounded-lg border p-4 space-y-2">
                    {promisedDate && (
                      <p><strong>Data Prometida:</strong> {new Date(promisedDate).toLocaleDateString("pt-BR")}</p>
                    )}
                    <p><strong>Prioridade:</strong> {
                      priority === "LOW" ? "Baixa" :
                      priority === "MEDIUM" ? "Média" :
                      priority === "HIGH" ? "Alta" : "Urgente"
                    }</p>
                    {notes && <p><strong>Observações:</strong> {notes}</p>}
                    {specialRequests && <p><strong>Pedidos Especiais:</strong> {specialRequests}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0 || createOrder.isPending}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {currentStep !== "review" ? (
          <Button onClick={handleNext} disabled={!canGoNext()}>
            Próximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createOrder.isPending}>
            {createOrder.isPending ? "Criando..." : "Criar Encomenda"}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
