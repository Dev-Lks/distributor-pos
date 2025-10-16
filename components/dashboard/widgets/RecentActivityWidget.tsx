"use client"

import { Activity, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRecentActivity } from "@/hooks/useRecentActivity"

export function RecentActivityWidget() {
  const { data: activities, isLoading, error, refetch } = useRecentActivity(10)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
            <p className="text-sm font-medium">Erro ao carregar atividades</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {error.message || 'Tente novamente mais tarde'}
            </p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Nenhuma atividade recente</p>
            <p className="text-xs text-muted-foreground mt-1">
              As atividades aparecerão aqui conforme acontecerem
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {activity.userAvatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.userName}</span>{" "}
                  <span className="text-muted-foreground">{activity.description}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
