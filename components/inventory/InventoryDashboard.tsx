"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryDashboardProps {
  data: {
    totalValue: number;
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringCount: number;
    averageTurnover: number;
    deadStock: number;
    inventoryAccuracy: number;
  };
  previousData?: {
    totalValue: number;
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

export function InventoryDashboard({ data, previousData }: InventoryDashboardProps) {
  const calculateChange = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      isNegative: change < 0,
    };
  };

  const valueChange = calculateChange(data.totalValue, previousData?.totalValue);
  const itemsChange = calculateChange(data.totalItems, previousData?.totalItems);

  const kpis = [
    {
      title: "Valor Total do Estoque",
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalValue),
      icon: DollarSign,
      change: valueChange,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Total de Items",
      value: data.totalItems.toLocaleString('pt-BR'),
      icon: Package,
      change: itemsChange,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Estoque Baixo",
      value: data.lowStockCount.toString(),
      icon: AlertTriangle,
      color: data.lowStockCount > 10 ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30" : "text-slate-600 bg-slate-50 dark:bg-slate-950/30",
      badge: data.lowStockCount > 10 ? "Atenção" : undefined,
    },
    {
      title: "Esgotados",
      value: data.outOfStockCount.toString(),
      icon: XCircle,
      color: data.outOfStockCount > 5 ? "text-red-600 bg-red-50 dark:bg-red-950/30" : "text-slate-600 bg-slate-50 dark:bg-slate-950/30",
      badge: data.outOfStockCount > 0 ? "Crítico" : undefined,
    },
    {
      title: "Próximos ao Vencimento",
      value: data.expiringCount.toString(),
      subtext: "Nos próximos 30 dias",
      icon: Clock,
      color: data.expiringCount > 0 ? "text-orange-600 bg-orange-50 dark:bg-orange-950/30" : "text-slate-600 bg-slate-50 dark:bg-slate-950/30",
    },
    {
      title: "Giro Médio",
      value: `${data.averageTurnover.toFixed(1)} dias`,
      subtext: "Tempo médio de estoque",
      icon: TrendingUp,
      color: data.averageTurnover < 30 ? "text-green-600 bg-green-50 dark:bg-green-950/30" : "text-slate-600 bg-slate-50 dark:bg-slate-950/30",
    },
    {
      title: "Estoque Parado",
      value: data.deadStock.toString(),
      subtext: "Sem movimentação 90+ dias",
      icon: TrendingDown,
      color: data.deadStock > 5 ? "text-purple-600 bg-purple-50 dark:bg-purple-950/30" : "text-slate-600 bg-slate-50 dark:bg-slate-950/30",
    },
    {
      title: "Precisão do Inventário",
      value: `${data.inventoryAccuracy.toFixed(1)}%`,
      subtext: "Última auditoria",
      icon: CheckCircle2,
      color: data.inventoryAccuracy >= 95 
        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" 
        : "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", kpi.color)}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  {kpi.subtext && (
                    <p className="text-xs text-muted-foreground mt-1">{kpi.subtext}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {kpi.badge && (
                    <Badge variant="outline" className="text-xs">
                      {kpi.badge}
                    </Badge>
                  )}
                  {kpi.change && (
                    <div
                      className={cn(
                        "flex items-center text-xs font-medium",
                        kpi.change.isPositive && "text-emerald-600",
                        kpi.change.isNegative && "text-red-600"
                      )}
                    >
                      {kpi.change.isPositive && <TrendingUp className="h-3 w-3 mr-1" />}
                      {kpi.change.isNegative && <TrendingDown className="h-3 w-3 mr-1" />}
                      {kpi.change.value}%
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
