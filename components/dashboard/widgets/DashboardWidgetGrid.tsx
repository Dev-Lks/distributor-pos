"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

/**
 * DashboardWidgetGrid - Sistema de Grid Customizável para Widgets
 * 
 * NOTA: Este componente está preparado para futuras melhorias com drag & drop.
 * Para implementar drag & drop no futuro, instale:
 * - pnpm add react-grid-layout @types/react-grid-layout
 * - pnpm add react-resizable @types/react-resizable
 * 
 * Por enquanto, usa um grid CSS simples e responsivo.
 */

export interface Widget {
  id: string
  type: string
  title: string
  component: React.ComponentType<any>
  defaultProps?: any
  size?: {
    w: number // width (1-12)
    h: number // height units
  }
}

interface DashboardWidgetGridProps {
  widgets: Widget[]
  editable?: boolean
}

export function DashboardWidgetGrid({
  widgets,
  editable = false,
}: DashboardWidgetGridProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeLayout, setActiveLayout] = useState<string>("default")
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set())

  const saveLayout = () => {
    // Save hidden widgets to localStorage
    localStorage.setItem(
      `dashboard-hidden-${activeLayout}`,
      JSON.stringify(Array.from(hiddenWidgets))
    )
    setIsEditMode(false)
  }

  const loadLayout = (layoutName: string) => {
    const saved = localStorage.getItem(`dashboard-hidden-${layoutName}`)
    if (saved) {
      setHiddenWidgets(new Set(JSON.parse(saved)))
    } else {
      setHiddenWidgets(new Set())
    }
    setActiveLayout(layoutName)
  }

  const toggleWidget = (widgetId: string) => {
    setHiddenWidgets((prev) => {
      const next = new Set(prev)
      if (next.has(widgetId)) {
        next.delete(widgetId)
      } else {
        next.add(widgetId)
      }
      return next
    })
  }

  const visibleWidgets = widgets.filter(w => !hiddenWidgets.has(w.id))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Widgets</h2>
          {isEditMode && (
            <span className="text-xs text-muted-foreground">
              Clique nos widgets para mostrar/ocultar
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editable && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Layout: {activeLayout}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Layouts Salvos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => loadLayout("default")}>
                    Padrão
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => loadLayout("sales_focus")}>
                    Foco em Vendas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => loadLayout("inventory_focus")}>
                    Foco em Estoque
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => loadLayout("manager_view")}>
                    Visão Gerencial
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isEditMode ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditMode(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={saveLayout}>
                    Salvar Layout
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Personalizar
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Widget Selection in Edit Mode */}
      {isEditMode && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="mb-2 text-sm font-medium">Widgets Disponíveis:</p>
          <div className="flex flex-wrap gap-2">
            {widgets.map((widget) => (
              <Button
                key={widget.id}
                size="sm"
                variant={hiddenWidgets.has(widget.id) ? "outline" : "default"}
                onClick={() => toggleWidget(widget.id)}
              >
                {widget.title}
                {!hiddenWidgets.has(widget.id) && " ✓"}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Responsive Grid - CSS Grid sem dependências externas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleWidgets.map((widget) => {
          const Component = widget.component
          const colSpan = widget.size?.w && widget.size.w > 6 ? "md:col-span-2" : ""
          
          return (
            <div
              key={widget.id}
              className={cn(
                "rounded-lg border bg-card transition-all",
                isEditMode && "ring-2 ring-amber-500/50",
                colSpan
              )}
            >
              <div className="flex h-full flex-col">
                {isEditMode && (
                  <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
                    <span className="text-sm font-medium">{widget.title}</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => toggleWidget(widget.id)}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex-1 overflow-auto">
                  <Component {...(widget.defaultProps || {})} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
