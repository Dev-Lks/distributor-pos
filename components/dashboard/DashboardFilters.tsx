"use client"

import { useMemo, useState } from "react"
import { SlidersHorizontal, ChevronDown, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DashboardFiltersProps {
  searchTerm: string
  paymentFilter: string
  dateFilter: string
  onSearchChange: (value: string) => void
  onPaymentChange: (value: string) => void
  onDateChange: (value: string) => void
  onClear?: () => void
}

const paymentOptions = [
  { value: "all", label: "Todos" },
  { value: "cash", label: "Dinheiro" },
  { value: "card", label: "Cartão" },
  { value: "pix", label: "PIX" },
  { value: "other", label: "Outros" }
] as const

function FilterFields({
  searchTerm,
  paymentFilter,
  dateFilter,
  onSearchChange,
  onPaymentChange,
  onDateChange,
  onClear
}: DashboardFiltersProps) {
  const hasFilters = useMemo(
    () => searchTerm.trim() !== "" || paymentFilter !== "all" || dateFilter !== "",
    [searchTerm, paymentFilter, dateFilter]
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label htmlFor="dashboard-search" className="text-sm font-medium">
            Buscar
          </Label>
          <Input
            id="dashboard-search"
            placeholder="Cliente, produto ou ponto de venda"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="dashboard-payment" className="text-sm font-medium">
            Pagamento
          </Label>
          <Select value={paymentFilter} onValueChange={onPaymentChange}>
            <SelectTrigger id="dashboard-payment" className="mt-1">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent align="start">
              {paymentOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dashboard-date" className="text-sm font-medium">
            Data
          </Label>
          <Input
            id="dashboard-date"
            type="date"
            value={dateFilter}
            onChange={(event) => onDateChange(event.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      {hasFilters && onClear && (
        <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2" onClick={onClear}>
          <X className="h-4 w-4" />
          Limpar filtros
        </Button>
      )}
    </div>
  )
}

export function DashboardFilters(props: DashboardFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="space-y-3">
      <div className="md:hidden">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span className="flex items-center gap-2 text-sm">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros rápidos
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", mobileOpen && "rotate-180")} />
        </Button>
        {mobileOpen && (
          <Card className="mt-2">
            <CardContent className="pt-4">
              <FilterFields {...props} />
            </CardContent>
          </Card>
        )}
      </div>
      <Card className="hidden md:block">
        <CardContent className="pt-6">
          <FilterFields {...props} />
        </CardContent>
      </Card>
    </div>
  )
}
