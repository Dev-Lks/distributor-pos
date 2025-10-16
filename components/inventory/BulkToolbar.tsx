"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  DollarSign,
  ArrowLeftRight,
  Power,
  PowerOff,
  Trash2,
  Tags,
  X,
} from "lucide-react";
import { useBulkOperation } from "@/hooks/useInventoryAdvanced";
import { cn } from "@/lib/utils";

interface BulkToolbarProps {
  selectedIds: string[];
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  className?: string;
}

export function BulkToolbar({
  selectedIds,
  totalCount,
  onClearSelection,
  onSelectAll,
  className,
}: BulkToolbarProps) {
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const bulkOperation = useBulkOperation();

  const handleAdjustPrice = async (percentage: number, operation: 'increase' | 'decrease') => {
    try {
      await bulkOperation.mutateAsync({
        productIds: selectedIds,
        operation: 'adjust_price',
        params: { percentage, operation },
      });
      toast.success(`Preços ${operation === 'increase' ? 'aumentados' : 'diminuídos'} em ${percentage}%`);
      setShowPriceDialog(false);
      onClearSelection();
    } catch (error) {
      toast.error('Erro ao ajustar preços');
    }
  };

  const handleTransfer = async (from: string, to: string, quantity: number) => {
    try {
      await bulkOperation.mutateAsync({
        productIds: selectedIds,
        operation: 'transfer',
        params: { from, to, quantity },
      });
      toast.success('Transferência realizada com sucesso');
      setShowTransferDialog(false);
      onClearSelection();
    } catch (error) {
      toast.error('Erro ao realizar transferência');
    }
  };

  const handleActivateDeactivate = async (activate: boolean) => {
    try {
      await bulkOperation.mutateAsync({
        productIds: selectedIds,
        operation: activate ? 'activate' : 'deactivate',
        params: {},
      });
      toast.success(`${selectedIds.length} produtos ${activate ? 'ativados' : 'desativados'}`);
      onClearSelection();
    } catch (error) {
      toast.error(`Erro ao ${activate ? 'ativar' : 'desativar'} produtos`);
    }
  };

  const handleDelete = async () => {
    try {
      await bulkOperation.mutateAsync({
        productIds: selectedIds,
        operation: 'delete',
        params: {},
      });
      toast.success(`${selectedIds.length} produtos removidos`);
      setShowDeleteDialog(false);
      onClearSelection();
    } catch (error) {
      toast.error('Erro ao remover produtos');
    }
  };

  const handleAddTags = async (tags: string[]) => {
    try {
      await bulkOperation.mutateAsync({
        productIds: selectedIds,
        operation: 'add_tags',
        params: { tags },
      });
      toast.success(`Tags adicionadas a ${selectedIds.length} produtos`);
      setShowTagsDialog(false);
      onClearSelection();
    } catch (error) {
      toast.error('Erro ao adicionar tags');
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "bg-primary text-primary-foreground rounded-lg shadow-xl",
          "p-4 flex items-center gap-4",
          "animate-in slide-in-from-bottom-5",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Checkbox checked={selectedIds.length === totalCount} onCheckedChange={onSelectAll} />
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
            {selectedIds.length} {selectedIds.length === 1 ? 'produto selecionado' : 'produtos selecionados'}
          </Badge>
        </div>

        <div className="h-8 w-px bg-primary-foreground/20" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowPriceDialog(true)}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Ajustar Preços
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowTransferDialog(true)}
          >
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            Transferir
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleActivateDeactivate(true)}
          >
            <Power className="h-4 w-4 mr-1" />
            Ativar
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleActivateDeactivate(false)}
          >
            <PowerOff className="h-4 w-4 mr-1" />
            Desativar
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowTagsDialog(true)}
          >
            <Tags className="h-4 w-4 mr-1" />
            Tags
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Deletar
          </Button>
        </div>

        <div className="h-8 w-px bg-primary-foreground/20" />

        <Button
          size="sm"
          variant="ghost"
          className="text-primary-foreground hover:bg-primary-foreground/20"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>

      {/* Price Adjustment Dialog */}
      <PriceAdjustmentDialog
        open={showPriceDialog}
        onOpenChange={setShowPriceDialog}
        onConfirm={handleAdjustPrice}
      />

      {/* Transfer Dialog */}
      <TransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        onConfirm={handleTransfer}
      />

      {/* Tags Dialog */}
      <TagsDialog
        open={showTagsDialog}
        onOpenChange={setShowTagsDialog}
        onConfirm={handleAddTags}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a deletar {selectedIds.length} {selectedIds.length === 1 ? 'produto' : 'produtos'}.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Price Adjustment Dialog Component
function PriceAdjustmentDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (percentage: number, operation: 'increase' | 'decrease') => void;
}) {
  const [percentage, setPercentage] = useState<number>(10);
  const [operation, setOperation] = useState<'increase' | 'decrease'>('increase');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Preços em Massa</DialogTitle>
          <DialogDescription>
            Escolha a porcentagem e se deseja aumentar ou diminuir os preços
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Porcentagem</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Operação</Label>
            <Select value={operation} onValueChange={(v: any) => setOperation(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">Aumentar (+)</SelectItem>
                <SelectItem value="decrease">Diminuir (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(percentage, operation)}>
            Aplicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Transfer Dialog Component
function TransferDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (from: string, to: string, quantity: number) => void;
}) {
  const [from, setFrom] = useState<string>('coldRoom');
  const [to, setTo] = useState<string>('salePoint');
  const [quantity, setQuantity] = useState<number>(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir em Massa</DialogTitle>
          <DialogDescription>
            Mover produtos entre localizações
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>De</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coldRoom">Câmara Fria</SelectItem>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="salePoint">Ponto de Venda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Para</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coldRoom">Câmara Fria</SelectItem>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="salePoint">Ponto de Venda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(from, to, quantity)}>
            Transferir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Tags Dialog Component
function TagsDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tags: string[]) => void;
}) {
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Tags</DialogTitle>
          <DialogDescription>
            Adicione tags aos produtos selecionados
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button onClick={handleAddTag}>Adicionar</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(tags)} disabled={tags.length === 0}>
            Adicionar Tags
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
