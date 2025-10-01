"use client";

import { useABCAnalysis } from "@/lib/useInventoryAdvanced";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const abcClassConfig = {
  A: {
    label: "Classe A",
    description: "Alta prioridade - Nunca faltar",
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200",
    icon: CheckCircle2,
    advice: "Monitorar de perto, manter estoque sempre disponível, priorizar reposição.",
  },
  B: {
    label: "Classe B",
    description: "Média prioridade - Estoque moderado",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200",
    icon: Info,
    advice: "Manter estoque adequado, revisar periodicamente a demanda.",
  },
  C: {
    label: "Classe C",
    description: "Baixa prioridade - Estoque mínimo",
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200",
    icon: AlertCircle,
    advice: "Estoque mínimo, considerar descontinuar produtos sem movimentação.",
  },
};

export function ABCAnalysisTab() {
  const { data, isLoading } = useABCAnalysis();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">Análise não disponível</h3>
        <p className="text-sm text-muted-foreground">
          Não há dados suficientes para gerar a análise ABC.
        </p>
      </div>
    );
  }

  const { analysis, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['A', 'B', 'C'] as const).map((cls) => {
          const config = abcClassConfig[cls];
          const classData = summary[`class${cls}` as keyof typeof summary] as {
            count: number;
            percentage: number;
            revenue: number;
            revenuePercentage: number;
          };
          const Icon = config.icon;

          return (
            <Card key={cls} className={cn("border-2", config.color)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {config.label}
                  </CardTitle>
                  <Badge variant="outline" className={config.color}>
                    {classData.count} produtos
                  </Badge>
                </div>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">% da Receita</span>
                    <span className="font-semibold">
                      {classData.revenuePercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={classData.revenuePercentage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Receita Total</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(classData.revenue)}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">{config.advice}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráfico de Pareto (Simplificado) */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Receita (Gráfico de Pareto)</CardTitle>
          <CardDescription>
            Visualização da curva ABC - {summary.totalProducts} produtos analisados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.slice(0, 20).map((item: any) => {
              const config = abcClassConfig[item.abcClass as keyof typeof abcClassConfig];
              return (
                <div key={item.productId} className="flex items-center gap-2">
                  <div className="w-8 text-sm text-muted-foreground">#{item.rank}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">
                          {item.name} {item.size}
                        </span>
                        <Badge variant="outline" className={cn("text-xs", config.color)}>
                          {item.abcClass}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-nowrap ml-2">
                        {item.revenueContribution.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={item.cumulativePercentage} className="h-1.5" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.cumulativePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada por Produto</CardTitle>
          <CardDescription>
            Todos os produtos classificados por contribuição de receita
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead className="text-right">Receita Total</TableHead>
                  <TableHead className="text-right">% Receita</TableHead>
                  <TableHead className="text-right">% Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.map((item: any) => {
                  const config = abcClassConfig[item.abcClass as keyof typeof abcClassConfig];
                  return (
                    <TableRow key={item.productId}>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.rank}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.name} {item.size}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={config.color}>
                          {item.abcClass}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.revenueContribution.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.cumulativePercentage.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
