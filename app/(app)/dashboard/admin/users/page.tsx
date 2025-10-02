"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/lib/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Edit, Shield } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export default function UsersPage() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminFilter, setAdminFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  if (!can.manageUsers) {
    redirect("/unauthorized");
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", searchQuery, adminFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (adminFilter) params.set("isAdmin", adminFilter);
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
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">Todos os tipos</option>
          <option value="true">Administradores</option>
          <option value="false">Usuários Comuns</option>
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
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Permissões
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
                  <td colSpan={8} className="px-4 py-8 text-center">
                    Carregando usuários...
                  </td>
                </tr>
              )}
              {!isLoading && users?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
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
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.isAdmin
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.isAdmin && <Shield className="h-3 w-3" />}
                        {user.isAdmin ? "Administrador" : "Usuário"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-muted-foreground">
                        {user.isAdmin
                          ? "Todas"
                          : `${user.permissions?.length || 0} permissões`}
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
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/admin/users/${user.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
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
                      </div>
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
