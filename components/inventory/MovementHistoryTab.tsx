"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Search,
  Filter,
  Calendar,
  Snowflake,
  Home,
  Store,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const movementTypeConfig = {
  RECEIPT: {
    label: "Recebimento",
    icon: Package,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  TRANSFER: {
    label: "Transferência",
    icon: ArrowRight,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  SALE: {
    label: "Venda",
    icon: ShoppingCart,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  ADJUSTMENT: {
    label: "Ajuste",
    icon: TrendingUp,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  LOSS: {
    label: "Perda",
    icon: AlertCircle,
    color: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200",
    badgeColor: "bg-red-100 text-red-700",
  },
  RETURN: {
    label: "Devolução",
    icon: RotateCcw,
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200",
    badgeColor: "bg-indigo-100 text-indigo-700",
  },
};

const locationConfig = {
  COLD_ROOM: {
    label: "Câmara Fria",
    icon: Snowflake,
    color: "text-sky-600",
  },
  HOUSE: {
    label: "Casa",
    icon: Home,
    color: "text-emerald-600",
  },
  SALE_POINT: {
    label: "Ponto de Venda",
    icon: Store,
    color: "text-amber-600",
  },
};

export function MovementHistoryTab() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["inventory-movements", filterType, filterLocation, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: "100",
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      if (filterType !== "all") {
        params.append("type", filterType);
      }

      if (filterLocation !== "all") {
        params.append("location", filterLocation);
      }

      const res = await fetch(`/api/inventory/movements?${params}`);
      if (!res.ok) throw new Error("Failed to fetch movements");
      return res.json();
    },
  });

  const filteredMovements = useMemo(() => {
    if (!data?.movements) return [];
    
    if (!searchQuery) return data.movements;

    const query = searchQuery.toLowerCase();
    return data.movements.filter((m: any) => 
      m.product.name.toLowerCase().includes(query) ||
      m.product.category?.toLowerCase().includes(query) ||
      m.notes?.toLowerCase().includes(query) ||
      m.performedBy?.toLowerCase().includes(query)
    );
  }, [data?.movements, searchQuery]);

  const handleExport = () => {
    if (!filteredMovements.length) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const csv = [
      ["Data", "Tipo", "Produto", "Quantidade", "De", "Para", "Usuário", "Notas"],
      ...filteredMovements.map((item: any) => [
        format(new Date(item.occurredAt), "dd/MM/yyyy HH:mm"),
        movementTypeConfig[item.type as keyof typeof movementTypeConfig].label,
        `${item.product.name} ${item.product.size}`,
        item.quantity,
        item.fromLocation ? locationConfig[item.fromLocation as keyof typeof locationConfig]?.label || item.fromLocation : "-",
        item.toLocation ? locationConfig[item.toLocation as keyof typeof locationConfig]?.label || item.toLocation : "-",
        item.performedBy || "-",
        item.notes || "-",
      ]),
    ];

    const csvContent = csv.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historico-movimentacoes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Histórico exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Movimentações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.totalMovements || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              +{data?.stats.totalQuantityIn || 0}
            </div>
            <p className="text-xs text-muted-foreground">unidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{data?.stats.totalQuantityOut || 0}
            </div>
            <p className="text-xs text-muted-foreground">unidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              (data?.stats.totalQuantityIn || 0) - (data?.stats.totalQuantityOut || 0) >= 0
                ? "text-emerald-600"
                : "text-red-600"
            )}>
              {((data?.stats.totalQuantityIn || 0) - (data?.stats.totalQuantityOut || 0)) > 0 ? "+" : ""}
              {(data?.stats.totalQuantityIn || 0) - (data?.stats.totalQuantityOut || 0)}
            </div>
            <p className="text-xs text-muted-foreground">unidades</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-5" />
            Filtros e Busca
          </CardTitle>
          <CardDescription>
            Filtre as movimentações por tipo, localização, data e busca por texto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de Movimentação</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {Object.entries(movementTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Localização */}
            <div className="space-y-2">
              <Label>Localização</Label>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Localizações</SelectItem>
                  {Object.entries(locationConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>

            {/* Busca */}
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Produto, usuário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 size-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Movimentações</span>
            <Badge variant="secondary">
              {filteredMovements.length} registro{filteredMovements.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredMovements.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement: any) => {
                    const config = movementTypeConfig[movement.type as keyof typeof movementTypeConfig];
                    const Icon = config.icon;
                    const fromConfig = movement.fromLocation ? locationConfig[movement.fromLocation as keyof typeof locationConfig] : null;
                    const toConfig = movement.toLocation ? locationConfig[movement.toLocation as keyof typeof locationConfig] : null;

                    return (
                      <TableRow key={movement.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(movement.occurredAt), "dd/MM/yyyy", { locale: ptBR })}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(movement.occurredAt), "HH:mm", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1", config.badgeColor)}>
                            <Icon className="size-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{movement.product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {movement.product.size}
                            {movement.product.category && ` • ${movement.product.category}`}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "font-semibold",
                              movement.quantity > 0 ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {movement.quantity > 0 ? "+" : ""}
                            {movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {fromConfig ? (
                            <div className="flex items-center gap-2">
                              <fromConfig.icon className={cn("size-4", fromConfig.color)} />
                              <span className="text-sm">{fromConfig.label}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {toConfig ? (
                            <div className="flex items-center gap-2">
                              <toConfig.icon className={cn("size-4", toConfig.color)} />
                              <span className="text-sm">{toConfig.label}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {movement.performedBy || <span className="text-muted-foreground">Sistema</span>}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {movement.notes || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="mb-4 size-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Nenhuma movimentação encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou o período selecionado
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
