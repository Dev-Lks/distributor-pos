"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionsManager } from "@/components/PermissionsManager";
import { Shield, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { PermissionKey } from "@prisma/client";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [selectedPointsOfSale, setSelectedPointsOfSale] = useState<string[]>([]);

  // Buscar pontos de venda disponíveis
  const { data: pointsOfSale } = useQuery({
    queryKey: ["pointsOfSale"],
    queryFn: async () => {
      const res = await fetch("/api/points-of-sale");
      if (!res.ok) throw new Error("Falha ao buscar pontos de venda");
      return res.json();
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao criar usuário");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário criado com sucesso!");
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!fullName.trim()) {
      toast.error("Nome completo é obrigatório");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Email válido é obrigatório");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (selectedPointsOfSale.length === 0) {
      toast.error("Selecione pelo menos um ponto de venda");
      return;
    }

    createUser.mutate({
      fullName,
      email,
      password,
      phone: phone || undefined,
      cpf: cpf || undefined,
      isAdmin,
      pointsOfSaleIds: selectedPointsOfSale,
      permissions: isAdmin ? [] : selectedPermissions,
    });
  };

  const handleClose = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhone("");
    setCpf("");
    setIsAdmin(false);
    setSelectedPermissions([]);
    setSelectedPointsOfSale([]);
    onOpenChange(false);
  };

  const togglePointOfSale = (posId: string) => {
    setSelectedPointsOfSale((prev) =>
      prev.includes(posId)
        ? prev.filter((id) => id !== posId)
        : [...prev, posId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Criar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do novo usuário e defina suas permissões
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Informações Básicas</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Nome Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="João Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@nitrobeer.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Senha <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Senha <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pontos de Venda */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">
              Pontos de Venda <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Selecione os pontos de venda que este usuário terá acesso
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {pointsOfSale?.map((pos: any) => (
                <label
                  key={pos.id}
                  className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedPointsOfSale.includes(pos.id)}
                    onChange={() => togglePointOfSale(pos.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">{pos.name}</span>
                </label>
              ))}
            </div>
            {selectedPointsOfSale.length === 0 && (
              <p className="text-sm text-red-500">
                Selecione pelo menos um ponto de venda
              </p>
            )}
          </div>

          {/* Tipo de Usuário */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Tipo de Usuário</h3>
            <div className="border rounded-lg p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => {
                    setIsAdmin(e.target.checked);
                    if (e.target.checked) {
                      setSelectedPermissions([]);
                    }
                  }}
                  className="h-4 w-4"
                />
                <Shield className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Administrador</span>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Administradores têm acesso total ao sistema
              </p>
            </div>
          </div>

          {/* Permissões (apenas se não for admin) */}
          {!isAdmin && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Permissões</h3>
              <PermissionsManager
                selectedPermissions={selectedPermissions}
                onChange={setSelectedPermissions}
                disabled={createUser.isPending}
              />
            </div>
          )}

          {isAdmin && (
            <div className="border rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 text-red-800">
                <Shield className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Este usuário será um administrador e terá acesso completo a
                  todas as funcionalidades do sistema.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createUser.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              <UserPlus className="mr-2 h-4 w-4" />
              {createUser.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
