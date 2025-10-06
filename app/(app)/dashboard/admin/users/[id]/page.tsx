"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { usePermissions } from "@/lib/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionsManager } from "@/components/PermissionsManager";
import { ResetPasswordDialog } from "@/components/admin/ResetPasswordDialog";
import { HardDeleteUserDialog } from "@/components/admin/HardDeleteUserDialog";
import { ArrowLeft, Save, Shield, User, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { PermissionKey } from "@prisma/client";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [status, setStatus] = useState("ACTIVE");
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Buscar dados do usuário
  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Falha ao buscar usuário");
      const data = await res.json();
      
      // Atualizar estados
      setFullName(data.fullName || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setCpf(data.cpf || "");
      setIsAdmin(data.isAdmin || false);
      setStatus(data.status || "ACTIVE");
      setSelectedPermissions(data.permissions?.map((p: any) => p.permission) || []);
      setUserData(data);
      
      return data;
    },
    enabled: !!userId,
  });

  // Mutation para atualizar usuário
  const updateUser = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao atualizar usuário");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });

  // Mutation para deletar permanentemente
  const hardDeleteUser = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${userId}/permanent`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao deletar usuário");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário deletado permanentemente!");
      router.push("/dashboard/admin/users");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateUser.mutate({
      fullName,
      phone,
      cpf,
      isAdmin,
      status,
      permissions: selectedPermissions,
    });
  };

  if (!can.manageUsers) {
    router.push("/unauthorized");
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/dashboard/admin/users">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Editar Usuário</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie as informações e permissões do usuário
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Informações Básicas */}
        <div className="border rounded-lg p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            <h2 className="text-lg sm:text-xl font-semibold">Informações Básicas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome Completo *</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="João Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">CPF</label>
              <Input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="SUSPENDED">Suspenso</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => {
                    setIsAdmin(e.target.checked);
                    if (e.target.checked) {
                      // Se tornar admin, limpar permissões individuais
                      setSelectedPermissions([]);
                    }
                  }}
                  className="h-4 w-4"
                />
                <Shield className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Administrador</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Administradores têm acesso total ao sistema
              </p>
            </div>
          </div>
        </div>

        {/* Permissões */}
        {!isAdmin && (
          <div className="border rounded-lg p-6">
            <PermissionsManager
              selectedPermissions={selectedPermissions}
              onChange={setSelectedPermissions}
              disabled={updateUser.isPending}
            />
          </div>
        )}

        {isAdmin && (
          <div className="border rounded-lg p-6 bg-red-50">
            <div className="flex items-center gap-2 text-red-800">
              <Shield className="h-5 w-5" />
              <p className="font-medium">
                Este usuário é um administrador e tem acesso completo a todas as funcionalidades do sistema.
              </p>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="space-y-4">
          {/* Ações principais */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResetPasswordDialog(true)}
              className="w-full sm:w-auto"
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Resetar Senha
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/dashboard/admin/users" className="flex-1 sm:flex-none">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={updateUser.isPending}
                className="w-full sm:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateUser.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>

          {/* Zona de perigo */}
          <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-400">Zona de Perigo</h3>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Deletar permanentemente apaga todos os dados do usuário do sistema. Esta ação não pode ser desfeita.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowHardDeleteDialog(true)}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto sm:shrink-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Deletar Permanentemente</span>
                <span className="sm:hidden">Deletar</span>
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Dialog de Reset de Senha */}
      <ResetPasswordDialog
        open={showResetPasswordDialog}
        onOpenChange={setShowResetPasswordDialog}
        userId={userId}
        userName={fullName || email}
      />

      {/* Dialog de Hard Delete */}
      <HardDeleteUserDialog
        open={showHardDeleteDialog}
        onOpenChange={setShowHardDeleteDialog}
        onConfirm={() => hardDeleteUser.mutate()}
        userName={fullName || email}
        userEmail={email}
        isPending={hardDeleteUser.isPending}
        hasData={userData?._count ? {
          salesCreated: userData._count.salesCreated || 0,
          cashSessions: userData._count.cashSessions || 0,
          inventoryMovements: userData._count.inventoryMovements || 0,
          ordersCreated: userData._count.ordersCreated || 0,
        } : undefined}
      />
    </div>
  );
}
