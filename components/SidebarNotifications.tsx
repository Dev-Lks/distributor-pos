"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Notification, NotificationType } from "@/hooks/useInAppNotifications"

interface SidebarNotificationsProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onRemove: (id: string) => void
  onClearAll: () => void
  isCollapsed?: boolean
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-600" />
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case "info":
    default:
      return <Info className="h-4 w-4 text-blue-600" />
  }
}

function getNotificationBgColor(type: NotificationType) {
  switch (type) {
    case "success":
      return "bg-green-500/10"
    case "warning":
      return "bg-amber-500/10"
    case "error":
      return "bg-red-500/10"
    case "info":
    default:
      return "bg-blue-500/10"
  }
}

function formatTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Agora"
  if (diffMins < 60) return `${diffMins}min atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays < 7) return `${diffDays}d atrás`
  
  return new Date(date).toLocaleDateString("pt-BR")
}

export function SidebarNotifications({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove,
  onClearAll,
  isCollapsed = false,
}: SidebarNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Fechar popover quando clicar fora
  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
    }
  }, [isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex items-center justify-center rounded-lg transition-colors hover:bg-muted/60",
            isCollapsed ? "h-8 w-8" : "h-8 w-8"
          )}
          title={isCollapsed ? "Notificações" : undefined}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          
          {/* Badge com número de notificações não lidas */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0" side="left">
        <div className="flex flex-col max-h-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h3 className="font-semibold">Notificações</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {unreadCount} {unreadCount === 1 ? "nova" : "novas"}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={onMarkAllAsRead}
                  title="Marcar tudo como lido"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={onClearAll}
                  title="Limpar todas"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-colors hover:bg-muted/50",
                      !notification.read && "bg-muted/30"
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          "mt-1 flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                          getNotificationBgColor(notification.type)
                        )}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            "text-sm font-medium truncate",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>

                        {/* Action Button */}
                        {notification.action && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 text-xs"
                            onClick={() => {
                              notification.action?.onClick()
                              onMarkAsRead(notification.id)
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1 shrink-0">
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => onMarkAsRead(notification.id)}
                            title="Marcar como lido"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:text-destructive"
                          onClick={() => onRemove(notification.id)}
                          title="Remover"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
