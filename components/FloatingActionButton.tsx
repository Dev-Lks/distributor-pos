"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, ShoppingCart, Package, Receipt, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/usePermissions"

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  color: string
  permission?: keyof ReturnType<typeof usePermissions>["can"]
}

export function FloatingActionButton() {
  const router = useRouter()
  const { can } = usePermissions()
  const [isOpen, setIsOpen] = useState(false)

  const actions: QuickAction[] = [
    {
      icon: ShoppingCart,
      label: "Nova Venda",
      href: "/dashboard/sales",
      color: "bg-green-500 hover:bg-green-600",
      permission: "createSales",
    },
    {
      icon: Sparkles,
      label: "Novo Produto",
      href: "/dashboard/products?create=true",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      icon: Package,
      label: "Entrada Estoque",
      href: "/dashboard/inventory?action=add",
      color: "bg-amber-500 hover:bg-amber-600",
      permission: "manageInventory",
    },
    {
      icon: Receipt,
      label: "Nova Encomenda",
      href: "/dashboard/orders/new",
      color: "bg-purple-500 hover:bg-purple-600",
      permission: "createOrders",
    },
  ]

  // Filtrar ações baseado em permissões
  const availableActions = actions.filter(
    action => !action.permission || can[action.permission]
  )

  const toggleMenu = () => setIsOpen(!isOpen)

  const handleAction = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  // Não mostrar em desktop ou se não houver ações disponíveis
  if (availableActions.length === 0) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-24 right-4 z-[70] md:hidden">
        {/* Quick Actions Menu */}
        <div
          className={cn(
            "absolute bottom-16 right-0 mb-2 flex flex-col gap-3 transition-all duration-300",
            isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {availableActions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={action.href}
                onClick={() => handleAction(action.href)}
                className={cn(
                  "flex items-center gap-3 rounded-full shadow-lg transition-all",
                  "h-12 pr-4 pl-3",
                  action.color,
                  "text-white font-medium text-sm",
                  "hover:scale-105 active:scale-95"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="whitespace-nowrap">{action.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main FAB Button */}
        <Button
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-all duration-200",
            "bg-primary hover:bg-primary/90",
            "hover:scale-110 active:scale-90",
            isOpen && "rotate-45"
          )}
          onClick={toggleMenu}
          aria-label={isOpen ? "Fechar menu de ações" : "Abrir menu de ações"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>

        {/* Pulse animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary opacity-20" />
        )}
      </div>
    </>
  )
}
