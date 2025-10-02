"use client";

import { useSession } from "next-auth/react";

export function usePermissions() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const can = {
    // Gestão de usuários
    manageUsers: role === "ADMIN",
    createSellers: role === "ADMIN" || role === "MANAGER",
    viewAllUsers: role === "ADMIN",

    // Vendas
    createSales: true, // Todos podem criar vendas
    viewAllSales: role === "ADMIN" || role === "MANAGER",
    viewOwnSales: true,
    deleteSales: role === "ADMIN" || role === "MANAGER",

    // Inventário
    manageInventory: role === "ADMIN" || role === "MANAGER",
    viewInventory: true, // Todos podem ver
    transferStock: role === "ADMIN" || role === "MANAGER",
    adjustStock: role === "ADMIN" || role === "MANAGER",

    // Relatórios
    viewGlobalReports: role === "ADMIN",
    viewPOSReports:
      role === "ADMIN" || role === "MANAGER" || role === "SUPERVISOR",
    viewOwnPerformance: true,

    // Caixa
    manageCashSessions: role !== "SELLER",
    openCashSession: role !== "SELLER",
    forceCloseCashSession: role === "ADMIN",

    // Clientes
    createCustomers: true, // Todos podem cadastrar
    editCustomers: role === "ADMIN" || role === "MANAGER",
    deleteCustomers: role === "ADMIN",

    // Encomendas
    createOrders: true,
    manageOrders: role === "ADMIN" || role === "MANAGER",
    viewAllOrders: role === "ADMIN" || role === "MANAGER",

    // Pontos de venda
    managePOS: role === "ADMIN",
    viewPOSData: role !== "SELLER",

    // Bonificações
    approveBonifications: role === "ADMIN" || role === "MANAGER",
    createBonifications: true,
  };

  const is = {
    admin: role === "ADMIN",
    manager: role === "MANAGER",
    seller: role === "SELLER",
    cashier: role === "CASHIER",
    supervisor: role === "SUPERVISOR",
  };

  return { can, is, role };
}
