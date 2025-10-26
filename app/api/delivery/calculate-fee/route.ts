import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  haversineDistanceKm,
  geocodeAddress,
  estimateDurationMinutes,
} from "@/lib/delivery/distance"
import type { VehicleType } from "@/types/delivery"

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

const vehicleTypes: VehicleType[] = ["MOTORCYCLE", "CAR", "BICYCLE", "FOOT"]

const requestSchema = z.object({
  origin: z
    .object({
      address: z.string().min(3).optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  pointOfSaleId: z.string().min(1).nullable().optional(),
  destination: z.object({
    address: z.string().min(3, "Endereço de destino é obrigatório"),
    district: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  vehicleType: z
    .enum(["MOTORCYCLE", "CAR", "BICYCLE", "FOOT"] as const)
    .default("MOTORCYCLE")
    .optional(),
  subtotal: z.number().optional(),
  pricingOverrides: z
    .object({
      baseFee: z.number().min(0).optional(),
      includedKm: z.number().min(0).optional(),
      perKm: z.number().min(0).optional(),
      maxFee: z.number().min(0).optional(),
      perMinute: z.number().min(0).optional(),
      vehicleMultipliers: z
        .object({
          MOTORCYCLE: z.number().min(0).optional(),
          CAR: z.number().min(0).optional(),
          BICYCLE: z.number().min(0).optional(),
          FOOT: z.number().min(0).optional(),
        })
        .partial()
        .optional(),
    })
    .optional(),
})

type DeliveryOriginMetadata = {
  latitude?: number
  longitude?: number
  address?: string
}

type DeliveryPricingMetadata = {
  baseFee?: number
  includedKm?: number
  perKm?: number
  maxFee?: number
  perMinute?: number
  vehicleMultipliers?: Partial<Record<VehicleType, number>>
}

type DeliveryMetadata = {
  delivery?: {
    origin?: DeliveryOriginMetadata
    pricing?: DeliveryPricingMetadata
  }
}

type PricingConfig = {
  baseFee: number
  includedKm: number
  perKm: number
  maxFee: number
  perMinute: number
  vehicleMultipliers: Record<VehicleType, number>
}

const defaultPricing: PricingConfig = {
  baseFee: 6,
  includedKm: 3,
  perKm: 2.2,
  maxFee: 38,
  perMinute: 0.15,
  vehicleMultipliers: {
    MOTORCYCLE: 1,
    CAR: 1.25,
    BICYCLE: 0.85,
    FOOT: 0.75,
  },
}

function mergePricing(
  metadataPricing: DeliveryPricingMetadata | undefined,
  overrides: z.infer<typeof requestSchema>["pricingOverrides"] | undefined,
): PricingConfig {
  const merged: PricingConfig = {
    ...defaultPricing,
    ...(metadataPricing
      ? {
          baseFee: metadataPricing.baseFee ?? defaultPricing.baseFee,
          includedKm: metadataPricing.includedKm ?? defaultPricing.includedKm,
          perKm: metadataPricing.perKm ?? defaultPricing.perKm,
          maxFee: metadataPricing.maxFee ?? defaultPricing.maxFee,
          perMinute: metadataPricing.perMinute ?? defaultPricing.perMinute,
          vehicleMultipliers: {
            ...defaultPricing.vehicleMultipliers,
            ...(metadataPricing.vehicleMultipliers ?? {}),
          },
        }
      : defaultPricing),
  }

  if (overrides) {
    if (typeof overrides.baseFee === "number") merged.baseFee = overrides.baseFee
    if (typeof overrides.includedKm === "number") merged.includedKm = overrides.includedKm
    if (typeof overrides.perKm === "number") merged.perKm = overrides.perKm
    if (typeof overrides.maxFee === "number") merged.maxFee = overrides.maxFee
    if (typeof overrides.perMinute === "number") merged.perMinute = overrides.perMinute
    if (overrides.vehicleMultipliers) {
      merged.vehicleMultipliers = {
        ...merged.vehicleMultipliers,
        ...overrides.vehicleMultipliers,
      }
    }
  }

  merged.vehicleMultipliers = vehicleTypes.reduce<Record<VehicleType, number>>((acc, key) => {
    const value = merged.vehicleMultipliers[key]
    acc[key] = typeof value === "number" ? value : defaultPricing.vehicleMultipliers[key]
    return acc
  }, {} as Record<VehicleType, number>)

  return merged
}

type SystemSettingsSnapshot = {
  address: string | null
  addressNumber: string | null
  district: string | null
  city: string | null
  state: string | null
  defaultPointOfSaleId: string | null
}

type PointOfSaleSnapshot = {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  country: string | null
}

type ResolvedLocation = {
  coords: { lat: number; lng: number }
  resolvedAddress: string
}

function ensureCountrySuffix(address: string, country: string = "Brasil"): string {
  const normalized = address.toLowerCase()
  const normalizedCountry = country.toLowerCase()
  if (normalized.includes(normalizedCountry)) {
    return address
  }

  return `${address}, ${country}`
}

function extractStreet(address: string): string {
  const [street] = address.split(",")
  return street?.trim() ?? address.trim()
}

async function fetchPointOfSaleSnapshot(pointOfSaleId?: string | null): Promise<PointOfSaleSnapshot | null> {
  if (!pointOfSaleId) {
    return null
  }

  const point = await prisma.pointOfSale.findUnique({
    where: { id: pointOfSaleId },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
      country: true,
    },
  })

  return point ?? null
}

async function resolveOriginAddress(
  originInput: z.infer<typeof requestSchema>["origin"],
  pointOfSale: PointOfSaleSnapshot | null,
  metadataOrigin: DeliveryOriginMetadata | undefined,
  systemSettings: SystemSettingsSnapshot | null,
  nearbyCoords?: { lat: number; lng: number } | null,
): Promise<ResolvedLocation> {
  if (originInput?.latitude && originInput.longitude) {
    return {
      coords: { lat: originInput.latitude, lng: originInput.longitude },
      resolvedAddress: originInput.address ?? "Coordenadas informadas",
    }
  }

  const pointOfSaleAddress = pointOfSale
    ? [pointOfSale.address, pointOfSale.city, pointOfSale.state, pointOfSale.country]
        .filter(Boolean)
        .join(", ") || null
    : null

  if (!originInput?.address && metadataOrigin?.latitude && metadataOrigin.longitude) {
    return {
      coords: { lat: metadataOrigin.latitude, lng: metadataOrigin.longitude },
      resolvedAddress: metadataOrigin.address ?? pointOfSaleAddress ?? "Origem configurada",
    }
  }

  let candidateAddress = originInput?.address?.trim()

  if (!candidateAddress && metadataOrigin?.address) {
    candidateAddress = metadataOrigin.address
  }

  if (!candidateAddress && pointOfSaleAddress) {
    candidateAddress = pointOfSaleAddress
  }

  if (!candidateAddress && systemSettings) {
    candidateAddress = [
      systemSettings.address,
      systemSettings.addressNumber,
      systemSettings.district,
      systemSettings.city,
      systemSettings.state,
    ]
      .filter(Boolean)
      .join(", ")
  }

  if (!candidateAddress) {
    throw new Error(
      "Defina um ponto de venda com endereço ou informe manualmente a origem da entrega.",
    )
  }

  const country = pointOfSale?.country ?? "Brasil"
  const trimmedAddress = candidateAddress.trim()
  const coords = await geocodeAddress(trimmedAddress, {
    street: extractStreet(trimmedAddress),
    city: pointOfSale?.city ?? systemSettings?.city ?? null,
    state: pointOfSale?.state ?? systemSettings?.state ?? null,
    country,
    near: nearbyCoords
      ? {
          lat: nearbyCoords.lat,
          lng: nearbyCoords.lng,
          radiusKm: 12,
        }
      : null,
  })
  if (!coords) {
    throw new Error("Não foi possível localizar o endereço de origem configurado.")
  }

  return {
    coords: { lat: coords.lat, lng: coords.lng },
    resolvedAddress: ensureCountrySuffix(trimmedAddress, country),
  }
}

async function resolveDestination(
  destination: z.infer<typeof requestSchema>["destination"],
): Promise<ResolvedLocation> {
  if (destination.latitude && destination.longitude) {
    return {
      coords: { lat: destination.latitude, lng: destination.longitude },
      resolvedAddress: destination.address,
    }
  }

  const parts = [
    destination.address,
    destination.district,
    destination.city,
    destination.state,
    destination.postalCode,
  ].filter(Boolean)

  const fullAddress = parts.join(", ") || destination.address
  const coords = await geocodeAddress(fullAddress, {
    street: extractStreet(destination.address),
    city: destination.city ?? null,
    state: destination.state ?? null,
    postalCode: destination.postalCode ?? null,
    country: "Brasil",
  })

  if (!coords) {
    throw new Error("Não foi possível localizar o endereço de destino informado.")
  }

  return {
    coords: { lat: coords.lat, lng: coords.lng },
    resolvedAddress: ensureCountrySuffix(fullAddress),
  }
}

// POST /api/delivery/calculate-fee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = requestSchema.parse(body)

    const systemSettings = await prisma.systemSettings.findFirst({
      select: {
        address: true,
        addressNumber: true,
        district: true,
        city: true,
        state: true,
        defaultPointOfSaleId: true,
        metadata: true,
      },
    })

    const metadata = (systemSettings?.metadata as DeliveryMetadata | null) ?? null
    const deliveryMetadata = metadata?.delivery
    const pricing = mergePricing(deliveryMetadata?.pricing, parsed.pricingOverrides)

    const snapshot: SystemSettingsSnapshot | null = systemSettings
      ? {
          address: systemSettings.address ?? null,
          addressNumber: systemSettings.addressNumber ?? null,
          district: systemSettings.district ?? null,
          city: systemSettings.city ?? null,
          state: systemSettings.state ?? null,
          defaultPointOfSaleId: systemSettings.defaultPointOfSaleId ?? null,
        }
      : null

    const preferredPointOfSaleId = parsed.pointOfSaleId ?? snapshot?.defaultPointOfSaleId ?? null
    const pointOfSale = await fetchPointOfSaleSnapshot(preferredPointOfSaleId)

    const destination = await resolveDestination(parsed.destination)
    const origin = await resolveOriginAddress(
      parsed.origin,
      pointOfSale,
      deliveryMetadata?.origin,
      snapshot,
      destination.coords,
    )

    const distanceKm = haversineDistanceKm(origin.coords, destination.coords)
    const estimatedTimeMinutes = estimateDurationMinutes(distanceKm)

    const vehicleType = parsed.vehicleType ?? "MOTORCYCLE"
    const vehicleMultiplier = pricing.vehicleMultipliers[vehicleType] ?? 1

    const effectiveDistance = Math.max(0, distanceKm - pricing.includedKm)
    const distanceFee = effectiveDistance * pricing.perKm
    const timeFee = estimatedTimeMinutes * pricing.perMinute

    const baseValue = pricing.baseFee + distanceFee + timeFee
    const subtotalSurcharge =
      typeof parsed.subtotal === "number" && parsed.subtotal > 0 && parsed.subtotal < 50
        ? 2
        : 0

    let total = baseValue * vehicleMultiplier + subtotalSurcharge
    let capped = false

    if (pricing.maxFee > 0 && total > pricing.maxFee) {
      total = pricing.maxFee
      capped = true
    }

    const deliveryFee = Number(total.toFixed(2))

    return NextResponse.json({
      deliveryFee,
      distanceKm: Number(distanceKm.toFixed(2)),
      estimatedTimeMinutes,
      vehicleType,
      originPointOfSaleId: pointOfSale?.id ?? null,
      origin: {
        latitude: origin.coords.lat,
        longitude: origin.coords.lng,
        resolvedAddress: origin.resolvedAddress,
      },
      destination: {
        latitude: destination.coords.lat,
        longitude: destination.coords.lng,
        resolvedAddress: destination.resolvedAddress,
      },
      breakdown: {
        baseFee: Number(pricing.baseFee.toFixed(2)),
        distanceFee: Number(distanceFee.toFixed(2)),
        vehicleMultiplier,
        timeFee: Number(timeFee.toFixed(2)),
        subtotalSurcharge: Number(subtotalSurcharge.toFixed(2)),
        capped,
        total: deliveryFee,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 },
      )
    }

    console.error("calculate-fee error", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao calcular taxa de entrega" },
      { status: 500 },
    )
  }
}
