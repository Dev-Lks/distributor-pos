"use client"

import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

export function POSQuickActions() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Zap className="mr-2 h-4 w-4" />
        Ações Rápidas
      </Button>
    </div>
  )
}
