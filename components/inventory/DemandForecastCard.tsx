"use client";

import { useDemandForecast } from "@/lib/useInventoryAdvanced";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCart,
  Package,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const urgencyConfig = {
  critical: {
    label: "Crítico",
    description: "≤ 3 dias",
    color: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200",
    icon: AlertTriangle,
  },
  high: {
    label: "Alto",
    description: "4-7 dias",
    color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200",
    icon: AlertTriangle,
  },
  medium: {
    label: "Médio",
    description: "8-14 dias",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200",
    icon: Package,
  },
  low: {
    label: "Baixo",
    description: "> 14 dias",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200",
    icon: Package,
  },
};

const trendConfig = {
  up: {
    label: "Em alta",
    icon: TrendingUp,
    color: "text-emerald-600",
  },
  down: {
    label: "Em baixa",
    icon: TrendingDown,
    color: "text-red-600",
  },
  stable: {
    label: "Estável",
    icon: Minus,
    color: "text-slate-600",
  },
};

export function DemandForecastCard() {
  const { data, isLoading } = useDemandForecast();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || data.forecasts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Sem previsões disponíveis</h3>
          <p className="text-sm text-muted-foreground text-center">
            Não há dados de vendas suficientes para gerar previsões de demanda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { forecasts, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Com movimentação</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
            <p className="text-xs text-muted-foreground mt-1">Esgotar em ≤3 dias</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.high}</div>
            <p className="text-xs text-muted-foreground mt-1">Esgotar em 4-7 dias</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-600">
              Precisam Reposição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary.needsReorder}</div>
            <p className="text-xs text-muted-foreground mt-1">Abaixo do ponto de reposição</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos que Precisam Atenção */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos que Precisam Atenção</CardTitle>
          <CardDescription>
            Ordenados por urgência - produtos que podem esgotar em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {forecasts.slice(0, 20).map((forecast: any) => {
              const urgency = urgencyConfig[forecast.urgency as keyof typeof urgencyConfig];
              const trend = trendConfig[forecast.seasonalTrend as keyof typeof trendConfig];
              const UrgencyIcon = urgency.icon;
              const TrendIcon = trend.icon;

              const stockPercentage = forecast.currentStock > 0 
                ? Math.min((forecast.currentStock / forecast.suggestedOrderQuantity) * 100, 100)
                : 0;

              return (
                <div
                  key={forecast.productId}
                  className={cn(
                    "flex items-start gap-4 p-4 border-2 rounded-lg transition-colors hover:bg-muted/50",
                    urgency.color
                  )}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">
                            {forecast.productName} {forecast.size}
                          </h4>
                          <Badge variant="outline" className={urgency.color}>
                            {urgency.label}
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", trend.color)}>
                            <TrendIcon className="h-3 w-3 mr-1" />
                            {trend.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Estoque: <strong className="text-foreground">{forecast.currentStock}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Consumo diário: <strong className="text-foreground">{forecast.averageDailyConsumption}</strong>
                          </span>
                          <span>•</span>
                          <span className={forecast.daysUntilStockout <= 7 ? "text-red-600 font-semibold" : ""}>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {forecast.daysUntilStockout} dias
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Confiança</div>
                        <div className="text-lg font-bold">{forecast.confidence}%</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Nível de estoque</span>
                        <span>{stockPercentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={stockPercentage} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Sugestão: Pedir </span>
                        <strong className="text-foreground">{forecast.suggestedOrderQuantity}</strong>
                        <span className="text-muted-foreground"> unidades quando atingir </span>
                        <strong className="text-foreground">{forecast.suggestedReorderPoint}</strong>
                      </div>
                      {forecast.needsReorder && (
                        <Button size="sm" variant="default">
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Gerar Pedido
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {forecasts.length > 20 && (
            <div className="mt-4 text-center">
              <Button variant="outline">
                Ver todos os {forecasts.length} produtos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
