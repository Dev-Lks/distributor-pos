import { NextRequest, NextResponse } from "next/server"

const DEFAULT_ALLOWED_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With, Accept"

type CorsResolution =
  | { kind: "handled"; response: NextResponse }
  | { kind: "apply"; apply: (response: NextResponse) => NextResponse }

function parseAllowedOrigins(request: NextRequest): { origins: string[]; allowWildcard: boolean } {
  const envValue = process.env.ALLOWED_ORIGINS
  const configuredOrigins = envValue
    ? envValue
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : []

  const origins = [...new Set(configuredOrigins)]

  // Always allow the app domain itself
  const runtimeOrigin = request.nextUrl.origin
  if (!origins.includes(runtimeOrigin)) {
    origins.push(runtimeOrigin)
  }

  // Allow localhost during local development when nothing is configured
  if (origins.length === 0) {
    origins.push("http://localhost:3000", "http://127.0.0.1:3000")
  }

  return { origins, allowWildcard: origins.includes("*") }
}

function buildCorsHeaders(origin: string | null, allowWildcard: boolean, request: NextRequest) {
  const headers = new Headers()
  const requestedHeaders = request.headers.get("access-control-request-headers")

  if (allowWildcard && origin) {
    headers.set("Access-Control-Allow-Origin", origin)
  } else if (allowWildcard && !origin) {
    headers.set("Access-Control-Allow-Origin", request.nextUrl.origin)
  } else if (origin) {
    headers.set("Access-Control-Allow-Origin", origin)
  }

  if (!headers.has("Access-Control-Allow-Origin")) {
    headers.set("Access-Control-Allow-Origin", request.nextUrl.origin)
  }

  headers.set("Access-Control-Allow-Credentials", "true")
  headers.set("Access-Control-Allow-Methods", DEFAULT_ALLOWED_METHODS)
  headers.set("Access-Control-Allow-Headers", requestedHeaders ?? DEFAULT_ALLOWED_HEADERS)
  headers.append("Vary", "Origin")

  return headers
}

function applyHeaders(response: NextResponse, headers: Headers) {
  headers.forEach((value, key) => {
    if (key.toLowerCase() === "vary") {
      const existing = response.headers.get("Vary")
      response.headers.set("Vary", existing ? `${existing}, ${value}` : value)
    } else {
      response.headers.set(key, value)
    }
  })
  return response
}

function isAllowedOrigin(origin: string | null, origins: string[], allowWildcard: boolean) {
  if (!origin) {
    return true
  }
  if (allowWildcard) {
    return true
  }
  return origins.includes(origin)
}

export function resolveCors(request: NextRequest): CorsResolution | null {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return null
  }

  const origin = request.headers.get("origin")
  const { origins, allowWildcard } = parseAllowedOrigins(request)
  const corsHeaders = buildCorsHeaders(origin, allowWildcard, request)

  if (!isAllowedOrigin(origin, origins, allowWildcard)) {
    const response = NextResponse.json(
      { error: "Origin not allowed" },
      {
        status: 403,
        headers: corsHeaders,
      },
    )
    return { kind: "handled", response }
  }

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    })
    return { kind: "handled", response }
  }

  return {
    kind: "apply",
    apply: (response: NextResponse) => applyHeaders(response, corsHeaders),
  }
}
