"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Check, User, MapPin, Package, DollarSign, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ImprovedCustomerSelector } from "@/components/customers/ImprovedCustomerSelector"
import { useCreateDelivery } from "@/lib/useDeliveries"
import { useDeliveryCart } from "../hooks/useDeliveryCart"
import { ProductSelector } from "../components/ProductSelector"
import { DeliveryCart } from "../components/DeliveryCart"
import { AddressForm } from "../components/AddressForm"
import { DateTimePicker } from "../components/DateTimePicker"
import { toast } from "sonner"

type Step = "customer" | "address" | "products" | "payment" | "review"

const steps: { id: Step; label: string; icon: any }[] = [
  { id: "customer", label: "Cliente", icon: User },
  { id: "address", label: "Endereço", icon: MapPin },
  { id: "products", label: "Produtos", icon: Package },
  { id: "payment", label: "Pagamento", icon: DollarSign },
  { id: "review", label: "Revisar", icon: FileText },
]

interface DeliveryFormData {
  // Cliente
  customerId: string
  customerName: string
  customerPhone: string | null
  
  // Endereço
  deliveryAddress: string
  addressNumber: string
  addressComplement: string
  district: string
  city: string
  state: string
  postalCode: string
  referencePoint: string
  
  // Produtos
  items: Array<{
    productId: string
    name: string
    quantity: number
    price: number
  }>
  
  // Valores
  subtotal: number
  deliveryFee: number
  discountValue: number
  total: number
  
  // Pagamento
  paymentMethod: string
  paidInAdvance: boolean
  changeFor: number | null
  
  // Observações
  notes: string
  deliveryInstructions: string
  
  // Agendamento
  scheduledFor?: string | null
}

export default function NewDeliveryPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>("customer")
  const [formData, setFormData] = useState<Partial<DeliveryFormData>>({
    deliveryFee: 0,
    discountValue: 0,
    paidInAdvance: false,
  })

  const createDelivery = useCreateDelivery()
  
  // Carrinho dinâmico
  const {
    cart,
    addToCart,
    updateQuantity,
    updateDiscount,
    updateNotes,
    removeFromCart,
    clearCart,
    getCartItems,
    subtotal,
    totalDiscount,
    itemCount,
  } = useDeliveryCart()

  // Calcular total com taxa de entrega
  const total = useMemo(() => {
    return subtotal - totalDiscount + (formData.deliveryFee || 0)
  }, [subtotal, totalDiscount, formData.deliveryFee])

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  const handleNext = () => {
    // Validar produtos antes de avançar para pagamento
    if (currentStep === "products" && cart.length === 0) {
      toast.error("Adicione pelo menos um produto ao carrinho")
      return
    }

    if (!isLastStep) {
      const nextStep = steps[currentStepIndex + 1]
      setCurrentStep(nextStep.id)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStep = steps[currentStepIndex - 1]
      setCurrentStep(prevStep.id)
    }
  }

  const handleSubmit = async () => {
    try {
      // Validações
      if (!formData.customerId) {
        toast.error("Selecione um cliente")
        return
      }

      if (!formData.deliveryAddress || !formData.district || !formData.city || !formData.state) {
        toast.error("Preencha todos os campos obrigatórios do endereço")
        return
      }

      if (cart.length === 0) {
        toast.error("Adicione pelo menos um produto ao carrinho")
        return
      }

      const deliveryData = {
        customerId: formData.customerId,
        deliveryAddress: formData.deliveryAddress,
        addressNumber: formData.addressNumber || null,
        addressComplement: formData.addressComplement || null,
        district: formData.district,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode || null,
        referencePoint: formData.referencePoint || null,
        subtotal,
        deliveryFee: formData.deliveryFee || 0,
        discountValue: totalDiscount,
        notes: formData.notes || null,
        deliveryInstructions: formData.deliveryInstructions || null,
        paymentMethod: formData.paymentMethod || null,
        paidInAdvance: formData.paidInAdvance || false,
        changeFor: formData.changeFor || null,
        scheduledFor: formData.scheduledFor || null,
      }

      await createDelivery.mutateAsync(deliveryData)

      toast.success("Entrega criada com sucesso!")
      clearCart()
      router.push("/dashboard/delivery")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar entrega")
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "customer":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Selecione o Cliente</h2>
            <p className="text-sm text-muted-foreground">
              Busque um cliente existente ou crie um novo
            </p>
            <ImprovedCustomerSelector
              onSelect={(customer) => {
                if (customer) {
                  setFormData({
                    ...formData,
                    customerId: customer.id,
                    customerName: customer.name,
                    customerPhone: customer.phone,
                  })
                  // Auto avançar para próxima etapa
                  setTimeout(() => handleNext(), 500)
                }
              }}
              allowCreate={true}
              showRecent={true}
            />
          </div>
        )

      case "address":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulário de Endereço */}
              <div className="lg:col-span-2">
                <AddressForm
                  values={{
                    postalCode: formData.postalCode,
                    deliveryAddress: formData.deliveryAddress,
                    addressNumber: formData.addressNumber,
                    addressComplement: formData.addressComplement,
                    district: formData.district,
                    city: formData.city,
                    state: formData.state,
                    referencePoint: formData.referencePoint,
                    deliveryInstructions: formData.deliveryInstructions,
                  }}
                  onChange={(field, value) => {
                    setFormData(prev => ({ ...prev, [field]: value }))
                  }}
                />
              </div>

              {/* Resumo do Cliente */}
              {formData.customerName && (
                <div className="lg:col-span-1">
                  <div className="sticky top-4 p-4 border border-border rounded-lg bg-card shadow-sm">
                    <h3 className="text-sm font-semibold mb-3">Cliente</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nome:</span>
                        <div className="font-medium">{formData.customerName}</div>
                      </div>
                      {formData.customerPhone && (
                        <div>
                          <span className="text-muted-foreground">Telefone:</span>
                          <div className="font-medium">{formData.customerPhone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case "products":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Produtos do Pedido</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seletor de Produtos */}
              <div>
                <h3 className="text-sm font-medium mb-3">Adicionar Produtos</h3>
                <ProductSelector onSelectProduct={addToCart} />
              </div>

              {/* Carrinho */}
              <div>
                <h3 className="text-sm font-medium mb-3">Carrinho</h3>
                <DeliveryCart
                  cart={cart}
                  onUpdateQuantity={updateQuantity}
                  onUpdateDiscount={updateDiscount}
                  onUpdateNotes={updateNotes}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                  subtotal={subtotal}
                  totalDiscount={totalDiscount}
                  deliveryFee={formData.deliveryFee || 0}
                  total={total}
                />
              </div>
            </div>

            {/* Taxa de Entrega e Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="deliveryFee">Taxa de Entrega</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  step="0.01"
                  value={formData.deliveryFee || 0}
                  onChange={(e) => {
                    const deliveryFee = parseFloat(e.target.value) || 0
                    setFormData({ ...formData, deliveryFee })
                  }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Observações sobre o pedido..."
                />
              </div>
            </div>
          </div>
        )

      case "payment":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pagamento</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulário de Pagamento */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                    <Select
                      value={formData.paymentMethod || ""}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONEY">Dinheiro</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                        <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="paidInAdvance"
                        checked={formData.paidInAdvance || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, paidInAdvance: checked === true })}
                      />
                      <Label htmlFor="paidInAdvance" className="cursor-pointer">
                        Pago Antecipadamente
                      </Label>
                    </div>
                  </div>

                  {formData.paymentMethod === "MONEY" && (
                    <div className="sm:col-span-2">
                      <Label htmlFor="changeFor">Troco para</Label>
                      <Input
                        id="changeFor"
                        type="number"
                        step="0.01"
                        value={formData.changeFor || ""}
                        onChange={(e) => setFormData({ ...formData, changeFor: parseFloat(e.target.value) || null })}
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <DateTimePicker
                      value={formData.scheduledFor || null}
                      onChange={(value) => setFormData({ ...formData, scheduledFor: value || undefined })}
                      label="Agendamento (Opcional)"
                    />
                  </div>
                </div>
              </div>

              {/* Resumo do Pedido */}
              <div className="lg:col-span-1">
                <div className="sticky top-4 p-4 border border-border rounded-lg bg-card shadow-sm">
                  <h3 className="text-sm font-semibold mb-3">Resumo do Pedido</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Itens:</span>
                      <span className="font-medium">{itemCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span>-R$ {totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de entrega:</span>
                      <span className="font-medium">R$ {(formData.deliveryFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-base">
                      <span>Total:</span>
                      <span className="text-primary">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "review":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Revisar Entrega</h2>
            
            <div className="space-y-3 bg-card border border-border p-4 rounded-lg shadow-sm">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Cliente</div>
                <div className="font-medium">{formData.customerName}</div>
                {formData.customerPhone && <div className="text-sm text-muted-foreground">{formData.customerPhone}</div>}
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Endereço</div>
                <div>
                  {formData.deliveryAddress}, {formData.addressNumber}
                  {formData.addressComplement && ` - ${formData.addressComplement}`}
                </div>
                <div className="text-muted-foreground">{formData.district}, {formData.city} - {formData.state}</div>
                {formData.postalCode && <div className="text-sm text-muted-foreground">{formData.postalCode}</div>}
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Produtos</div>
                <div className="space-y-1 mt-2">
                  {cart.map((item) => (
                    <div key={item.productId} className="text-sm flex justify-between">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-medium">
                        R$ {(item.price * item.quantity - (item.discount || 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Subtotal</div>
                  <div>R$ {subtotal.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Taxa de Entrega</div>
                  <div>R$ {(formData.deliveryFee || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Desconto</div>
                  <div className="text-green-600 dark:text-green-500">R$ {totalDiscount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Total</div>
                  <div className="text-lg font-bold text-primary">R$ {total.toFixed(2)}</div>
                </div>
              </div>

              {formData.paymentMethod && (
                <div className="pt-3 border-t border-border">
                  <div className="text-sm font-medium text-muted-foreground">Pagamento</div>
                  <div className="font-medium">{formData.paymentMethod}</div>
                  {formData.paidInAdvance && (
                    <div className="text-sm text-green-600 dark:text-green-500">✓ Pago antecipadamente</div>
                  )}
                </div>
              )}

              {formData.scheduledFor && (
                <div className="pt-3 border-t border-border">
                  <div className="text-sm font-medium text-muted-foreground">Agendamento</div>
                  <div className="font-medium">
                    📅 {new Date(formData.scheduledFor).toLocaleString("pt-BR", {
                      dateStyle: "full",
                      timeStyle: "short"
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Entrega</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados da entrega</p>
        </div>
      </div>

      {/* Steps Progress */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = index < currentStepIndex
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? "bg-green-600 border-green-600 text-white dark:bg-green-500 dark:border-green-500"
                      : isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xs mt-1 hidden sm:block ${
                    isActive ? "font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    isCompleted ? "bg-green-600 dark:bg-green-500" : "bg-border"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm">
        {renderStepContent()}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>

        {isLastStep ? (
          <Button onClick={handleSubmit} disabled={createDelivery.isPending}>
            {createDelivery.isPending ? "Criando..." : "Criar Entrega"}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Próximo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
