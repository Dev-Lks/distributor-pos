"use client";

import { useState } from "react";
import { useBatches, useCreateBatch } from "@/lib/useInventoryAdvanced";
import { useProducts } from "@/lib/useProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Package,
  Plus,
  QrCode,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const batchStatusConfig = {
  ACTIVE: {
    label: "Ativo",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-500/30",
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: "Vencido",
    color: "bg-red-500/10 text-red-700 border-red-200 dark:border-red-500/30",
    icon: XCircle,
  },
  DEPLETED: {
    label: "Esgotado",
    color: "bg-gray-500/10 text-gray-700 border-gray-200 dark:border-gray-500/30",
    icon: Package,
  },
};

export function BatchManagementTab() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBatchQR, setSelectedBatchQR] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: batches, isLoading: loadingBatches } = useBatches(
    statusFilter === "all" ? undefined : undefined // Hook só aceita productId, filtraremos localmente
  );
  const { data: products } = useProducts();
  const createBatch = useCreateBatch();

  // Estado do formulário
  const [formData, setFormData] = useState({
    productId: "",
    batchNumber: "",
    expirationDate: "",
    quantity: "",
    location: "coldRoom" as const,
    cost: "",
    notes: "",
  });

  const handleCreateBatch = async () => {
    try {
      if (!formData.productId || !formData.batchNumber || !formData.quantity) {
        toast.error("Preencha os campos obrigatórios");
        return;
      }

      await createBatch.mutateAsync({
        productId: formData.productId,
        batchNumber: formData.batchNumber,
        expirationDate: formData.expirationDate || undefined,
        quantity: Number.parseInt(formData.quantity, 10),
        location: formData.location,
        cost: formData.cost ? Number.parseFloat(formData.cost) : 0,
        notes: formData.notes || undefined,
      });

      toast.success("Lote criado com sucesso!");
      setShowCreateDialog(false);
      setFormData({
        productId: "",
        batchNumber: "",
        expirationDate: "",
        quantity: "",
        location: "coldRoom",
        cost: "",
        notes: "",
      });
    } catch (error) {
      toast.error("Erro ao criar lote");
    }
  };

  const handleDownloadQR = (qrCode: string, batchNumber: string) => {
    // Criar link de download para o QR code
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `qrcode-lote-${batchNumber}.png`;
    link.click();
  };

  const filteredBatches = batches?.filter((batch) => {
    // Filtro de status
    if (statusFilter !== "all" && batch.status !== statusFilter) {
      return false;
    }

    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const productName = products?.find((p) => p.id === batch.productId)?.name.toLowerCase() || "";
      return (
        batch.batchNumber.toLowerCase().includes(query) ||
        productName.includes(query)
      );
    }
    return true;
  });

  const summaryStats = {
    total: batches?.length || 0,
    active: batches?.filter((b) => b.status === "ACTIVE").length || 0,
    expired: batches?.filter((b) => b.status === "EXPIRED").length || 0,
    depleted: batches?.filter((b) => b.status === "DEPLETED").length || 0,
    expiringSoon: batches?.filter((b) => {
      if (!b.expirationDate || b.status !== "ACTIVE") return false;
      const daysUntilExpiration = Math.floor(
        (new Date(b.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiration <= 30;
    }).length || 0,
  };

  if (loadingBatches) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo de estatísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{summaryStats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 30d</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summaryStats.expiringSoon}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryStats.expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esgotados</CardTitle>
            <Package className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{summaryStats.depleted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e ações */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por lote ou produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ACTIVE">Ativos</SelectItem>
            <SelectItem value="EXPIRED">Vencidos</SelectItem>
            <SelectItem value="DEPLETED">Esgotados</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lote
        </Button>
      </div>

      {/* Tabela de lotes */}
      <Card>
        <CardHeader>
          <CardTitle>Lotes Registrados ({filteredBatches?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches?.map((batch) => {
                const product = products?.find((p) => p.id === batch.productId);
                const statusInfo = batchStatusConfig[batch.status as keyof typeof batchStatusConfig];
                const Icon = statusInfo.icon;

                let daysUntilExpiration: number | null = null;
                if (batch.expirationDate && batch.status === "ACTIVE") {
                  daysUntilExpiration = Math.floor(
                    (new Date(batch.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                }

                return (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="font-medium">{batch.batchNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(batch.receivedDate), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>{product?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {batch.location === "coldRoom" && "Câmara Fria"}
                        {batch.location === "house" && "Casa"}
                        {batch.location === "salePoint" && "Ponto de Venda"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-semibold">{batch.remainingQuantity}</div>
                      <div className="text-xs text-muted-foreground">
                        de {batch.quantity}
                      </div>
                    </TableCell>
                    <TableCell>
                      {batch.expirationDate ? (
                        <div>
                          <div className="font-medium">
                            {format(new Date(batch.expirationDate), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          {daysUntilExpiration !== null && (
                            <div
                              className={cn(
                                "text-xs",
                                daysUntilExpiration <= 7 && "text-red-600 font-semibold",
                                daysUntilExpiration > 7 && daysUntilExpiration <= 30 && "text-amber-600",
                                daysUntilExpiration > 30 && "text-muted-foreground"
                              )}
                            >
                              {daysUntilExpiration} dias
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        <Icon className="mr-1 h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => batch.qrCode && setSelectedBatchQR(batch.qrCode)}
                        disabled={!batch.qrCode}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de criação de lote */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Lote</DialogTitle>
            <DialogDescription>
              Registre um novo lote com QR Code automático para rastreamento
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Produto *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="batchNumber">Número do Lote *</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder="Ex: L2024-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expirationDate">Data de Validade</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Ex: 24"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Localização *</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value: any) => setFormData({ ...formData, location: value })}
                >
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
              <div className="grid gap-2">
                <Label htmlFor="cost">Custo Unitário</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="R$ 0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informações adicionais sobre o lote"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBatch} disabled={createBatch.isPending}>
              {createBatch.isPending ? "Criando..." : "Criar Lote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualização do QR Code */}
      <Dialog open={!!selectedBatchQR} onOpenChange={() => setSelectedBatchQR(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code do Lote</DialogTitle>
            <DialogDescription>
              Escaneie este código para rastrear o lote
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedBatchQR && (
              <>
                <img
                  src={selectedBatchQR}
                  alt="QR Code"
                  className="h-64 w-64 border rounded-lg"
                />
                <Button
                  onClick={() => {
                    const batch = batches?.find((b) => b.qrCode === selectedBatchQR);
                    if (batch) {
                      handleDownloadQR(selectedBatchQR, batch.batchNumber);
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar QR Code
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
