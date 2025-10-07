/**
 * Route permission mappings
 * Maps route patterns to required permissions
 */

export type RoutePermission = {
  pattern: string;
  permissions: string[];
  requiresAdmin?: boolean;
  requiresEdit?: boolean;
};

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Admin routes
  {
    pattern: "/admin",
    permissions: [],
    requiresAdmin: true,
  },
  {
    pattern: "/dashboard/admin",
    permissions: [],
    requiresAdmin: true,
  },

  // Sales routes
  {
    pattern: "/dashboard/sales",
    permissions: ["CREATE_SALES", "VIEW_OWN_SALES", "VIEW_ALL_SALES"],
  },
  {
    pattern: "/sales",
    permissions: ["CREATE_SALES", "VIEW_OWN_SALES", "VIEW_ALL_SALES"],
  },
  {
    pattern: "/pdv",
    permissions: ["CREATE_SALES", "VIEW_OWN_SALES", "VIEW_ALL_SALES"],
  },

  // Products routes
  {
    pattern: "/dashboard/products",
    permissions: ["VIEW_PRODUCTS"],
  },
  {
    pattern: "/products",
    permissions: ["VIEW_PRODUCTS"],
  },

  // Inventory routes
  {
    pattern: "/dashboard/inventory",
    permissions: ["VIEW_INVENTORY"],
    requiresEdit: true, // MANAGE_INVENTORY for /edit or /create
  },
  {
    pattern: "/inventory",
    permissions: ["VIEW_INVENTORY"],
    requiresEdit: true,
  },

  // Inventory by point routes
  {
    pattern: "/dashboard/inventory-by-point",
    permissions: ["VIEW_INVENTORY"],
  },
  {
    pattern: "/inventory-by-point",
    permissions: ["VIEW_INVENTORY"],
  },

  // Customers routes
  {
    pattern: "/dashboard/customers",
    permissions: ["VIEW_CUSTOMERS"],
  },
  {
    pattern: "/customers",
    permissions: ["VIEW_CUSTOMERS"],
  },

  // Orders routes
  {
    pattern: "/dashboard/orders",
    permissions: ["VIEW_ORDERS"],
  },
  {
    pattern: "/orders",
    permissions: ["VIEW_ORDERS"],
  },

  // Points of sale routes
  {
    pattern: "/dashboard/points",
    permissions: ["VIEW_POINTS_OF_SALE"],
  },
  {
    pattern: "/points",
    permissions: ["VIEW_POINTS_OF_SALE"],
  },

  // Reports routes
  {
    pattern: "/dashboard/reports",
    permissions: ["VIEW_REPORTS"],
  },
  {
    pattern: "/reports",
    permissions: ["VIEW_REPORTS"],
  },

  // Settings routes
  {
    pattern: "/dashboard/settings",
    permissions: ["VIEW_SETTINGS"],
  },
  {
    pattern: "/settings",
    permissions: ["VIEW_SETTINGS"],
  },
];

/**
 * Check if user has permission to access a route
 */
export function checkRoutePermission(
  path: string,
  isAdmin: boolean,
  permissions: string[]
): { allowed: boolean; reason?: string } {
  // Themes are always allowed for authenticated users
  if (path.startsWith("/dashboard/themes")) {
    return { allowed: true };
  }

  // Dashboard root is always allowed (parent layout)
  if (path === "/dashboard" || path === "/dashboard/") {
    return { allowed: true };
  }

  // Find matching route permission
  for (const route of ROUTE_PERMISSIONS) {
    if (path.startsWith(route.pattern)) {
      // Admin-only route
      if (route.requiresAdmin && !isAdmin) {
        return { allowed: false, reason: "Admin access required" };
      }

      // Edit operations require MANAGE_INVENTORY
      if (route.requiresEdit && (path.includes("/edit") || path.includes("/create"))) {
        if (!isAdmin && !permissions.includes("MANAGE_INVENTORY")) {
          return { allowed: false, reason: "MANAGE_INVENTORY permission required" };
        }
        return { allowed: true };
      }

      // Check if user has any of the required permissions
      const hasPermission = isAdmin || route.permissions.some((p) => permissions.includes(p));

      if (!hasPermission) {
        return {
          allowed: false,
          reason: `Required permission: ${route.permissions.join(" or ")}`,
        };
      }

      return { allowed: true };
    }
  }

  // No matching route permission found - allow by default
  return { allowed: true };
}
