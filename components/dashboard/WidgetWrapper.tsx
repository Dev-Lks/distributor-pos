"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface WidgetWrapperProps {
  title: string
  icon?: ReactNode
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onRefetch?: () => void
  isEmpty?: boolean
  emptyMessage?: string
  emptyIcon?: ReactNode
  emptyAction?: {
    label: string
    onClick: () => void
  }
  children: ReactNode
  headerActions?: ReactNode
  className?: string
}

export function WidgetWrapper({
  title,
  icon,
  isLoading = false,
  isError = false,
  error = null,
  onRefetch,
  isEmpty = false,
  emptyMessage = "Nenhum dado disponível",
  emptyIcon,
  emptyAction,
  children,
  headerActions,
  className,
}: WidgetWrapperProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </div>
            {headerActions && <Skeleton className="h-9 w-32" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
            <p className="text-sm font-medium mb-1">Erro ao carregar dados</p>
            <p className="text-xs text-muted-foreground mb-4">
              {error?.message || 'Tente novamente mais tarde'}
            </p>
            {onRefetch && (
              <Button size="sm" variant="outline" onClick={onRefetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </div>
            {headerActions}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {emptyIcon || <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-2xl">📊</span>
            </div>}
            <p className="text-sm font-medium text-muted-foreground mb-4">
              {emptyMessage}
            </p>
            {emptyAction && (
              <Button size="sm" variant="outline" onClick={emptyAction.onClick}>
                {emptyAction.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Normal state with content
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </div>
          {headerActions}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
