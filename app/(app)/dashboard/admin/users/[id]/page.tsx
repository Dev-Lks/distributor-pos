"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { usePermissions } from "@/lib/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionsManager } from "@/components/PermissionsManager";
import { ArrowLeft, Save, Shield, User } from "lucide-react";
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
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Usuário</h1>
          <p className="text-muted-foreground">
            Gerencie as informações e permissões do usuário
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Informações Básicas</h2>
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
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/admin/users">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={updateUser.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateUser.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
