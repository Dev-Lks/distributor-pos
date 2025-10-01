"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdvancedFilterValues {
  category?: string[];
  supplier?: string[];
  priceRange?: [number, number];
  stockRange?: [number, number];
  location?: string[];
  tags?: string[];
  turnoverRate?: 'high' | 'medium' | 'low' | 'stagnant';
  profitMargin?: [number, number];
  sku?: string;
  brand?: string[];
  abcClass?: ('A' | 'B' | 'C')[];
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterValues;
  onChange: (filters: AdvancedFilterValues) => void;
  availableCategories?: string[];
  availableSuppliers?: string[];
  availableBrands?: string[];
  availableTags?: string[];
}

export function AdvancedFilters({
  filters,
  onChange,
  availableCategories = [],
  availableSuppliers = [],
  availableBrands = [],
  availableTags = [],
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<AdvancedFilterValues>(filters);

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  }).length;

  const handleApply = () => {
    onChange(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onChange(clearedFilters);
  };

  const toggleMultiSelect = (field: keyof AdvancedFilterValues, value: string) => {
    const current = (localFilters[field] as string[]) || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setLocalFilters({ ...localFilters, [field]: newValue });
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="mr-2 h-4 w-4" />
            Filtros Avançados
            {activeFilterCount > 0 && (
              <Badge
                variant="default"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] max-h-[600px] overflow-y-auto" align="start">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Filtros Avançados</h3>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Limpar Tudo
              </Button>
            </div>

            {/* Categoria */}
            {availableCategories.length > 0 && (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => (
                    <Badge
                      key={cat}
                      variant={localFilters.category?.includes(cat) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleMultiSelect('category', cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Fornecedor */}
            {availableSuppliers.length > 0 && (
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <div className="flex flex-wrap gap-2">
                  {availableSuppliers.map((supplier) => (
                    <Badge
                      key={supplier}
                      variant={localFilters.supplier?.includes(supplier) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleMultiSelect('supplier', supplier)}
                    >
                      {supplier}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Marca */}
            {availableBrands.length > 0 && (
              <div className="space-y-2">
                <Label>Marca</Label>
                <div className="flex flex-wrap gap-2">
                  {availableBrands.map((brand) => (
                    <Badge
                      key={brand}
                      variant={localFilters.brand?.includes(brand) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleMultiSelect('brand', brand)}
                    >
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Classificação ABC */}
            <div className="space-y-2">
              <Label>Classificação ABC</Label>
              <div className="flex gap-2">
                {['A', 'B', 'C'].map((cls) => (
                  <Badge
                    key={cls}
                    variant={localFilters.abcClass?.includes(cls as any) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMultiSelect('abcClass', cls)}
                  >
                    Classe {cls}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Faixa de Preço */}
            <div className="space-y-2">
              <Label>Faixa de Preço (R$)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={localFilters.priceRange?.[0] || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      priceRange: [
                        parseFloat(e.target.value) || 0,
                        localFilters.priceRange?.[1] || 1000,
                      ],
                    })
                  }
                  className="w-24"
                />
                <span>até</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  value={localFilters.priceRange?.[1] || ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      priceRange: [
                        localFilters.priceRange?.[0] || 0,
                        parseFloat(e.target.value) || 1000,
                      ],
                    })
                  }
                  className="w-24"
                />
              </div>
            </div>

            {/* Taxa de Giro */}
            <div className="space-y-2">
              <Label>Taxa de Giro</Label>
              <Select
                value={localFilters.turnoverRate}
                onValueChange={(value: any) =>
                  setLocalFilters({ ...localFilters, turnoverRate: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta (rápido)</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="stagnant">Estagnado (90+ dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                placeholder="Digite o SKU"
                value={localFilters.sku || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, sku: e.target.value })
                }
              />
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleApply} className="flex-1">
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            if (Array.isArray(value) && value.length === 0) return null;

            const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
            
            return (
              <Badge key={key} variant="secondary" className="gap-1">
                <span className="text-xs font-normal opacity-70">{key}:</span>
                <span className="text-xs">{displayValue}</span>
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    const newFilters = { ...filters };
                    delete newFilters[key as keyof AdvancedFilterValues];
                    onChange(newFilters);
                  }}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
