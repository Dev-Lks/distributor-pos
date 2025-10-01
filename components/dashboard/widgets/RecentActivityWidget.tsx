"use client"

import { Activity, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ActivityItem {
  icon: any
  text: string
  timestamp: Date
  user: {
    name: string
    initials: string
  }
}

interface RecentActivityWidgetProps {
  activities?: ActivityItem[]
}

export function RecentActivityWidget({ activities: initialActivities }: RecentActivityWidgetProps) {
  // Mock data
  const activities: ActivityItem[] = initialActivities || [
    {
      icon: Activity,
      text: "adicionou 24 unidades de American Lager",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
      user: { name: "João Silva", initials: "JS" },
    },
    {
      icon: Activity,
      text: "finalizou venda de R$ 156,00",
      timestamp: new Date(Date.now() - 1000 * 60 * 12), // 12 min ago
      user: { name: "Maria Santos", initials: "MS" },
    },
    {
      icon: Activity,
      text: "confirmou encomenda #ENC-123",
      timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 min ago
      user: { name: "Pedro Costa", initials: "PC" },
    },
    {
      icon: Activity,
      text: "atualizou preço de IPA Artesanal",
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
      user: { name: "João Silva", initials: "JS" },
    },
    {
      icon: Activity,
      text: "transferiu estoque entre locais",
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1h ago
      user: { name: "Maria Santos", initials: "MS" },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon
            return (
              <div key={index} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {activity.user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{" "}
                    <span className="text-muted-foreground">{activity.text}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
