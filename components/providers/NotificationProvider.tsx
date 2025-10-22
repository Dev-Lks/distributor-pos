"use client"

import React, { createContext, useContext, ReactNode } from "react"
import { useInAppNotifications, type NotificationType } from "@/hooks/useInAppNotifications"

interface NotificationContextType {
  addNotification: (
    title: string,
    message: string,
    type?: NotificationType,
    duration?: number
  ) => string
  addNotificationWithAction: (
    title: string,
    message: string,
    action: { label: string; onClick: () => void },
    type?: NotificationType
  ) => string
  removeNotification: (id: string) => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const {
    addNotification,
    addNotificationWithAction,
    removeNotification,
    unreadCount,
  } = useInAppNotifications()

  const value: NotificationContextType = {
    addNotification,
    addNotificationWithAction,
    removeNotification,
    unreadCount,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    )
  }
  return context
}
