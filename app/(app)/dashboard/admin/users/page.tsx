"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/lib/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Edit, Shield, Trash2 } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { DeleteUserDialog } from "@/components/admin/DeleteUserDialog";
import type { User } from "@/types";

export default function UsersPage() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminFilter, setAdminFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>("");

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

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao desativar usuário");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário desativado com sucesso!");
      setDeleteUserId(null);
      setDeleteUserName("");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desativar usuário: ${error.message}`);
    },
  });

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie usuários, permissões e acessos
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Novo Usuário</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
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
          className="px-4 py-2 border rounded-md text-sm"
        >
          <option value="">Todos os tipos</option>
          <option value="true">Administradores</option>
          <option value="false">Usuários Comuns</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-md text-sm"
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
          <table className="w-full min-w-[800px]">
            <thead className="bg-muted">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium">
                  Nome
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium hidden md:table-cell">
                  Email
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium">
                  Tipo
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium hidden lg:table-cell">
                  Permissões
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium">
                  Status
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium hidden xl:table-cell">
                  PDVs
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium hidden xl:table-cell">
                  Último Login
                </th>
                <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium">
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
                users?.map((user: User) => (
                  <tr key={user.id} className="border-t hover:bg-muted/50">
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <div className="font-medium">{user.fullName || user.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{user.email}</div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden md:table-cell">{user.email}</td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.isAdmin
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                      >
                        {user.isAdmin && <Shield className="h-3 w-3" />}
                        <span className="hidden sm:inline">{user.isAdmin ? "Administrador" : "Usuário"}</span>
                        <span className="sm:hidden">{user.isAdmin ? "Admin" : "User"}</span>
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden lg:table-cell">
                      <span className="text-muted-foreground">
                        {user.isAdmin
                          ? "Todas"
                          : `${user.permissions?.length || 0} permissões`}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : user.status === "SUSPENDED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                        }`}
                      >
                        {user.status === "ACTIVE"
                          ? "Ativo"
                          : user.status === "SUSPENDED"
                          ? "Suspenso"
                          : "Inativo"}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden xl:table-cell">
                      {user.userPointsOfSale?.length || 0} PDV(s)
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-muted-foreground hidden xl:table-cell">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString("pt-BR", { dateStyle: 'short', timeStyle: 'short' })
                        : "Nunca"}
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Link href={`/dashboard/admin/users/${user.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 sm:px-3 hidden md:inline-flex"
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
                        {user.status !== "INACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hidden lg:inline-flex"
                            onClick={() => {
                              setDeleteUserId(user.id);
                              setDeleteUserName(user.fullName || user.email);
                            }}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Deletar</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de Criar Usuário */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Dialog de Deletar Usuário */}
      <DeleteUserDialog
        open={!!deleteUserId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteUserId(null);
            setDeleteUserName("");
          }
        }}
        onConfirm={() => {
          if (deleteUserId) {
            deleteUser.mutate(deleteUserId);
          }
        }}
        userName={deleteUserName}
        isPending={deleteUser.isPending}
      />
    </div>
  );
}
