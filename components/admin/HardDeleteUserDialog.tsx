"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";

interface HardDeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  userEmail: string;
  isPending?: boolean;
  hasData?: {
    salesCreated: number;
    cashSessions: number;
    inventoryMovements: number;
    ordersCreated: number;
  };
}

export function HardDeleteUserDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  userEmail,
  isPending = false,
  hasData,
}: HardDeleteUserDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText.toUpperCase() === "DELETAR";

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText("");
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-6 w-6" />
            DELETAR PERMANENTEMENTE USUÁRIO
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
              <p className="font-bold text-red-900 text-base mb-2">
                ⚠️ ATENÇÃO: AÇÃO IRREVERSÍVEL!
              </p>
              <p className="text-red-800 text-sm">
                Você está prestes a deletar <strong>PERMANENTEMENTE</strong> o usuário:
              </p>
              <div className="mt-2 p-3 bg-red-100 rounded border border-red-300">
                <p className="font-semibold text-red-900">{userName}</p>
                <p className="text-sm text-red-700">{userEmail}</p>
              </div>
            </div>

            {hasData && (
              <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
                <p className="font-bold text-yellow-900 text-base mb-2">
                  ⚠️ USUÁRIO POSSUI DADOS ASSOCIADOS
                </p>
                <p className="text-yellow-800 text-sm mb-3">
                  Este usuário possui os seguintes dados no sistema:
                </p>
                <ul className="space-y-1 text-sm text-yellow-900">
                  {hasData.salesCreated > 0 && (
                    <li>• <strong>{hasData.salesCreated}</strong> vendas criadas</li>
                  )}
                  {hasData.cashSessions > 0 && (
                    <li>• <strong>{hasData.cashSessions}</strong> sessões de caixa</li>
                  )}
                  {hasData.inventoryMovements > 0 && (
                    <li>• <strong>{hasData.inventoryMovements}</strong> movimentações de estoque</li>
                  )}
                  {hasData.ordersCreated > 0 && (
                    <li>• <strong>{hasData.ordersCreated}</strong> pedidos criados</li>
                  )}
                </ul>
                <p className="mt-3 text-yellow-900 font-semibold text-sm">
                  ⚠️ A API bloqueará esta operação por segurança!
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Use a desativação (soft delete) ao invés disso.
                </p>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <p className="font-medium text-foreground">Esta ação irá:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">×</span>
                  <span>Apagar o usuário completamente do banco de dados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">×</span>
                  <span>Remover todas as permissões e vinculações</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">×</span>
                  <span>Não pode ser revertida - dados perdidos para sempre</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">×</span>
                  <span>Quebrar histórico se houver vendas/movimentações</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                <strong>💡 Recomendação:</strong> Use a desativação (soft delete) ao invés de deletar permanentemente. 
                Isso preserva o histórico e pode ser revertido.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-delete" className="text-base font-semibold">
                Para confirmar, digite <span className="text-red-600 font-mono">DELETAR</span> abaixo:
              </Label>
              <Input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite DELETAR para confirmar"
                className="border-2 border-red-300 focus:border-red-500"
                disabled={isPending}
                autoComplete="off"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (isConfirmed) {
                onConfirm();
              }
            }}
            disabled={isPending || !isConfirmed}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Deletando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar Permanentemente
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
