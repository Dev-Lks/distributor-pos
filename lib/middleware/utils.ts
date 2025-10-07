import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Create a response with cache prevention headers
 * Useful for login redirects and auth flows
 */
export function createNoCacheResponse(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

/**
 * Create a redirect response to login with callback URL
 */
export function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return createNoCacheResponse(NextResponse.redirect(loginUrl));
}

/**
 * Create a redirect response to unauthorized page
 */
export function redirectToUnauthorized(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/unauthorized", req.url));
}

/**
 * Check if path is a public route
 */
export function isPublicRoute(path: string): boolean {
  return path.startsWith("/login") || path.startsWith("/api/auth");
}
