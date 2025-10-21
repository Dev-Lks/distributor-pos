/**
 * Types para o sistema de Delivery
 */

export type DeliveryStatus = 
  | 'PENDING'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'

export type VehicleType = 
  | 'MOTORCYCLE'
  | 'CAR'
  | 'BICYCLE'
  | 'FOOT'

export type PaymentStatus = 
  | 'PENDING'
  | 'PARTIAL'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'

// Zona de Entrega
export interface DeliveryZone {
  id: string
  name: string
  description?: string | null
  baseDeliveryFee: number
  minOrderValue: number
  freeDeliveryAbove?: number | null
  estimatedTime: number
  isActive: boolean
  maxDistance?: number | null
  postalCodes: string[]
  neighborhoods: string[]
  centerLat?: number | null
  centerLng?: number | null
  radius?: number | null
  motorcycleFee?: number | null
  carFee?: number | null
  bicycleFee?: number | null
  createdAt: string | Date
  updatedAt: string | Date
}

// Entregador
export interface DeliveryDriver {
  id: string
  name: string
  phone: string
  email?: string | null
  document?: string | null
  vehicleType: VehicleType
  vehiclePlate?: string | null
  vehicleModel?: string | null
  vehicleColor?: string | null
  isActive: boolean
  isAvailable: boolean
  rating?: number | null
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  currentLat?: number | null
  currentLng?: number | null
  lastLocationUpdate?: string | Date | null
  notes?: string | null
  photo?: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

// Delivery completo
export interface Delivery {
  id: string
  deliveryNumber: string
  saleId?: string | null
  orderId?: string | null
  customerId: string
  zoneId?: string | null
  driverId?: string | null
  pointOfSaleId?: string | null
  
  // Endereço
  deliveryAddress: string
  addressNumber?: string | null
  addressComplement?: string | null
  district: string
  city: string
  state: string
  postalCode?: string | null
  referencePoint?: string | null
  latitude?: number | null
  longitude?: number | null
  
  // Status
  status: DeliveryStatus
  scheduledFor?: string | Date | null
  preparedAt?: string | Date | null
  pickedUpAt?: string | Date | null
  departedAt?: string | Date | null
  arrivedAt?: string | Date | null
  deliveredAt?: string | Date | null
  cancelledAt?: string | Date | null
  cancellationReason?: string | null
  
  // Financeiro
  subtotal: number
  deliveryFee: number
  discountValue: number
  total: number
  
  // Cálculos
  distance?: number | null
  vehicleUsed?: VehicleType | null
  estimatedTime?: number | null
  actualDeliveryTime?: number | null
  
  // Observações
  notes?: string | null
  deliveryInstructions?: string | null
  internalNotes?: string | null
  
  // Pagamento
  paymentMethod?: string | null
  paidInAdvance: boolean
  paymentStatus: PaymentStatus
  changeFor?: number | null
  
  // Avaliação
  rating?: number | null
  ratingComment?: string | null
  
  // Metadados
  statusHistory?: any
  driverLocation?: any
  metadata?: any
  
  createdById?: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

// Delivery com relações
export interface DeliveryWithRelations extends Delivery {
  customer?: {
    id: string
    name: string
    phone?: string | null
    address?: string | null
  }
  zone?: DeliveryZone | null
  driver?: DeliveryDriver | null
  sale?: {
    id: string
    total: number
    date: string | Date
  } | null
  order?: {
    id: string
    orderNumber: string
    total: number
  } | null
  pointOfSale?: {
    id: string
    name: string
  } | null
  createdBy?: {
    id: string
    fullName: string
  } | null
}

// Dados para criar delivery
export interface CreateDeliveryInput {
  // Relacionamentos
  saleId?: string | null
  orderId?: string | null
  customerId: string
  zoneId?: string | null
  driverId?: string | null
  pointOfSaleId?: string | null
  
  // Endereço
  deliveryAddress: string
  addressNumber?: string | null
  addressComplement?: string | null
  district: string
  city: string
  state: string
  postalCode?: string | null
  referencePoint?: string | null
  latitude?: number | null
  longitude?: number | null
  
  // Agendamento
  scheduledFor?: string | Date | null
  
  // Financeiro
  subtotal: number
  deliveryFee: number
  discountValue?: number
  
  // Cálculos
  distance?: number | null
  vehicleUsed?: VehicleType | null
  estimatedTime?: number | null
  
  // Observações
  notes?: string | null
  deliveryInstructions?: string | null
  internalNotes?: string | null
  
  // Pagamento
  paymentMethod?: string | null
  paidInAdvance?: boolean
  changeFor?: number | null
}

// Dados para atualizar delivery
export interface UpdateDeliveryInput {
  status?: DeliveryStatus
  driverId?: string | null
  scheduledFor?: string | Date | null
  deliveryFee?: number
  discountValue?: number
  notes?: string | null
  deliveryInstructions?: string | null
  internalNotes?: string | null
  paymentMethod?: string | null
  paymentStatus?: PaymentStatus
  changeFor?: number | null
  cancellationReason?: string | null
  rating?: number | null
  ratingComment?: string | null
}

// Dados para calcular taxa de entrega
export interface CalculateDeliveryFeeInput {
  origin?: {
    address?: string
    latitude?: number
    longitude?: number
  }
  pointOfSaleId?: string | null
  destination: {
    address: string
    district?: string
    city?: string
    state?: string
    postalCode?: string
    latitude?: number
    longitude?: number
  }
  vehicleType?: VehicleType
  subtotal?: number
  pricingOverrides?: {
    baseFee?: number
    includedKm?: number
    perKm?: number
    maxFee?: number
    perMinute?: number
    vehicleMultipliers?: Partial<Record<VehicleType, number>>
  }
}

// Resposta do cálculo de taxa
export interface CalculateDeliveryFeeResponse {
  deliveryFee: number
  distanceKm: number
  estimatedTimeMinutes: number
  vehicleType: VehicleType
  originPointOfSaleId?: string | null
  origin: {
    latitude: number
    longitude: number
    resolvedAddress: string
  }
  destination: {
    latitude: number
    longitude: number
    resolvedAddress: string
  }
  breakdown: {
    baseFee: number
    distanceFee: number
    vehicleMultiplier: number
    timeFee: number
    subtotalSurcharge: number
    capped: boolean
    total: number
  }
}

// Sumário de delivery (para listagens)
export interface DeliverySummary {
  id: string
  deliveryNumber: string
  customerName: string
  customerPhone?: string | null
  deliveryAddress: string
  addressNumber?: string | null
  addressComplement?: string | null
  district: string
  city: string
  state?: string | null
  postalCode?: string | null
  referencePoint?: string | null
  deliveryInstructions?: string | null
  status: DeliveryStatus
  subtotal: number
  total: number
  deliveryFee: number
  scheduledFor?: string | Date | null
  deliveredAt?: string | Date | null
  driverName?: string | null
  vehicleType?: VehicleType | null
  rating?: number | null
  pointOfSaleName?: string | null
  pointOfSaleId?: string | null
  distance?: number | null
  estimatedTime?: number | null
  createdAt: string | Date
}

// Estatísticas de delivery
export interface DeliveryStats {
  totalDeliveries: number
  pendingDeliveries: number
  preparingDeliveries: number
  inTransitDeliveries: number
  deliveredDeliveries: number
  cancelledDeliveries: number
  failedDeliveries: number
  totalRevenue: number
  totalDeliveryFees: number
  averageDeliveryTime: number
  averageRating: number
  onTimeDeliveryRate: number
}

// Histórico de status
export interface DeliveryStatusHistory {
  status: DeliveryStatus
  timestamp: string | Date
  userId?: string | null
  userName?: string | null
  notes?: string | null
}

// Dados para criar zona
export interface CreateDeliveryZoneInput {
  name: string
  description?: string | null
  baseDeliveryFee: number
  minOrderValue?: number
  freeDeliveryAbove?: number | null
  estimatedTime?: number
  maxDistance?: number | null
  postalCodes?: string[]
  neighborhoods?: string[]
  centerLat?: number | null
  centerLng?: number | null
  radius?: number | null
  motorcycleFee?: number | null
  carFee?: number | null
  bicycleFee?: number | null
}

// Dados para criar entregador
export interface CreateDeliveryDriverInput {
  name: string
  phone: string
  email?: string | null
  document?: string | null
  vehicleType: VehicleType
  vehiclePlate?: string | null
  vehicleModel?: string | null
  vehicleColor?: string | null
  notes?: string | null
  photo?: string | null
}
