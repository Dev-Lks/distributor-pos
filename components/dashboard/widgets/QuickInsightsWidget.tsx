"use client"

import { Lightbulb, TrendingUp, AlertTriangle, Users, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Insight {
  icon: any
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  type: "info" | "warning" | "success"
}

interface QuickInsightsWidgetProps {
  insights?: Insight[]
}

const typeColors = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

export function QuickInsightsWidget({ insights: initialInsights }: QuickInsightsWidgetProps) {
  // Mock data with AI-like insights
  const insights: Insight[] = initialInsights || [
    {
      icon: TrendingUp,
      title: "IPA está vendendo acima da média",
      description: "40% acima da média desta semana",
      type: "success",
      action: { label: "Ver detalhes", href: "/dashboard/products" },
    },
    {
      icon: AlertTriangle,
      title: "3 produtos próximos do vencimento",
      description: "Considere criar uma promoção",
      type: "warning",
      action: { label: "Ver produtos", href: "/dashboard/inventory" },
    },
    {
      icon: TrendingUp,
      title: "Sexta-feira é seu melhor dia",
      description: "Média de R$ 3.200 em vendas",
      type: "info",
    },
    {
      icon: Users,
      title: "5 clientes inativos há 30+ dias",
      description: "Envie uma campanha de reativação",
      type: "info",
      action: { label: "Ver clientes", href: "/dashboard/customers" },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg font-semibold">Insights Inteligentes</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon
            return (
              <div
                key={index}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", typeColors[insight.type])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">{insight.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
                    {insight.action && (
                      <Button variant="link" size="sm" className="mt-2 h-auto p-0 text-xs">
                        {insight.action.label}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
