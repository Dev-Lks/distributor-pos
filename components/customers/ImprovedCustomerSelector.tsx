"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchCustomers, useRecentCustomers, type CustomerSummary } from "@/lib/useCustomers"
import { useDebounce } from "@/lib/useDebounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, User, UserPlus, X, Phone, MapPin, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreateCustomerModal } from "./CreateCustomerModal"

interface ImprovedCustomerSelectorProps {
  value?: string | null
  onSelect: (customer: CustomerSummary | null) => void
  allowCreate?: boolean
  showRecent?: boolean
  placeholder?: string
  label?: string
  className?: string
}

export function ImprovedCustomerSelector({
  value,
  onSelect,
  allowCreate = true,
  showRecent = true,
  placeholder = "Buscar por nome, telefone ou CPF/CNPJ",
  label = "Cliente",
  className,
}: ImprovedCustomerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Buscar clientes com a query
  const { data: searchResults = [], isLoading: isSearching } = useSearchCustomers(debouncedSearch)
  
  // Buscar clientes recentes quando não há busca
  const { data: recentCustomers = [], isLoading: isLoadingRecent } = useRecentCustomers(10)

  // Determinar quais clientes mostrar
  const customersToShow = useMemo(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      return searchResults
    }
    return showRecent ? recentCustomers : []
  }, [debouncedSearch, searchResults, recentCustomers, showRecent])

  const isLoading = isSearching || isLoadingRecent

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Handler para selecionar cliente
  const handleSelectCustomer = (customer: CustomerSummary) => {
    setSelectedCustomer(customer)
    onSelect(customer)
    setIsOpen(false)
    setSearchQuery("")
  }

  // Handler para limpar seleção
  const handleClear = () => {
    setSelectedCustomer(null)
    onSelect(null)
    setSearchQuery("")
  }

  // Handler para criar novo cliente
  const handleCreateNew = () => {
    setIsCreateModalOpen(true)
    setIsOpen(false)
  }

  // Handler para sucesso na criação de cliente
  const handleCreateSuccess = (customer: CustomerSummary) => {
    setSelectedCustomer(customer)
    onSelect(customer)
    setSearchQuery("")
  }

  return (
    <>
      <div ref={containerRef} className={cn("space-y-2", className)}>
        {label && <Label>{label}</Label>}
        
        {/* Cliente Selecionado */}
        {selectedCustomer && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedCustomer.name}</span>
                  </div>
                  
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                  
                  {selectedCustomer.document && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>{selectedCustomer.document}</span>
                    </div>
                  )}
                  
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{selectedCustomer.address}</span>
                    </div>
                  )}

                  {selectedCustomer.bonificationsCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCustomer.bonificationsCount} bonificações
                    </Badge>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campo de Busca */}
        {!selectedCustomer && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (!isOpen) setIsOpen(true)
                }}
                onFocus={() => setIsOpen(true)}
                className="pl-10"
              />
            </div>

            {/* Dropdown de Resultados */}
            {isOpen && (
              <Card className="absolute z-50 w-full mt-2 shadow-lg">
                <CardContent className="p-2">
                  <ScrollArea className="max-h-[300px]">
                    {isLoading && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Buscando clientes...
                      </div>
                    )}

                    {!isLoading && customersToShow.length === 0 && (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {debouncedSearch && debouncedSearch.length >= 2
                            ? "Nenhum cliente encontrado"
                            : showRecent
                            ? "Nenhum cliente recente"
                            : "Digite para buscar clientes"}
                        </p>
                        {allowCreate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCreateNew}
                            className="w-full"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Criar novo cliente
                          </Button>
                        )}
                      </div>
                    )}

                    {!isLoading && customersToShow.length > 0 && (
                      <div className="space-y-1">
                        {!debouncedSearch && showRecent && (
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            Clientes Recentes
                          </div>
                        )}
                        
                        {customersToShow.map((customer: CustomerSummary) => (
                          <button
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="font-medium text-sm">{customer.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {customer.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {customer.phone}
                                  </span>
                                )}
                                {customer.document && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {customer.document}
                                  </span>
                                )}
                              </div>
                              
                              {customer.address && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="line-clamp-1">{customer.address}</span>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}

                        {allowCreate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCreateNew}
                            className="w-full mt-2"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Criar novo cliente
                          </Button>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modal de Criação de Cliente */}
      <CreateCustomerModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}
