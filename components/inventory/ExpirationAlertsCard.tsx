"use client";

import { useExpirationAlerts } from "@/lib/useInventoryAdvanced";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, Tag, Calendar } from "lucide-react";
import { format, formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const urgencyConfig = {
  critical: {
    label: "Crítico",
    description: "< 7 dias",
    color: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-500/30",
    icon: AlertTriangle,
  },
  warning: {
    label: "Atenção",
    description: "7-30 dias",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-500/30",
    icon: Clock,
  },
  info: {
    label: "Informativo",
    description: "30-60 dias",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-500/30",
    icon: Calendar,
  },
};

const locationLabels: Record<string, string> = {
  COLD_ROOM: "Câmara Fria",
  HOUSE: "Casa",
  SALE_POINT: "Ponto de Venda",
};

export function ExpirationAlertsCard() {
  const { data, isLoading } = useExpirationAlerts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-emerald-600 mb-4" />
          <h3 className="font-semibold text-lg mb-2 text-emerald-600">
            ✓ Tudo certo!
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Não há produtos próximos ao vencimento nos próximos 60 dias.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { alerts, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalQuantity} unidades
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">Vencem em {'<'} 7 dias</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary.warning}</div>
            <p className="text-xs text-muted-foreground mt-1">Vencem em 7-30 dias</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-600">
              Perda Potencial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(summary.potentialLoss)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Valor em risco</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {alerts.map((alert: any) => {
          const config = urgencyConfig[alert.urgency as keyof typeof urgencyConfig];
          const Icon = config.icon;
          const expirationDate = new Date(alert.expiresAt);

          return (
            <Card key={alert.batchId} className={cn("border-2", config.color)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-5 w-5" />
                      <CardTitle className="text-lg">
                        {alert.productName} {alert.size}
                      </CardTitle>
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 flex-wrap">
                      <span>Lote: {alert.batchNumber}</span>
                      <span>•</span>
                      <span>{locationLabels[alert.location]}</span>
                      <span>•</span>
                      <span>{alert.quantity} unidades</span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-2xl font-bold", config.color.split(' ')[0])}>
                      {alert.daysUntilExpiration}
                    </div>
                    <div className="text-xs text-muted-foreground">dias restantes</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data de vencimento:</span>
                  <span className="font-semibold">
                    {format(expirationDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Perda estimada:</span>
                  <span className="font-semibold text-red-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(alert.estimatedLoss)}
                  </span>
                </div>

                {alert.suggestedDiscount > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-600">
                          Sugestão de Promoção
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                        -{alert.suggestedDiscount}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className="text-muted-foreground line-through">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(alert.originalPrice)}
                        </div>
                        <div className="text-lg font-bold text-emerald-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(alert.suggestedPrice)}
                        </div>
                      </div>
                      <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                        <Tag className="h-4 w-4 mr-1" />
                        Aplicar Desconto
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
