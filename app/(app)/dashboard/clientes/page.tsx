"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { 
  Plus, Edit, Trash2, Loader2, Users, Search,
  TrendingUp, ShoppingBag, DollarSign, Phone,
  Mail, MapPin, FileText, X, Eye
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
  type CustomerSummary,
} from "@/hooks/useCustomers"
import { formatPhone, formatDate, formatDocumentDisplay, formatCurrency } from "@/lib/utils/formatters"
import { sanitizeDocument, formatDocument as baseFormatDocument } from "@/lib/documents"

type CustomerFormState = {
  name: string
  document: string
  phone: string
  email: string
  address: string
}

const emptyCustomerForm: CustomerFormState = {
  name: "",
  document: "",
  phone: "",
  email: "",
  address: "",
}

export default function ClientesPage() {
  const queryClient = useQueryClient()

  // Pull to refresh
  const { isPulling, isRefreshing, progress, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(emptyCustomerForm)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [customerBeingEdited, setCustomerBeingEdited] = useState<CustomerSummary | null>(null)
  const [customerPendingDeletion, setCustomerPendingDeletion] = useState<CustomerSummary | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null)

  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    isFetching: isFetchingCustomers,
  } = useCustomers()

  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const filteredCustomers = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()
    const digitTerm = sanitizeDocument(searchTerm)
    if (!normalizedTerm) return customers

    return customers.filter((customer) => {
      const name = customer.name.toLowerCase()
      const phone = (customer.phone ?? "").toLowerCase()
      const email = (customer.email ?? "").toLowerCase()
      const address = (customer.address ?? "").toLowerCase()
      const document = customer.document ?? ""
      const formattedDocument = formatDocumentDisplay(document).toLowerCase()

      if (
        name.includes(normalizedTerm) ||
        phone.includes(normalizedTerm) ||
        email.includes(normalizedTerm) ||
        address.includes(normalizedTerm) ||
        formattedDocument.includes(normalizedTerm)
      ) {
        return true
      }

      if (!digitTerm) return false

      const documentDigits = sanitizeDocument(document) ?? ""
      const phoneDigits = sanitizeDocument(customer.phone) ?? ""
      return documentDigits.includes(digitTerm) || phoneDigits.includes(digitTerm)
    })
  }, [customers, searchTerm])

  // Stats
  const totalCustomers = customers.length
  const totalRevenue = customers.reduce((acc, c) => acc + (c.totalSpend || 0), 0)
  const averageTicket = totalRevenue / (customers.reduce((acc, c) => acc + (c.totalOrders || 0), 0) || 1)

  const resetCustomerForm = () => {
    setCustomerForm(emptyCustomerForm)
    setCustomerBeingEdited(null)
  }

  const handleOpenCreateCustomer = () => {
    resetCustomerForm()
    setIsCustomerDialogOpen(true)
  }

  const handleOpenEditCustomer = (customer: CustomerSummary) => {
    setCustomerBeingEdited(customer)
    setCustomerForm({
      name: customer.name,
      document: baseFormatDocument(customer.document) ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
    })
    setIsCustomerDialogOpen(true)
  }

  const handleSubmitCustomer = async () => {
    if (!customerForm.name.trim()) {
      toast.error("Informe o nome do cliente.")
      return
    }

    try {
      if (customerBeingEdited) {
        await updateCustomer.mutateAsync({
          id: customerBeingEdited.id,
          name: customerForm.name.trim(),
          document: customerForm.document.trim() || null,
          phone: customerForm.phone.trim() || null,
          email: customerForm.email.trim() || null,
          address: customerForm.address.trim() || null,
        })
        toast.success("Cliente atualizado com sucesso.")
      } else {
        await createCustomer.mutateAsync({
          name: customerForm.name.trim(),
          document: customerForm.document.trim() || null,
          phone: customerForm.phone.trim() || null,
          email: customerForm.email.trim() || null,
          address: customerForm.address.trim() || null,
        })
        toast.success("Cliente cadastrado.")
      }
      setIsCustomerDialogOpen(false)
      resetCustomerForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o cliente."
      toast.error(message)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!customerPendingDeletion) return
    try {
      await deleteCustomer.mutateAsync(customerPendingDeletion.id)
      toast.success("Cliente removido.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível remover o cliente."
      toast.error(message)
    } finally {
      setCustomerPendingDeletion(null)
    }
  }

  const isSavingCustomer = createCustomer.isPending || updateCustomer.isPending

  return (
    <>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        progress={progress}
        pullDistance={pullDistance}
      />
      <div className="space-y-6 p-4 pb-20 md:p-6">
        {/* Header with Stats */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus clientes e acompanhe o histórico de compras
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Em vendas totais</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
                <p className="text-xs text-muted-foreground">Por transação</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <CardTitle>Lista de Clientes</CardTitle>
                <CardDescription>
                  Busque e gerencie informações dos seus clientes
                </CardDescription>
              </div>
              <Button onClick={handleOpenCreateCustomer} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, documento, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Customer List */}
            {isLoadingCustomers || isFetchingCustomers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4 rounded-lg border p-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-3 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  {searchTerm
                    ? "Tente buscar com outros termos"
                    : "Comece cadastrando seu primeiro cliente"}
                </p>
                {!searchTerm && (
                  <Button onClick={handleOpenCreateCustomer}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Primeiro Cliente
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{customer.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {formatDocumentDisplay(customer.document)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{formatPhone(customer.phone)}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground truncate">{customer.email}</span>
                          </div>
                        )}
                      </div>

                      <Separator className="my-3" />

                      <div className="grid grid-cols-2 gap-2 text-center mb-3">
                        <div>
                          <div className="text-sm font-semibold">{customer.totalOrders || 0}</div>
                          <div className="text-xs text-muted-foreground">Compras</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{formatCurrency(customer.totalSpend || 0)}</div>
                          <div className="text-xs text-muted-foreground">Total Gasto</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Ver Mais
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditCustomer(customer)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCustomerPendingDeletion(customer)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Form Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={(open) => {
        setIsCustomerDialogOpen(open)
        if (!open) resetCustomerForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{customerBeingEdited ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              {customerBeingEdited
                ? "Atualize as informações do cliente"
                : "Preencha os dados para cadastrar um novo cliente"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nome Completo *</Label>
              <Input
                id="customer-name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-document">CPF/CNPJ</Label>
                <Input
                  id="customer-document"
                  value={customerForm.document}
                  onChange={(e) => setCustomerForm((prev) => ({ ...prev, document: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Telefone</Label>
                <Input
                  id="customer-phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Endereço</Label>
              <Input
                id="customer-address"
                value={customerForm.address}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, bairro"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)} disabled={isSavingCustomer}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitCustomer} disabled={isSavingCustomer}>
              {isSavingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {customerBeingEdited ? "Salvar Alterações" : "Cadastrar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={customerPendingDeletion !== null} onOpenChange={(open) => {
        if (!open) setCustomerPendingDeletion(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{customerPendingDeletion?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90">
              Excluir Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Customer Details Sheet */}
      <Sheet open={selectedCustomer !== null} onOpenChange={(open) => {
        if (!open) setSelectedCustomer(null)
      }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {selectedCustomer.name}
                </SheetTitle>
                <SheetDescription>
                  Informações detalhadas do cliente
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 py-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Informações de Contato</h3>
                  <div className="space-y-2">
                    {selectedCustomer.document && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDocumentDisplay(selectedCustomer.document)}</span>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatPhone(selectedCustomer.phone)}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{selectedCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Purchase Stats */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Estatísticas de Compras</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{selectedCustomer.totalOrders || 0}</div>
                        <div className="text-xs text-muted-foreground">Total de Compras</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold">{formatCurrency(selectedCustomer.totalSpend || 0)}</div>
                        <div className="text-xs text-muted-foreground">Total Gasto</div>
                      </CardContent>
                    </Card>
                  </div>
                  {selectedCustomer.averageTicket && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Ticket Médio</span>
                      <span className="text-sm font-bold">{formatCurrency(selectedCustomer.averageTicket)}</span>
                    </div>
                  )}
                  {selectedCustomer.lastPurchaseAt && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Última Compra</span>
                      <span className="text-sm">{formatDate(selectedCustomer.lastPurchaseAt)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleOpenEditCustomer(selectedCustomer)
                      setSelectedCustomer(null)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Cliente
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setCustomerPendingDeletion(selectedCustomer)
                      setSelectedCustomer(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
