import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { checkRoutePermission } from "@/lib/middleware/permissions";
import {
  isPublicRoute,
  createNoCacheResponse,
  redirectToLogin,
  redirectToUnauthorized,
} from "@/lib/middleware/utils";
import { limiter, authLimiter } from "@/lib/rate-limit";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Get IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous';

    // Rate limiting para rotas de API
    if (path.startsWith('/api/')) {
      try {
        // Rate limiting mais restritivo para autenticação
        if (path.startsWith('/api/auth/') || path === '/api/login') {
          await authLimiter.check(5, ip); // 5 tentativas em 15min
        } else {
          await limiter.check(100, ip); // 100 req/min para outras APIs
        }
      } catch {
        logger.warn('Rate limit exceeded', { ip, path });
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { 
            status: 429,
            headers: {
              'Retry-After': '60'
            }
          }
        );
      }
    }

    // Public routes - allow with no-cache headers
    if (isPublicRoute(path)) {
      return createNoCacheResponse(NextResponse.next());
    }

    // Unauthenticated user - redirect to login
    if (!token) {
      return redirectToLogin(req);
    }

    // Check if admin requires password change
    // EXCETO para a rota de API de change-password (que precisa funcionar)
    if (token.requiresPasswordChange && 
        path !== '/change-password' && 
        !path.includes('/api/users/') && 
        !path.includes('/change-password')) {
      logger.info('Redirecting admin to change password', { email: token.email })
      return NextResponse.redirect(new URL('/change-password', req.url))
    }

    // Allow access to change-password page if flag is set
    if (path === '/change-password' && token.requiresPasswordChange) {
      return NextResponse.next()
    }

    // Extract user info from token
    const isAdmin = token.isAdmin as boolean;
    const permissions = (token.permissions as string[]) || [];

    // Debug log for non-admin dashboard access
    if (!isAdmin && path.startsWith("/dashboard")) {
      logger.debug("Middleware permission check", {
        path,
        isAdmin,
        email: token.email,
        permissions: permissions.length > 0 ? permissions : "EMPTY",
      });
    }

    // Check route permissions
    const permissionCheck = checkRoutePermission(path, isAdmin, permissions);

    if (!permissionCheck.allowed) {
      logger.warn("Access denied", {
        path,
        email: token.email,
        reason: permissionCheck.reason,
      });
      return redirectToUnauthorized(req);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/inventory/:path*",
    "/inventory-by-point/:path*",
    "/products/:path*",
    "/sales/:path*",
    "/pdv/:path*",
    "/customers/:path*",
    "/orders/:path*",
    "/points/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/api/inventory/:path*",
    "/api/points/:path*",
    "/api/product-points-of-sale/:path*",
    "/api/products/:path*",
    "/api/sales/:path*",
    "/api/users/:path*",
    "/api/customers/:path*",
    "/api/orders/:path*",
    "/api/customer-bonifications/:path*",
  ],
};
