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

    // Proteção de rotas por permissões
    const isAdmin = token.isAdmin as boolean;
    const permissions = (token.permissions as string[]) || [];

    // DEBUG: Log para verificar permissões (REMOVER DEPOIS)
    if (!isAdmin && path.startsWith("/dashboard")) {
      console.log("🔍 DEBUG Middleware:", {
        path,
        isAdmin,
        email: token.email,
        permissions: permissions.length > 0 ? permissions : "VAZIO!",
      });
    }

    // Helper para verificar permissão
    const hasPermission = (permission: string) => {
      return isAdmin || permissions.includes(permission);
    };

    // Rotas exclusivas do ADMIN (legado - manter para compatibilidade)
    if (path.startsWith("/admin") && !path.startsWith("/dashboard/admin")) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Rotas de administração dentro do dashboard
    if (path.startsWith("/dashboard/admin")) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Dashboard root - sempre permitido (é o layout pai)
    // As rotas filhas (/dashboard/sales, /dashboard/products, etc.) são verificadas abaixo

    // Vendas - CREATE_SALES ou VIEW_OWN_SALES ou VIEW_ALL_SALES
    if (path.startsWith("/dashboard/sales") || path.startsWith("/sales") || path.startsWith("/pdv")) {
      if (!hasPermission("CREATE_SALES") && !hasPermission("VIEW_OWN_SALES") && !hasPermission("VIEW_ALL_SALES")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Produtos - VIEW_PRODUCTS
    if (path.startsWith("/dashboard/products") || path.startsWith("/products")) {
      if (!hasPermission("VIEW_PRODUCTS")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Inventário - VIEW_INVENTORY
    if (path.startsWith("/dashboard/inventory") || path.startsWith("/inventory")) {
      // Edição requer MANAGE_INVENTORY
      if (path.includes("/edit") || path.includes("/create")) {
        if (!hasPermission("MANAGE_INVENTORY")) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }
      // Visualização requer VIEW_INVENTORY
      else if (!hasPermission("VIEW_INVENTORY")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Inventário por ponto - VIEW_INVENTORY
    if (path.startsWith("/dashboard/inventory-by-point") || path.startsWith("/inventory-by-point")) {
      if (!hasPermission("VIEW_INVENTORY")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Clientes - VIEW_CUSTOMERS
    if (path.startsWith("/dashboard/customers") || path.startsWith("/customers")) {
      if (!hasPermission("VIEW_CUSTOMERS")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Encomendas - VIEW_ORDERS
    if (path.startsWith("/dashboard/orders") || path.startsWith("/orders")) {
      if (!hasPermission("VIEW_ORDERS")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Pontos de Venda - VIEW_POINTS_OF_SALE
    if (path.startsWith("/dashboard/points") || path.startsWith("/points")) {
      if (!hasPermission("VIEW_POINTS_OF_SALE")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Relatórios - VIEW_REPORTS
    if (path.startsWith("/dashboard/reports") || path.startsWith("/reports")) {
      if (!hasPermission("VIEW_REPORTS")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Configurações - VIEW_SETTINGS
    if (path.startsWith("/dashboard/settings") || path.startsWith("/settings")) {
      if (!hasPermission("VIEW_SETTINGS")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Temas - sempre permitido para usuários autenticados
    if (path.startsWith("/dashboard/themes")) {
      return NextResponse.next();
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
