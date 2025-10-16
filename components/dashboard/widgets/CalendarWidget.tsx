"use client"

import { Calendar as CalendarIcon, Clock, Package, Truck, FileText, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents"
import { format, isToday, isTomorrow } from "date-fns"
import { ptBR } from "date-fns/locale"

const eventIcons = {
  order_deadline: Package,
  expiration: AlertTriangle,
  audit: FileText,
  delivery: Truck,
}

const priorityColors = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
}

export function CalendarWidget() {
  const { data: events, isLoading, error, refetch } = useUpcomingEvents(7)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg font-semibold">Próximos Eventos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
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
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg font-semibold">Próximos Eventos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
            <p className="text-sm font-medium">Erro ao carregar eventos</p>
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

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg font-semibold">Próximos Eventos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Nenhum evento próximo</p>
            <p className="text-xs text-muted-foreground mt-1">
              Você está em dia com suas tarefas
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-lg font-semibold">Próximos Eventos</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => {
            const Icon = eventIcons[event.type as keyof typeof eventIcons] || CalendarIcon
            const eventDate = new Date(event.date)
            
            let dateLabel = format(eventDate, "dd/MM", { locale: ptBR })
            if (isToday(eventDate)) {
              dateLabel = "Hoje"
            } else if (isTomorrow(eventDate)) {
              dateLabel = "Amanhã"
            }

            return (
              <div
                key={event.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                  priorityColors[event.priority as keyof typeof priorityColors]
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.priority === 'high' && (
                      <Badge variant="secondary" className="h-5 bg-red-500/20 text-xs">
                        Urgente
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{dateLabel}</span>
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
