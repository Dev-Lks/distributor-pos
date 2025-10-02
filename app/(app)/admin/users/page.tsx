"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/lib/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { toast } from "sonner";

export default function UsersPage() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  if (!can.manageUsers) {
    redirect("/unauthorized");
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", searchQuery, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) throw new Error("Falha ao buscar usuários");
      return res.json();
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar usuário");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e acessos
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">Todos os papéis</option>
          <option value="ADMIN">Administrador</option>
          <option value="MANAGER">Gerente</option>
          <option value="SELLER">Vendedor</option>
          <option value="CASHIER">Caixa</option>
          <option value="SUPERVISOR">Supervisor</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
          <option value="SUSPENDED">Suspenso</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Papel
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  PDVs
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Último Login
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    Carregando usuários...
                  </td>
                </tr>
              )}
              {!isLoading && users?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
              {!isLoading &&
                users?.map((user: any) => (
                  <tr key={user.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">
                      {user.fullName || user.name}
                    </td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-800"
                            : user.role === "MANAGER"
                            ? "bg-orange-100 text-orange-800"
                            : user.role === "SUPERVISOR"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "SELLER"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role === "ADMIN"
                          ? "Admin"
                          : user.role === "MANAGER"
                          ? "Gerente"
                          : user.role === "SUPERVISOR"
                          ? "Supervisor"
                          : user.role === "SELLER"
                          ? "Vendedor"
                          : "Caixa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : user.status === "SUSPENDED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.status === "ACTIVE"
                          ? "Ativo"
                          : user.status === "SUSPENDED"
                          ? "Suspenso"
                          : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {user.userPointsOfSale?.length || 0} PDV(s)
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString("pt-BR")
                        : "Nunca"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleUserStatus.mutate({
                            id: user.id,
                            status: user.status,
                          })
                        }
                        disabled={toggleUserStatus.isPending}
                      >
                        {user.status === "ACTIVE" ? "Desativar" : "Ativar"}
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
