"use client"

import { Button } from "@/components/ui/button"
import { BarChart3, Package, History, Activity } from "lucide-react"

interface ActionDockProps {
  currentView: string
  onViewChange: (view: string) => void
}

export function ActionDock({ currentView, onViewChange }: ActionDockProps) {
  const actions = [
    { id: "overview", label: "Painel", icon: Activity },
    { id: "sales", label: "Vendas", icon: BarChart3, primary: true },
    { id: "inventory", label: "Estoque", icon: Package },
    { id: "history", label: "Histórico", icon: History },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="border-t border-border/50 bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-around p-3">
          {actions.map((action) => {
            const Icon = action.icon
            const isActive = currentView === action.id
            const isPrimary = action.primary

            return (
              <Button
                key={action.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(action.id)}
                className={`
                  flex flex-col gap-1 h-auto py-3 px-4 relative transition-all duration-200
                  ${
                    isActive
                      ? isPrimary
                        ? "pos-action-button shadow-lg"
                        : "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-secondary/50"
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-xs font-medium">{action.label}</span>

                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
                )}
              </Button>
            )
          })}
        </div>

        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-1 bg-primary/30 rounded-full" />
        </div>
      </div>
    </div>
  )
}
