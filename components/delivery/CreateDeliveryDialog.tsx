"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CustomerSelector } from "@/components/customers/CustomerSelector"
import { useDeliveryDrivers } from "@/hooks/useDeliveryDrivers"
import { usePointsOfSale, type PointOfSale } from "@/hooks/usePointsOfSale"
import { useCreateDelivery, useCalculateDeliveryFee } from "@/hooks/useDeliveries"
import type { CustomerSummary } from "@/hooks/useCustomers"
import type { CreateDeliveryInput } from "@/types/delivery"
import { toast } from "sonner"
import { Loader2, MapPin, DollarSign, Truck, Calculator } from "lucide-react"

interface CreateDeliveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId?: string | null
  orderId?: string | null
}

interface DeliveryFormData {
  customerId: string
  deliveryAddress: string
  addressNumber: string
  addressComplement?: string
  district: string
  city: string
  state: string
  postalCode?: string
  referencePoint?: string
  latitude?: number
  longitude?: number
  
  zoneId?: string
  driverId?: string
  
  scheduledFor?: string
  
  subtotal: number
  deliveryFee: number
  discountValue: number
  
  distance?: number
  vehicleUsed?: string
  estimatedTime?: number
  
  notes?: string
  deliveryInstructions?: string
  
  paymentMethod?: string
  paidInAdvance: boolean
  changeFor?: number
  pointOfSaleId?: string
}

export function CreateDeliveryDialog({
  open,
  onOpenChange,
  saleId,
  orderId,
}: CreateDeliveryDialogProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null)
  const [distanceInfo, setDistanceInfo] = useState<{ distanceKm: number; estimatedTimeMinutes: number } | null>(null)
  
  const { data: drivers = [], isLoading: isLoadingDrivers } = useDeliveryDrivers({ activeOnly: true })
  const {
    data: pointsOfSale,
    isLoading: isLoadingPoints,
  } = usePointsOfSale()
  const availablePointsOfSale: PointOfSale[] = pointsOfSale ?? []
  
  const createDelivery = useCreateDelivery()
  const calculateFee = useCalculateDeliveryFee()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<DeliveryFormData>({
    defaultValues: {
      paidInAdvance: false,
      subtotal: 0,
      deliveryFee: 0,
      discountValue: 0,
      state: "SP",
      city: "São Paulo",
      pointOfSaleId: undefined,
    },
  })

  const watchedSubtotal = watch("subtotal")
  const watchedDeliveryFee = watch("deliveryFee")
  const watchedDiscount = watch("discountValue")
  const watchedPointOfSaleId = watch("pointOfSaleId")

  // Auto-preencher endereço do cliente
  const handleCustomerSelect = (customer: CustomerSummary | null) => {
    setSelectedCustomer(customer)
    
    if (customer?.address) {
      // Tentar parsear endereço
      const addressParts = customer.address.split(",").map(s => s.trim())
      if (addressParts.length > 0) {
        setValue("deliveryAddress", addressParts[0] || "")
        setValue("district", addressParts[2] || "")
        setValue("city", addressParts[3] || "São Paulo")
        setValue("state", addressParts[4] || "SP")
      }
    }
  }

  const calculateTotal = () => {
    return watchedSubtotal + watchedDeliveryFee - watchedDiscount
  }

  const handleCalculateDeliveryFee = async () => {
    const deliveryAddress = watch("deliveryAddress")
    const addressNumber = watch("addressNumber")
    const district = watch("district")
    const city = watch("city")
    const state = watch("state")
    const postalCode = watch("postalCode")

    if (!deliveryAddress || !city || !state) {
      toast.error("Preencha endereço, cidade e estado para calcular a taxa")
      return
    }

    const addressLine = addressNumber ? `${deliveryAddress}, ${addressNumber}` : deliveryAddress

    try {
      const result = await calculateFee.mutateAsync({
        destination: {
          address: addressLine,
          district: district || undefined,
          city,
          state,
          postalCode: postalCode || undefined,
        },
        subtotal: watchedSubtotal,
        pointOfSaleId: watchedPointOfSaleId || undefined,
      })

      setValue("deliveryFee", result.deliveryFee)
      setValue("distance", result.distanceKm)
      setValue("estimatedTime", result.estimatedTimeMinutes)
      setValue("latitude", result.destination.latitude)
      setValue("longitude", result.destination.longitude)

      if (!watchedPointOfSaleId && result.originPointOfSaleId) {
        setValue("pointOfSaleId", result.originPointOfSaleId)
      }

      setDistanceInfo({
        distanceKm: result.distanceKm,
        estimatedTimeMinutes: result.estimatedTimeMinutes,
      })

      toast.success(`Taxa calculada: R$ ${result.deliveryFee.toFixed(2)}`)
    } catch (error: any) {
      toast.error(error.message ?? "Não foi possível calcular a taxa automaticamente")
    }
  }

  const onSubmit = async (data: DeliveryFormData) => {
    if (!selectedCustomer) {
      toast.error("Selecione um cliente")
      return
    }

    try {
      const total = calculateTotal()
      
      const deliveryData: CreateDeliveryInput = {
        saleId: saleId || undefined,
        orderId: orderId || undefined,
        customerId: selectedCustomer.id,
        zoneId: data.zoneId || undefined,
        driverId: data.driverId || undefined,
  pointOfSaleId: data.pointOfSaleId || undefined,
        
        deliveryAddress: data.deliveryAddress,
        addressNumber: data.addressNumber,
        addressComplement: data.addressComplement,
        district: data.district,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        referencePoint: data.referencePoint,
        latitude: data.latitude,
        longitude: data.longitude,
        
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
        
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        discountValue: data.discountValue || 0,
        
        distance: data.distance,
        vehicleUsed: data.vehicleUsed as any,
        estimatedTime: data.estimatedTime,
        
        notes: data.notes,
        deliveryInstructions: data.deliveryInstructions,
        
        paymentMethod: data.paymentMethod,
        paidInAdvance: data.paidInAdvance,
        changeFor: data.changeFor,
      }

      await createDelivery.mutateAsync(deliveryData)
      
      toast.success("Entrega criada com sucesso!")
      reset()
      setSelectedCustomer(null)
  setDistanceInfo(null)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar entrega")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Entrega</DialogTitle>
          <DialogDescription>
            Preencha os dados da entrega abaixo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Cliente */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Cliente
            </h3>
            <CustomerSelector
              value={selectedCustomer?.id || null}
              onSelect={handleCustomerSelect}
              allowCreate={true}
            />
          </div>

          {/* Endereço */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Endereço de Entrega</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label htmlFor="deliveryAddress">Rua/Endereço *</Label>
                <Input
                  id="deliveryAddress"
                  {...register("deliveryAddress", { required: "Endereço é obrigatório" })}
                  placeholder="Rua Exemplo"
                />
                {errors.deliveryAddress && (
                  <p className="text-xs text-red-500 mt-1">{errors.deliveryAddress.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="addressNumber">Número *</Label>
                <Input
                  id="addressNumber"
                  {...register("addressNumber", { required: "Número é obrigatório" })}
                  placeholder="123"
                />
                {errors.addressNumber && (
                  <p className="text-xs text-red-500 mt-1">{errors.addressNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="addressComplement">Complemento</Label>
                <Input
                  id="addressComplement"
                  {...register("addressComplement")}
                  placeholder="Apto 101, Bloco A"
                />
              </div>

              <div>
                <Label htmlFor="district">Bairro *</Label>
                <Input
                  id="district"
                  {...register("district", { required: "Bairro é obrigatório" })}
                  placeholder="Centro"
                />
                {errors.district && (
                  <p className="text-xs text-red-500 mt-1">{errors.district.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  {...register("city", { required: "Cidade é obrigatória" })}
                  placeholder="São Paulo"
                />
                {errors.city && (
                  <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="postalCode">CEP</Label>
                <Input
                  id="postalCode"
                  {...register("postalCode")}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="referencePoint">Ponto de Referência</Label>
                <Input
                  id="referencePoint"
                  {...register("referencePoint")}
                  placeholder="Próximo ao mercado X"
                />
              </div>
            </div>
          </div>

          {/* Entregador e Agendamento */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Logística</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pointOfSaleId">Ponto de Origem</Label>
                <Select
                  value={watchedPointOfSaleId || "DEFAULT"}
                  onValueChange={(value) =>
                    setValue("pointOfSaleId", value === "DEFAULT" ? undefined : value)
                  }
                  disabled={isLoadingPoints}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ponto de venda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEFAULT">Padrão do sistema</SelectItem>
                    {availablePointsOfSale.map((point) => (
                      <SelectItem key={point.id} value={point.id}>
                        {point.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="driverId">Entregador</Label>
                <Select
                  value={watch("driverId") || "NONE"}
                  onValueChange={(value) => setValue("driverId", value === "NONE" ? undefined : value)}
                  disabled={isLoadingDrivers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o entregador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Nenhum (atribuir depois)</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} ({driver.vehicleType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scheduledFor">Agendar Para</Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  {...register("scheduledFor")}
                />
              </div>

              <div>
                <Label htmlFor="estimatedTime">Tempo Estimado (min)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  {...register("estimatedTime", { valueAsNumber: true })}
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="subtotal">Subtotal (itens) *</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  {...register("subtotal", { 
                    required: "Subtotal é obrigatório",
                    valueAsNumber: true,
                  })}
                  placeholder="0.00"
                />
                {errors.subtotal && (
                  <p className="text-xs text-red-500 mt-1">{errors.subtotal.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="deliveryFee">Taxa de Entrega *</Label>
                <div className="flex gap-2">
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    {...register("deliveryFee", { 
                      required: "Taxa é obrigatória",
                      valueAsNumber: true,
                    })}
                    placeholder="0.00"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCalculateDeliveryFee}
                    disabled={calculateFee.isPending}
                    className="whitespace-nowrap"
                  >
                    {calculateFee.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Calculando
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Calcular
                      </>
                    )}
                  </Button>
                </div>
                {errors.deliveryFee && (
                  <p className="text-xs text-red-500 mt-1">{errors.deliveryFee.message}</p>
                )}
                {distanceInfo && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {distanceInfo.distanceKm.toFixed(2)} km · {distanceInfo.estimatedTimeMinutes} min de rota estimada
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="discountValue">Desconto</Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  {...register("discountValue", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold">
                  R$ {calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Observações</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="deliveryInstructions">Instruções de Entrega</Label>
                <Textarea
                  id="deliveryInstructions"
                  {...register("deliveryInstructions")}
                  placeholder="Ex: Interfone 302, deixar com porteiro, etc"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações do Cliente</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Observações gerais"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createDelivery.isPending}>
              {createDelivery.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Criar Entrega
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
