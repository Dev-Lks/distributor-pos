const EARTH_RADIUS_KM = 6371

export interface GeoPoint {
  lat: number
  lng: number
}

type GeocodeOptions = {
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  limit?: number
  street?: string | null
  near?: {
    lat: number
    lng: number
    radiusKm?: number
  } | null
}

/**
 * Calcula a distância entre dois pontos em quilômetros usando a fórmula de Haversine.
 */
export function haversineDistanceKm(origin: GeoPoint, destination: GeoPoint): number {
  const dLat = degreesToRadians(destination.lat - origin.lat)
  const dLon = degreesToRadians(destination.lng - origin.lng)

  const lat1 = degreesToRadians(origin.lat)
  const lat2 = degreesToRadians(destination.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Number((EARTH_RADIUS_KM * c).toFixed(3))
}

/**
 * Faz geocoding de um endereço usando o serviço Nominatim.
 */
export async function geocodeAddress(
  address: string,
  options: GeocodeOptions = {}
): Promise<GeoPoint | null> {
  try {
    const baseParams = new URLSearchParams({ format: "json", limit: String(options.limit ?? 1) })
    const country = options.country ?? "Brasil"

    const requests: URLSearchParams[] = []

    if (options.city || options.state || options.postalCode) {
      const structuredParams = new URLSearchParams(baseParams)
      const street = (options.street ?? address).trim()
      if (street) {
        structuredParams.set("street", street)
      }
      if (options.city) structuredParams.set("city", options.city)
      if (options.state) structuredParams.set("state", options.state)
      if (options.postalCode) structuredParams.set("postalcode", options.postalCode)
      if (country) structuredParams.set("country", country)
      if (options.near) {
        const radiusKm = options.near.radiusKm ?? 10
        const latDelta = radiusKm / 111
        const lonDelta = radiusKm / (111 * Math.cos((options.near.lat * Math.PI) / 180) || 1)
        const left = options.near.lng - lonDelta
        const right = options.near.lng + lonDelta
        const top = options.near.lat + latDelta
        const bottom = options.near.lat - latDelta
        structuredParams.set("viewbox", `${left},${top},${right},${bottom}`)
        structuredParams.set("bounded", "1")
      }
      requests.push(structuredParams)
    }

    const fallbackParams = new URLSearchParams(baseParams)
    if (country && !address.toLowerCase().includes(country.toLowerCase())) {
      fallbackParams.set("q", `${address}, ${country}`)
    } else {
      fallbackParams.set("q", address)
    }
    if (options.near) {
      const radiusKm = options.near.radiusKm ?? 10
      const latDelta = radiusKm / 111
      const lonDelta = radiusKm / (111 * Math.cos((options.near.lat * Math.PI) / 180) || 1)
      const left = options.near.lng - lonDelta
      const right = options.near.lng + lonDelta
      const top = options.near.lat + latDelta
      const bottom = options.near.lat - latDelta
      fallbackParams.set("viewbox", `${left},${top},${right},${bottom}`)
      fallbackParams.set("bounded", "1")
    }

    requests.push(fallbackParams)

    for (const params of requests) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            "User-Agent": "claudiao-delivery/1.0",
          },
          next: { revalidate: 60 * 60 },
        }
      )

      if (!response.ok) {
        console.error("geocodeAddress failed", response.status, response.statusText)
        continue
      }

      const data = (await response.json()) as Array<{ lat: string; lon: string }>

      if (data?.length) {
        const radiusKm = options.near?.radiusKm ?? null
        const filtered = radiusKm
          ? data.filter((item) => {
              const distance = haversineDistanceKm(
                { lat: options.near!.lat, lng: options.near!.lng },
                { lat: Number.parseFloat(item.lat), lng: Number.parseFloat(item.lon) }
              )
              return distance <= radiusKm * 1.5
            })
          : data

        const [first] = filtered.length ? filtered : data
        if (first) {
          return {
            lat: Number.parseFloat(first.lat),
            lng: Number.parseFloat(first.lon),
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error("geocodeAddress error", error)
    return null
  }
}

export function estimateDurationMinutes(distanceKm: number, averageSpeedKmh = 28): number {
  if (distanceKm <= 0) {
    return 10
  }

  const minutes = (distanceKm / averageSpeedKmh) * 60
  return Math.max(10, Math.round(minutes))
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}
