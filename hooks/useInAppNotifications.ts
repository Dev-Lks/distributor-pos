import { useCallback, useEffect, useRef, useState } from "react"

export type NotificationType = "info" | "success" | "warning" | "error"

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  timestamp: Date
  read: boolean
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

interface UseInAppNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  addNotification: (
    title: string,
    message: string,
    type?: NotificationType,
    duration?: number
  ) => string
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  addNotificationWithAction: (
    title: string,
    message: string,
    action: { label: string; onClick: () => void },
    type?: NotificationType
  ) => string
}

const NOTIFICATION_STORAGE_KEY = "app_notifications"
const MAX_NOTIFICATIONS = 50

export function useInAppNotifications(): UseInAppNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notificationIdRef = useRef(0)

  // Carregar notificações do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setNotifications(
          parsed.map((n: Notification) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }))
        )
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error)
    }
  }, [])

  // Salvar notificações no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS))
      )
    } catch (error) {
      console.error("Erro ao salvar notificações:", error)
    }
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const generateId = useCallback(() => {
    return `notification_${Date.now()}_${++notificationIdRef.current}`
  }, [])

  const addNotification = useCallback(
    (
      title: string,
      message: string,
      type: NotificationType = "info",
      duration = 0
    ): string => {
      const id = generateId()
      const notification: Notification = {
        id,
        title,
        message,
        type,
        timestamp: new Date(),
        read: false,
      }

      setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS))

      // Auto-remove se duration > 0
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id)
        }, duration)
      }

      return id
    },
    [generateId]
  )

  const addNotificationWithAction = useCallback(
    (
      title: string,
      message: string,
      action: { label: string; onClick: () => void },
      type: NotificationType = "info"
    ): string => {
      const id = generateId()
      const notification: Notification = {
        id,
        title,
        message,
        type,
        action,
        timestamp: new Date(),
        read: false,
      }

      setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS))
      return id
    },
    [generateId]
  )

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotificationWithAction,
  }
}

// Hook para monitorar eventos específicos
export function useNotificationListener(
  addNotification: UseInAppNotificationsReturn["addNotification"]
) {
  useEffect(() => {
    // Simular notificações de estoque baixo
    const checkStockAlerts = () => {
      // Este é um exemplo - você pode conectar a eventos reais do servidor
      const hasStockAlert = Math.random() > 0.9

      if (hasStockAlert) {
        addNotification(
          "Alerta de Estoque",
          "Um ou mais produtos estão com estoque baixo",
          "warning",
          10000
        )
      }
    }

    const interval = setInterval(checkStockAlerts, 30000) // Verificar a cada 30s

    return () => clearInterval(interval)
  }, [addNotification])
}
