import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PermissionKey } from "@prisma/client";

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/permissions - Listar todas as permissões disponíveis
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Organizar permissões por categoria
  const permissionsByCategory = {
    dashboard: {
      label: "Dashboard e Visualizações",
      permissions: [
        { key: "VIEW_DASHBOARD", label: "Visualizar Dashboard" },
        { key: "VIEW_ANALYTICS", label: "Visualizar Analytics" },
        { key: "VIEW_REPORTS", label: "Visualizar Relatórios" },
      ],
    },
    sales: {
      label: "Vendas",
      permissions: [
        { key: "CREATE_SALES", label: "Criar Vendas" },
        { key: "VIEW_ALL_SALES", label: "Visualizar Todas as Vendas" },
        { key: "VIEW_OWN_SALES", label: "Visualizar Próprias Vendas" },
        { key: "EDIT_SALES", label: "Editar Vendas" },
        { key: "DELETE_SALES", label: "Deletar Vendas" },
        { key: "APPLY_DISCOUNTS", label: "Aplicar Descontos" },
      ],
    },
    products: {
      label: "Produtos",
      permissions: [
        { key: "VIEW_PRODUCTS", label: "Visualizar Produtos" },
        { key: "CREATE_PRODUCTS", label: "Criar Produtos" },
        { key: "EDIT_PRODUCTS", label: "Editar Produtos" },
        { key: "DELETE_PRODUCTS", label: "Deletar Produtos" },
        { key: "MANAGE_PRICES", label: "Gerenciar Preços" },
      ],
    },
    inventory: {
      label: "Inventário",
      permissions: [
        { key: "VIEW_INVENTORY", label: "Visualizar Inventário" },
        { key: "MANAGE_INVENTORY", label: "Gerenciar Inventário" },
        { key: "TRANSFER_STOCK", label: "Transferir Estoque" },
        { key: "ADJUST_STOCK", label: "Ajustar Estoque" },
        { key: "VIEW_STOCK_MOVEMENTS", label: "Ver Movimentações de Estoque" },
      ],
    },
    customers: {
      label: "Clientes",
      permissions: [
        { key: "VIEW_CUSTOMERS", label: "Visualizar Clientes" },
        { key: "CREATE_CUSTOMERS", label: "Criar Clientes" },
        { key: "EDIT_CUSTOMERS", label: "Editar Clientes" },
        { key: "DELETE_CUSTOMERS", label: "Deletar Clientes" },
        { key: "VIEW_CUSTOMER_HISTORY", label: "Ver Histórico de Cliente" },
      ],
    },
    cash: {
      label: "Caixa",
      permissions: [
        { key: "OPEN_CASH_SESSION", label: "Abrir Sessão de Caixa" },
        { key: "CLOSE_CASH_SESSION", label: "Fechar Sessão de Caixa" },
        { key: "MANAGE_CASH_TRANSACTIONS", label: "Gerenciar Transações de Caixa" },
        { key: "FORCE_CLOSE_CASH", label: "Forçar Fechamento de Caixa" },
        { key: "VIEW_CASH_REPORTS", label: "Ver Relatórios de Caixa" },
      ],
    },
    orders: {
      label: "Encomendas",
      permissions: [
        { key: "VIEW_ORDERS", label: "Visualizar Encomendas" },
        { key: "CREATE_ORDERS", label: "Criar Encomendas" },
        { key: "EDIT_ORDERS", label: "Editar Encomendas" },
        { key: "DELETE_ORDERS", label: "Deletar Encomendas" },
        { key: "MANAGE_ORDER_STATUS", label: "Gerenciar Status de Encomendas" },
      ],
    },
    pointsOfSale: {
      label: "Pontos de Venda",
      permissions: [
        { key: "VIEW_POINTS_OF_SALE", label: "Visualizar Pontos de Venda" },
        { key: "MANAGE_POINTS_OF_SALE", label: "Gerenciar Pontos de Venda" },
      ],
    },
    users: {
      label: "Usuários e Permissões",
      permissions: [
        { key: "MANAGE_USERS", label: "Gerenciar Usuários" },
        { key: "VIEW_USERS", label: "Visualizar Usuários" },
        { key: "ASSIGN_PERMISSIONS", label: "Atribuir Permissões" },
      ],
    },
    bonifications: {
      label: "Bonificações",
      permissions: [
        { key: "CREATE_BONIFICATIONS", label: "Criar Bonificações" },
        { key: "APPROVE_BONIFICATIONS", label: "Aprovar Bonificações" },
        { key: "VIEW_BONIFICATIONS", label: "Visualizar Bonificações" },
      ],
    },
    settings: {
      label: "Configurações",
      permissions: [
        { key: "VIEW_SETTINGS", label: "Visualizar Configurações" },
        { key: "MANAGE_SETTINGS", label: "Gerenciar Configurações" },
      ],
    },
  };

  return NextResponse.json(permissionsByCategory);
}
