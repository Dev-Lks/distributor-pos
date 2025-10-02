import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Rotas públicas
    if (path.startsWith("/login") || path.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Usuário não autenticado
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Proteção de rotas por role
    const role = token.role as string;

    // Rotas exclusivas do ADMIN
    if (path.startsWith("/admin") || path.startsWith("/dashboard/users")) {
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Rotas de gerente - vendedores e caixas não acessam
    if (path.startsWith("/dashboard") && !path.startsWith("/dashboard/users")) {
      if (role === "SELLER" || role === "CASHIER") {
        return NextResponse.redirect(new URL("/sales", req.url));
      }
    }

    // Rotas de relatórios
    if (path.startsWith("/reports")) {
      if (role === "SELLER" || role === "CASHIER") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Gestão de inventário - apenas visualização para vendedores
    if (path.startsWith("/inventory") && path.includes("/edit")) {
      if (role === "SELLER" || role === "CASHIER") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
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
    "/sales/:path*",
    "/inventory/:path*",
    "/reports/:path*",
    "/orders/:path*",
    "/api/inventory/:path*",
    "/api/points/:path*",
    "/api/product-points-of-sale/:path*",
    "/api/products/:path*",
    "/api/sales/:path*",
    "/api/users/:path*",
  ],
};
