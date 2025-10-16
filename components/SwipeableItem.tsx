"use client"

import { ReactNode } from "react"
import { useSwipeGesture } from "@/hooks/useSwipeGesture"
import { Trash2, Edit, Archive, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SwipeAction {
  icon: ReactNode
  label: string
  color: "destructive" | "primary" | "secondary" | "warning"
  onClick: () => void
}

export interface SwipeableItemProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: SwipeAction
  rightAction?: SwipeAction
  className?: string
  disabled?: boolean
}

const actionColors = {
  destructive: "bg-destructive text-destructive-foreground",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  warning: "bg-yellow-500 text-white",
}

export function SwipeableItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
  disabled = false,
}: SwipeableItemProps) {
  const { isSwiping, swipeDirection, swipeProgress, ref } = useSwipeGesture({
    onSwipeLeft: onSwipeLeft || leftAction?.onClick,
    onSwipeRight: onSwipeRight || rightAction?.onClick,
    threshold: 80,
    enabled: !disabled,
  })

  const translateX = isSwiping
    ? swipeDirection === "right"
      ? swipeProgress * 80
      : -swipeProgress * 80
    : 0

  const showLeftAction = isSwiping && swipeDirection === "right" && leftAction
  const showRightAction = isSwiping && swipeDirection === "left" && rightAction

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      {showLeftAction && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-4 transition-opacity",
            actionColors[leftAction.color]
          )}
          style={{
            width: `${swipeProgress * 100}px`,
            opacity: swipeProgress,
          }}
        >
          <div className="flex items-center gap-2">
            {leftAction.icon}
            {swipeProgress > 0.5 && (
              <span className="text-sm font-medium">{leftAction.label}</span>
            )}
          </div>
        </div>
      )}

      {showRightAction && (
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-opacity",
            actionColors[rightAction.color]
          )}
          style={{
            width: `${swipeProgress * 100}px`,
            opacity: swipeProgress,
          }}
        >
          <div className="flex items-center gap-2">
            {swipeProgress > 0.5 && (
              <span className="text-sm font-medium">{rightAction.label}</span>
            )}
            {rightAction.icon}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={ref as any}
        className={cn(
          "relative bg-background transition-transform",
          isSwiping && "cursor-grabbing",
          !isSwiping && "cursor-grab",
          className
        )}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Preset de actions comuns
export const swipeActions = {
  delete: (onClick: () => void): SwipeAction => ({
    icon: <Trash2 className="h-5 w-5" />,
    label: "Deletar",
    color: "destructive",
    onClick,
  }),
  edit: (onClick: () => void): SwipeAction => ({
    icon: <Edit className="h-5 w-5" />,
    label: "Editar",
    color: "primary",
    onClick,
  }),
  archive: (onClick: () => void): SwipeAction => ({
    icon: <Archive className="h-5 w-5" />,
    label: "Arquivar",
    color: "secondary",
    onClick,
  }),
  more: (onClick: () => void): SwipeAction => ({
    icon: <MoreHorizontal className="h-5 w-5" />,
    label: "Mais",
    color: "secondary",
    onClick,
  }),
}
