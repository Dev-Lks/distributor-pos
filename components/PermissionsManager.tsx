"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckSquare, Square } from "lucide-react";
import type { PermissionKey } from "@prisma/client";

interface PermissionCategory {
  label: string;
  permissions: Array<{
    key: PermissionKey;
    label: string;
  }>;
}

interface PermissionsManagerProps {
  selectedPermissions: PermissionKey[];
  onChange: (permissions: PermissionKey[]) => void;
  disabled?: boolean;
}

const PERMISSION_CATEGORIES: Record<string, PermissionCategory> = {
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

export function PermissionsManager({
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localPermissions, setLocalPermissions] = useState<PermissionKey[]>(selectedPermissions);

  useEffect(() => {
    setLocalPermissions(selectedPermissions);
  }, [selectedPermissions]);

  const handleTogglePermission = (permission: PermissionKey) => {
    const newPermissions = localPermissions.includes(permission)
      ? localPermissions.filter((p) => p !== permission)
      : [...localPermissions, permission];
    
    setLocalPermissions(newPermissions);
    onChange(newPermissions);
  };

  const handleSelectAllInCategory = (categoryKey: string) => {
    const category = PERMISSION_CATEGORIES[categoryKey];
    const categoryPermissions = category.permissions.map((p) => p.key);
    const allSelected = categoryPermissions.every((p) =>
      localPermissions.includes(p)
    );

    let newPermissions: PermissionKey[];
    if (allSelected) {
      // Desmarcar todas da categoria
      newPermissions = localPermissions.filter(
        (p) => !categoryPermissions.includes(p)
      );
    } else {
      // Marcar todas da categoria
      const toAdd = categoryPermissions.filter(
        (p) => !localPermissions.includes(p)
      );
      newPermissions = [...localPermissions, ...toAdd];
    }

    setLocalPermissions(newPermissions);
    onChange(newPermissions);
  };

  const handleSelectAll = () => {
    const allPermissions = Object.values(PERMISSION_CATEGORIES).flatMap(
      (cat) => cat.permissions.map((p) => p.key)
    );
    
    const allSelected = allPermissions.every((p) => localPermissions.includes(p));
    
    const newPermissions = allSelected ? [] : allPermissions;
    setLocalPermissions(newPermissions);
    onChange(newPermissions);
  };

  const filteredCategories = Object.entries(PERMISSION_CATEGORIES).reduce(
    (acc, [key, category]) => {
      const filteredPermissions = category.permissions.filter((perm) =>
        perm.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredPermissions.length > 0 || searchQuery === "") {
        acc[key] = {
          ...category,
          permissions: searchQuery === "" ? category.permissions : filteredPermissions,
        };
      }

      return acc;
    },
    {} as Record<string, PermissionCategory>
  );

  const totalPermissions = Object.values(PERMISSION_CATEGORIES).reduce(
    (sum, cat) => sum + cat.permissions.length,
    0
  );

  const allSelected = localPermissions.length === totalPermissions;

  return (
    <div className="space-y-6">
      {/* Header com busca */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Permissões</h3>
          <p className="text-sm text-muted-foreground">
            {localPermissions.length} de {totalPermissions} permissões selecionadas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={disabled}
        >
          {allSelected ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Desmarcar Todas
            </>
          ) : (
            <>
              <CheckSquare className="mr-2 h-4 w-4" />
              Selecionar Todas
            </>
          )}
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar permissões..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      {/* Categorias */}
      <div className="space-y-6">
        {Object.entries(filteredCategories).map(([categoryKey, category]) => {
          const categoryPermissions = category.permissions.map((p) => p.key);
          const allCategorySelected = categoryPermissions.every((p) =>
            localPermissions.includes(p)
          );
          const someCategorySelected = categoryPermissions.some((p) =>
            localPermissions.includes(p)
          );

          return (
            <div
              key={categoryKey}
              className="border rounded-lg p-4 space-y-3"
            >
              {/* Título da categoria com checkbox "Select All" */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allCategorySelected}
                    onCheckedChange={() => handleSelectAllInCategory(categoryKey)}
                    disabled={disabled}
                    className={someCategorySelected && !allCategorySelected ? "opacity-50" : ""}
                  />
                  <h4 className="font-medium text-sm">{category.label}</h4>
                </div>
                <span className="text-xs text-muted-foreground">
                  {categoryPermissions.filter((p) => localPermissions.includes(p)).length}/
                  {categoryPermissions.length}
                </span>
              </div>

              {/* Lista de permissões */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                {category.permissions.map((permission) => (
                  <label
                    key={permission.key}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                  >
                    <Checkbox
                      checked={localPermissions.includes(permission.key)}
                      onCheckedChange={() => handleTogglePermission(permission.key)}
                      disabled={disabled}
                    />
                    <span className="text-sm">{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(filteredCategories).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma permissão encontrada com "{searchQuery}"
        </div>
      )}
    </div>
  );
}
