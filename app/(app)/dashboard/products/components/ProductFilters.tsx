"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, X } from "lucide-react"

interface ProductFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  selectedSize: string
  onSizeChange: (value: string) => void
  categories: string[]
  sizes: string[]
  onClearFilters: () => void
  showStockFilter?: boolean
  stockFilter?: string
  onStockFilterChange?: (value: string) => void
}

export function ProductFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSize,
  onSizeChange,
  categories,
  sizes,
  onClearFilters,
  showStockFilter = false,
  stockFilter = "all",
  onStockFilterChange,
}: ProductFiltersProps) {
  const hasActiveFilters =
    searchTerm !== "" || selectedCategory !== "all" || selectedSize !== "all" || stockFilter !== "all"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Filter className="h-4 w-4 md:h-5 md:w-5" />
          Filtros
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="ml-auto h-7 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Limpar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-xs md:text-sm">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nome, SKU, tags..."
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category-filter" className="text-xs md:text-sm">
              Categoria
            </Label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.slice(1).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="size-filter" className="text-xs md:text-sm">
              Tamanho
            </Label>
            <Select value={selectedSize} onValueChange={onSizeChange}>
              <SelectTrigger id="size-filter">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tamanhos</SelectItem>
                {sizes.slice(1).map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showStockFilter && onStockFilterChange && (
            <div className="space-y-2">
              <Label htmlFor="stock-filter" className="text-xs md:text-sm">
                Estoque
              </Label>
              <Select value={stockFilter} onValueChange={onStockFilterChange}>
                <SelectTrigger id="stock-filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="with-stock">Com estoque</SelectItem>
                  <SelectItem value="without-stock">Sem estoque</SelectItem>
                  <SelectItem value="low-stock">Estoque baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
