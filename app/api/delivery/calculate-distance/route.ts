import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * Retorna a distância em quilômetros
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}

/**
 * Busca coordenadas de um endereço usando Nominatim (OpenStreetMap)
 * Alternativa gratuita ao Google Maps Geocoding API
 */
async function geocodeAddress(address: string): Promise<{
  lat: number
  lng: number
} | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "DeliverySystem/1.0",
        },
      }
    )

    if (!response.ok) {
      console.error("Geocoding failed:", response.statusText)
      return null
    }

    const data = await response.json()
    
    if (data.length === 0) {
      return null
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}

/**
 * Calcula a taxa de entrega baseado na distância
 * Regras:
 * - Taxa base: R$ 5,00
 * - R$ 2,00 por km adicional após os primeiros 3km
 * - Mínimo: R$ 5,00
 * - Máximo: R$ 30,00
 */
function calculateDeliveryFee(distanceKm: number): number {
  const BASE_FEE = 5.0
  const FREE_DISTANCE = 3.0 // Primeiros 3km inclusos na taxa base
  const PRICE_PER_KM = 2.0
  const MAX_FEE = 30.0

  if (distanceKm <= FREE_DISTANCE) {
    return BASE_FEE
  }

  const additionalDistance = distanceKm - FREE_DISTANCE
  const calculatedFee = BASE_FEE + additionalDistance * PRICE_PER_KM
  
  return Math.min(calculatedFee, MAX_FEE)
}

// POST /api/delivery/calculate-distance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { originAddress, destinationAddress, originLat, originLng, destLat, destLng } = body

    let distance: number
    let originCoords: { lat: number; lng: number } | null = null
    let destCoords: { lat: number; lng: number } | null = null

    // Se não forneceu endereço de origem, buscar das configurações
    let effectiveOriginAddress = originAddress
    
    if (!effectiveOriginAddress && !originLat && !originLng) {
      // Buscar configurações do sistema
      const settings = await prisma.systemSettings.findFirst()
      
      if (settings?.defaultPointOfSaleId) {
        // Buscar endereço do ponto de venda principal
        const mainPoint = await prisma.pointOfSale.findUnique({
          where: { id: settings.defaultPointOfSaleId },
          select: { address: true, city: true, state: true, name: true }
        })
        
        if (mainPoint && mainPoint.address) {
          effectiveOriginAddress = `${mainPoint.address}, ${mainPoint.city} - ${mainPoint.state}`
          console.log(`Usando endereço do ponto principal (${mainPoint.name}): ${effectiveOriginAddress}`)
        }
      }
      
      // Se ainda não tem endereço, tentar usar endereço da empresa nas configurações
      if (!effectiveOriginAddress && settings?.address && settings?.city) {
        effectiveOriginAddress = `${settings.address}, ${settings.city} - ${settings.state}`
        console.log(`Usando endereço da empresa: ${effectiveOriginAddress}`)
      }
      
      if (!effectiveOriginAddress) {
        return NextResponse.json(
          { error: "Configure o ponto principal ou endereço da empresa nas configurações para calcular distância automaticamente" },
          { status: 400 }
        )
      }
    }

    // Se já tem coordenadas, usa direto
    if (originLat && originLng && destLat && destLng) {
      distance = calculateDistance(originLat, originLng, destLat, destLng)
      originCoords = { lat: originLat, lng: originLng }
      destCoords = { lat: destLat, lng: destLng }
    } else {
      // Caso contrário, faz geocoding dos endereços
      if (!effectiveOriginAddress || !destinationAddress) {
        return NextResponse.json(
          {
            error:
              "É necessário fornecer os endereços ou as coordenadas de origem e destino",
          },
          { status: 400 }
        )
      }

      // Geocode origem
      originCoords = await geocodeAddress(effectiveOriginAddress)
      if (!originCoords) {
        return NextResponse.json(
          { error: "Não foi possível localizar o endereço de origem" },
          { status: 400 }
        )
      }

      // Geocode destino
      destCoords = await geocodeAddress(destinationAddress)
      if (!destCoords) {
        return NextResponse.json(
          { error: "Não foi possível localizar o endereço de destino" },
          { status: 400 }
        )
      }

      distance = calculateDistance(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng
      )
    }

    // Calcular taxa
    const deliveryFee = calculateDeliveryFee(distance)

    // Calcular tempo estimado (assumindo velocidade média de 30 km/h)
    const estimatedTimeMinutes = Math.ceil((distance / 30) * 60)

    return NextResponse.json({
      distance: Math.round(distance * 100) / 100, // Arredondar para 2 casas decimais
      distanceText: `${Math.round(distance * 10) / 10} km`,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      deliveryFeeText: `R$ ${deliveryFee.toFixed(2)}`,
      estimatedTime: estimatedTimeMinutes,
      estimatedTimeText: `${estimatedTimeMinutes} minutos`,
      origin: originCoords,
      destination: destCoords,
    })
  } catch (error) {
    console.error("Failed to calculate distance:", error)
    return NextResponse.json(
      { error: "Erro ao calcular distância e taxa de entrega" },
      { status: 500 }
    )
  }
}
