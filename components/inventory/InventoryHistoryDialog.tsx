"use client";

import { useState } from "react";
import { useInventoryHistory } from "@/lib/useInventoryAdvanced";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  Package,
  ShoppingCart,
  AlertCircle,
  RotateCcw,
  TrendingUp,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface InventoryHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

const movementTypeConfig = {
  RECEIPT: {
    label: "Recebimento",
    icon: Package,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
  },
  TRANSFER: {
    label: "Transferência",
    icon: ArrowRight,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  },
  SALE: {
    label: "Venda",
    icon: ShoppingCart,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
  },
  ADJUSTMENT: {
    label: "Ajuste",
    icon: TrendingUp,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  },
  LOSS: {
    label: "Perda",
    icon: AlertCircle,
    color: "text-red-600 bg-red-50 dark:bg-red-950/30",
  },
  RETURN: {
    label: "Devolução",
    icon: RotateCcw,
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30",
  },
};

const locationLabels: Record<string, string> = {
  COLD_ROOM: "Câmara Fria",
  HOUSE: "Casa",
  SALE_POINT: "Ponto de Venda",
  SUPPLIER: "Fornecedor",
  TRANSIT: "Em Trânsito",
  EVENT: "Evento",
};

export function InventoryHistoryDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: InventoryHistoryDialogProps) {
  const { data: history, isLoading } = useInventoryHistory(productId);
  const [filterType, setFilterType] = useState<string | null>(null);

  const filteredHistory = filterType
    ? history?.filter((h: any) => h.type === filterType)
    : history;

  const handleExport = () => {
    // Export to CSV logic
    const csv = [
      ['Data', 'Tipo', 'Quantidade', 'De', 'Para', 'Usuário', 'Notas'],
      ...(filteredHistory || []).map((item: any) => [
        format(new Date(item.occurredAt), 'dd/MM/yyyy HH:mm'),
        movementTypeConfig[item.type as keyof typeof movementTypeConfig].label,
        item.quantity,
        item.fromLocation ? locationLabels[item.fromLocation] : '-',
        item.toLocation ? locationLabels[item.toLocation] : '-',
        item.performedBy || '-',
        item.notes || '-',
      ]),
    ];

    const csvContent = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-${productName.replace(/\s+/g, '-')}.csv`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Histórico de Movimentações</DialogTitle>
          <DialogDescription>
            Todas as movimentações de <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filterType === null ? "default" : "outline"}
            onClick={() => setFilterType(null)}
          >
            Todos
          </Button>
          {Object.entries(movementTypeConfig).map(([type, config]) => (
            <Button
              key={type}
              size="sm"
              variant={filterType === type ? "default" : "outline"}
              onClick={() => setFilterType(type)}
            >
              {config.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={handleExport} className="ml-auto">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredHistory && filteredHistory.length > 0 ? (
            <div className="space-y-4">
              {filteredHistory.map((item: any) => {
                const config = movementTypeConfig[item.type as keyof typeof movementTypeConfig];
                const Icon = config.icon;

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn("p-2 rounded-lg", config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{config.label}</Badge>
                          <span
                            className={cn(
                              "font-semibold",
                              item.quantity > 0 ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {item.quantity > 0 ? '+' : ''}{item.quantity}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(item.occurredAt), "dd 'de' MMMM 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>

                      {(item.fromLocation || item.toLocation) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {item.fromLocation && (
                            <span>{locationLabels[item.fromLocation]}</span>
                          )}
                          {item.fromLocation && item.toLocation && (
                            <ArrowRight className="h-4 w-4" />
                          )}
                          {item.toLocation && <span>{locationLabels[item.toLocation]}</span>}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      )}

                      {item.performedBy && (
                        <p className="text-xs text-muted-foreground">
                          Por: {item.performedBy}
                        </p>
                      )}

                      {item.unitCost && (
                        <p className="text-xs text-muted-foreground">
                          Custo unitário:{' '}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.unitCost)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Nenhuma movimentação encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Não há histórico de movimentações {filterType ? `do tipo ${movementTypeConfig[filterType as keyof typeof movementTypeConfig].label.toLowerCase()}` : ''} para este produto.
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
