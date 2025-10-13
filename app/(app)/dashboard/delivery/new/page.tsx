"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Check, User, MapPin, Package, DollarSign, FileText, Printer, Calculator, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ImprovedCustomerSelector } from "@/components/customers/ImprovedCustomerSelector"
import { useCreateDelivery } from "@/lib/useDeliveries"
import { useDeliveryCart } from "../hooks/useDeliveryCart"
import { ProductSelector } from "../components/ProductSelector"
import { DeliveryCart } from "../components/DeliveryCart"
import { AddressForm } from "../components/AddressForm"
import { DateTimePicker } from "../components/DateTimePicker"
import { DeliveryPrintButtons } from "../components/DeliveryPrintButtons"
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
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)
  const [distanceInfo, setDistanceInfo] = useState<{
    distance: number
    estimatedTime: number
  } | null>(null)
  const [createdDeliveryId, setCreatedDeliveryId] = useState<string | null>(null)

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

  // Função para calcular distância e taxa automaticamente
  const handleCalculateDistance = async () => {
    if (!formData.deliveryAddress || !formData.city || !formData.state) {
      toast.error("Preencha o endereço completo primeiro")
      return
    }

    setIsCalculatingDistance(true)
    try {
      const fullAddress = `${formData.deliveryAddress}, ${formData.addressNumber || ''} - ${formData.district}, ${formData.city} - ${formData.state}, ${formData.postalCode || ''}`
      
      const response = await fetch('/api/delivery/calculate-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationAddress: fullAddress
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao calcular distância')
      }

      const data = await response.json()
      
      setFormData(prev => ({ ...prev, deliveryFee: data.fee }))
      setDistanceInfo({
        distance: data.distance,
        estimatedTime: data.estimatedTime
      })
      
      toast.success(`Distância: ${data.distance.toFixed(2)} km | Tempo estimado: ${data.estimatedTime.toFixed(0)} min`)
    } catch (error) {
      console.error('Erro ao calcular distância:', error)
      toast.error('Erro ao calcular distância. Defina manualmente.')
    } finally {
      setIsCalculatingDistance(false)
    }
  }

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

      const result = await createDelivery.mutateAsync(deliveryData) as any
      
      if (result?.id) {
        setCreatedDeliveryId(result.id)
      }

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
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulário de Endereço */}
              <div className="lg:col-span-2 space-y-4">
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
                  customerId={formData.customerId}
                />

                {/* Calculadora de Distância */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Taxa de Entrega
                    </CardTitle>
                    <CardDescription>
                      Calcule automaticamente baseado na distância
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="deliveryFee">Valor (R$)</Label>
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
                      <div className="pt-6">
                        <Button
                          type="button"
                          onClick={handleCalculateDistance}
                          disabled={isCalculatingDistance || !formData.deliveryAddress}
                          variant="secondary"
                          className="gap-2"
                        >
                          {isCalculatingDistance ? (
                            <>
                              <Calculator className="h-4 w-4 animate-pulse" />
                              Calculando...
                            </>
                          ) : (
                            <>
                              <Calculator className="h-4 w-4" />
                              Calcular
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {distanceInfo && (
                      <div className="text-sm bg-primary/5 border border-primary/20 p-3 rounded-md space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Distância:</span>
                          <span className="font-semibold">{distanceInfo.distance.toFixed(2)} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tempo estimado:</span>
                          <span className="font-semibold">{distanceInfo.estimatedTime.toFixed(0)} min</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Resumo do Cliente */}
              {formData.customerName && (
                <div className="lg:col-span-1">
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Cliente Selecionado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nome:</span>
                        <div className="font-medium text-base">{formData.customerName}</div>
                      </div>
                      {formData.customerPhone && (
                        <div>
                          <span className="text-muted-foreground">Telefone:</span>
                          <div className="font-medium">{formData.customerPhone}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )

      case "products":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Produtos do Pedido</h2>
                <p className="text-sm text-muted-foreground">Adicione os produtos que serão entregues</p>
              </div>
              {itemCount > 0 && (
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seletor de Produtos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Adicionar Produtos
                  </CardTitle>
                  <CardDescription>Busque e adicione produtos ao pedido</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductSelector onSelectProduct={addToCart} />
                </CardContent>
              </Card>

              {/* Carrinho */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Carrinho</CardTitle>
                  <CardDescription>Revise os itens e quantidades</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
                <CardDescription>Adicione observações sobre o pedido (opcional)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Ex: Cliente solicitou embalagem especial..."
                />
              </CardContent>
            </Card>
          </div>
        )

      case "payment":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Pagamento e Agendamento</h2>
              <p className="text-sm text-muted-foreground">Defina como o cliente irá pagar</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulário de Pagamento */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Forma de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                      <Select
                        value={formData.paymentMethod || ""}
                        onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONEY">💵 Dinheiro</SelectItem>
                          <SelectItem value="PIX">📱 PIX</SelectItem>
                          <SelectItem value="DEBIT_CARD">💳 Cartão de Débito</SelectItem>
                          <SelectItem value="CREDIT_CARD">💳 Cartão de Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                      <Checkbox
                        id="paidInAdvance"
                        checked={formData.paidInAdvance || false}
                        onCheckedChange={(checked) => setFormData({ ...formData, paidInAdvance: checked === true })}
                      />
                      <Label htmlFor="paidInAdvance" className="cursor-pointer">
                        ✅ Já foi pago antecipadamente
                      </Label>
                    </div>

                    {formData.paymentMethod === "MONEY" && !formData.paidInAdvance && (
                      <div>
                        <Label htmlFor="changeFor">Troco para (opcional)</Label>
                        <Input
                          id="changeFor"
                          type="number"
                          step="0.01"
                          value={formData.changeFor || ""}
                          onChange={(e) => setFormData({ ...formData, changeFor: parseFloat(e.target.value) || null })}
                          placeholder="Ex: 100.00"
                          className="mt-1"
                        />
                        {formData.changeFor && formData.changeFor > total && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Troco: R$ {(formData.changeFor - total).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Agendamento
                    </CardTitle>
                    <CardDescription>Defina quando a entrega deve ser realizada (opcional)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DateTimePicker
                      value={formData.scheduledFor || null}
                      onChange={(value) => setFormData({ ...formData, scheduledFor: value || undefined })}
                      label=""
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Resumo do Pedido */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Resumo do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                          <span className="font-semibold">-R$ {totalDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxa de entrega:</span>
                        <span className="font-medium">R$ {(formData.deliveryFee || 0).toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-primary">R$ {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )

      case "review":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Revisar Entrega</h2>
                <p className="text-sm text-muted-foreground">Confira todos os dados antes de finalizar</p>
              </div>
              {createdDeliveryId && (
                <DeliveryPrintButtons 
                  deliveryId={createdDeliveryId} 
                  deliveryData={{
                    customer: { name: formData.customerName, phone: formData.customerPhone },
                    deliveryAddress: formData.deliveryAddress,
                    addressNumber: formData.addressNumber,
                    district: formData.district,
                    city: formData.city,
                    state: formData.state,
                    items: cart,
                    subtotal,
                    deliveryFee: formData.deliveryFee,
                    total,
                  }}
                />
              )}
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{formData.customerName}</span>
                </div>
                {formData.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="font-medium">{formData.customerPhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="font-medium">
                  {formData.deliveryAddress}, {formData.addressNumber}
                  {formData.addressComplement && ` - ${formData.addressComplement}`}
                </div>
                <div className="text-muted-foreground">{formData.district}, {formData.city} - {formData.state}</div>
                {formData.postalCode && <div className="text-sm text-muted-foreground">CEP: {formData.postalCode}</div>}
                {formData.referencePoint && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <strong>Referência:</strong> {formData.referencePoint}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produtos ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex justify-between items-start py-2 border-b last:border-0">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} × R$ {item.price.toFixed(2)}
                          {item.discount && item.discount > 0 && ` - Desconto: R$ ${item.discount.toFixed(2)}`}
                        </div>
                      </div>
                      <div className="font-semibold">
                        R$ {(item.price * item.quantity - (item.discount || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-500">
                      <span>Desconto:</span>
                      <span>-R$ {totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de Entrega:</span>
                    <span>R$ {(formData.deliveryFee || 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                  
                  {formData.paymentMethod && (
                    <>
                      <Separator />
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Forma de Pagamento:</span>
                          <span className="font-medium">
                            {formData.paymentMethod === 'MONEY' && '💵 Dinheiro'}
                            {formData.paymentMethod === 'PIX' && '📱 PIX'}
                            {formData.paymentMethod === 'DEBIT_CARD' && '💳 Débito'}
                            {formData.paymentMethod === 'CREDIT_CARD' && '💳 Crédito'}
                          </span>
                        </div>
                        {formData.paidInAdvance && (
                          <div className="text-green-600 dark:text-green-500 font-medium">
                            ✓ Pago antecipadamente
                          </div>
                        )}
                        {formData.paymentMethod === 'MONEY' && formData.changeFor && formData.changeFor > total && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Troco para:</span>
                            <span>R$ {formData.changeFor.toFixed(2)} <span className="text-muted-foreground">(Troco: R$ {(formData.changeFor - total).toFixed(2)})</span></span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {formData.scheduledFor && (
                    <>
                      <Separator />
                      <div className="text-sm">
                        <div className="text-muted-foreground mb-1">Agendamento:</div>
                        <div className="font-medium">
                          📅 {new Date(formData.scheduledFor).toLocaleString("pt-BR", {
                            dateStyle: "full",
                            timeStyle: "short"
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {(formData.notes || formData.deliveryInstructions) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {formData.notes && (
                    <div>
                      <span className="font-medium">Observações do pedido:</span>
                      <p className="text-muted-foreground mt-1">{formData.notes}</p>
                    </div>
                  )}
                  {formData.deliveryInstructions && (
                    <div>
                      <span className="font-medium">Instruções para entrega:</span>
                      <p className="text-muted-foreground mt-1">{formData.deliveryInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
      <div className="flex justify-between items-center gap-3">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstStep}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {isLastStep ? (
            <>
              <Button 
                onClick={handleSubmit} 
                disabled={createDelivery.isPending}
                size="lg"
                className="gap-2"
              >
                {createDelivery.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Criar Entrega
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleNext} size="lg" className="gap-2">
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
