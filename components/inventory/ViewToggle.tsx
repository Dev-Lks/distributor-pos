"use client"

import { Button } from "@/components/ui/button"
import { LayoutGrid, List, Table } from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewType = "table" | "cards" | "grid"

interface ViewToggleProps {
  value: ViewType
  onChange: (value: ViewType) => void
  className?: string
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn("inline-flex rounded-lg border bg-muted p-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("table")}
        className={cn(
          "h-7 px-2",
          value === "table" && "bg-background shadow-sm"
        )}
      >
        <Table className="size-4" />
        <span className="sr-only">Tabela</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("cards")}
        className={cn(
          "h-7 px-2",
          value === "cards" && "bg-background shadow-sm"
        )}
      >
        <List className="size-4" />
        <span className="sr-only">Cards</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("grid")}
        className={cn(
          "h-7 px-2",
          value === "grid" && "bg-background shadow-sm"
        )}
      >
        <LayoutGrid className="size-4" />
        <span className="sr-only">Grade</span>
      </Button>
    </div>
  )
}
