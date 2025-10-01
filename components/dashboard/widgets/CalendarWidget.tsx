"use client"

import { Calendar as CalendarIcon, Clock, Package, Truck, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type EventType = "order_deadline" | "audit" | "delivery" | "meeting"

interface CalendarEvent {
  date: Date
  type: EventType
  title: string
  urgent: boolean
}

interface CalendarWidgetProps {
  events?: CalendarEvent[]
}

const eventConfig: Record<EventType, { icon: any; color: string }> = {
  order_deadline: {
    icon: Package,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  audit: {
    icon: CalendarIcon,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  delivery: {
    icon: Truck,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  meeting: {
    icon: Users,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
}

export function CalendarWidget({ events: initialEvents }: CalendarWidgetProps) {
  // Mock data - próximos 7 dias
  const events: CalendarEvent[] = initialEvents || [
    {
      date: new Date("2025-10-01"),
      type: "order_deadline",
      title: "Encomenda #ENC-003 - Pedro Costa",
      urgent: true,
    },
    {
      date: new Date("2025-10-02"),
      type: "delivery",
      title: "Entrega de insumos - Fornecedor Lúpulo",
      urgent: false,
    },
    {
      date: new Date("2025-10-03"),
      type: "audit",
      title: "Auditoria de Estoque - Câmara Fria",
      urgent: false,
    },
    {
      date: new Date("2025-10-05"),
      type: "order_deadline",
      title: "Encomenda #ENC-001 - João Silva",
      urgent: true,
    },
    {
      date: new Date("2025-10-07"),
      type: "meeting",
      title: "Reunião mensal - Equipe",
      urgent: false,
    },
  ]

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Hoje"
    if (date.toDateString() === tomorrow.toDateString()) return "Amanhã"

    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Próximos Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event, index) => {
            const config = eventConfig[event.type]
            const Icon = config.icon

            return (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                  event.urgent && "border-amber-500/50 bg-amber-500/5"
                )}
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", config.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.urgent && (
                      <Badge variant="destructive" className="h-5 text-xs">
                        Urgente
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(event.date)}</span>
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
