"use client";

import { useSession } from "next-auth/react";
import type { PermissionKey } from "@prisma/client";

export function usePermissions() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin || false;
  const permissions = (session?.user?.permissions || []) as PermissionKey[];

  const hasPermission = (permission: PermissionKey) => {
    return isAdmin || permissions.includes(permission);
  };

  const can = {
    // Dashboard
    viewDashboard: hasPermission("VIEW_DASHBOARD"),
    viewAnalytics: hasPermission("VIEW_ANALYTICS"),
    viewReports: hasPermission("VIEW_REPORTS"),

    // Gestão de usuários
    manageUsers: hasPermission("MANAGE_USERS"),
    viewUsers: hasPermission("VIEW_USERS"),
    assignPermissions: hasPermission("ASSIGN_PERMISSIONS"),

    // Vendas
    createSales: hasPermission("CREATE_SALES"),
    viewAllSales: hasPermission("VIEW_ALL_SALES"),
    viewOwnSales: hasPermission("VIEW_OWN_SALES"),
    editSales: hasPermission("EDIT_SALES"),
    deleteSales: hasPermission("DELETE_SALES"),
    applyDiscounts: hasPermission("APPLY_DISCOUNTS"),

    // Produtos
    viewProducts: hasPermission("VIEW_PRODUCTS"),
    createProducts: hasPermission("CREATE_PRODUCTS"),
    editProducts: hasPermission("EDIT_PRODUCTS"),
    deleteProducts: hasPermission("DELETE_PRODUCTS"),
    managePrices: hasPermission("MANAGE_PRICES"),

    // Inventário
    viewInventory: hasPermission("VIEW_INVENTORY"),
    manageInventory: hasPermission("MANAGE_INVENTORY"),
    transferStock: hasPermission("TRANSFER_STOCK"),
    adjustStock: hasPermission("ADJUST_STOCK"),
    viewStockMovements: hasPermission("VIEW_STOCK_MOVEMENTS"),

    // Clientes
    viewCustomers: hasPermission("VIEW_CUSTOMERS"),
    createCustomers: hasPermission("CREATE_CUSTOMERS"),
    editCustomers: hasPermission("EDIT_CUSTOMERS"),
    deleteCustomers: hasPermission("DELETE_CUSTOMERS"),
    viewCustomerHistory: hasPermission("VIEW_CUSTOMER_HISTORY"),

    // Caixa
    openCashSession: hasPermission("OPEN_CASH_SESSION"),
    closeCashSession: hasPermission("CLOSE_CASH_SESSION"),
    manageCashTransactions: hasPermission("MANAGE_CASH_TRANSACTIONS"),
    forceCloseCash: hasPermission("FORCE_CLOSE_CASH"),
    viewCashReports: hasPermission("VIEW_CASH_REPORTS"),

    // Encomendas
    viewOrders: hasPermission("VIEW_ORDERS"),
    createOrders: hasPermission("CREATE_ORDERS"),
    editOrders: hasPermission("EDIT_ORDERS"),
    deleteOrders: hasPermission("DELETE_ORDERS"),
    manageOrderStatus: hasPermission("MANAGE_ORDER_STATUS"),

    // Pontos de venda
    viewPointsOfSale: hasPermission("VIEW_POINTS_OF_SALE"),
    managePointsOfSale: hasPermission("MANAGE_POINTS_OF_SALE"),

    // Bonificações
    createBonifications: hasPermission("CREATE_BONIFICATIONS"),
    approveBonifications: hasPermission("APPROVE_BONIFICATIONS"),
    viewBonifications: hasPermission("VIEW_BONIFICATIONS"),

    // Configurações
    viewSettings: hasPermission("VIEW_SETTINGS"),
    manageSettings: hasPermission("MANAGE_SETTINGS"),
  };

  return { 
    can, 
    isAdmin, 
    permissions,
    hasPermission,
  };
}
