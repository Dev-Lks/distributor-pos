"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { 
  Plus, Edit, Trash2, Loader2, Gift, Search, 
  Building2, User, X, DollarSign, Calendar,
  Filter, Package
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  useCreateCustomerBonification,
  useCustomerBonifications,
  useDeleteCustomerBonification,
  useUpdateCustomerBonification,
  type CustomerBonificationEntry,
} from "@/hooks/useCustomerBonifications"
import { useCustomers } from "@/hooks/useCustomers"
import { formatDate, formatCurrency } from "@/lib/utils/formatters"

type RecipientType = "CUSTOMER" | "COMPANY"
type BonificationCategory = "BONIFICATION" | "DEGUSTATION" | "FREE_SAMPLE" | "PROMOTIONAL_GIFT" | "COURTESY"

const CATEGORY_OPTIONS: { value: BonificationCategory; label: string; description: string }[] = [
  { value: "BONIFICATION", label: "Bonificação", description: "Brinde ou benefício concedido" },
  { value: "DEGUSTATION", label: "Degustação", description: "Amostra para teste" },
  { value: "FREE_SAMPLE", label: "Amostra Grátis", description: "Produto gratuito para divulgação" },
  { value: "PROMOTIONAL_GIFT", label: "Brinde Promocional", description: "Presente em campanha" },
  { value: "COURTESY", label: "Cortesia", description: "Presente de cortesia" },
]

type BonificationItem = {
  id: string
  description: string
  quantity: number
  unitValue: number
}

type BonificationFormState = {
  recipientType: RecipientType
  customerId: string
  companyName: string
  givenBy: string
  reason: string
  observation: string
  category: BonificationCategory
  bonifiedAt: string
  items: BonificationItem[]
}

const emptyBonificationForm = (): BonificationFormState => ({
  recipientType: "CUSTOMER",
  customerId: "",
  companyName: "",
  givenBy: "",
  reason: "",
  observation: "",
  category: "BONIFICATION",
  bonifiedAt: new Date().toISOString().slice(0, 10),
  items: [],
})

export default function BonificacoesPage() {
  const queryClient = useQueryClient()

  // Pull to refresh
  const { isPulling, isRefreshing, progress, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customer-bonifications"] })
    },
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [recipientFilter, setRecipientFilter] = useState<string>("all")
  const [bonificationForm, setBonificationForm] = useState<BonificationFormState>(emptyBonificationForm())
  const [isBonificationDialogOpen, setIsBonificationDialogOpen] = useState(false)
  const [bonificationBeingEdited, setBonificationBeingEdited] = useState<CustomerBonificationEntry | null>(null)
  const [bonificationPendingDeletion, setBonificationPendingDeletion] = useState<CustomerBonificationEntry | null>(null)

  const { data: customers = [] } = useCustomers()
  const {
    data: bonifications = [],
    isLoading: isLoadingBonifications,
    isFetching: isFetchingBonifications,
  } = useCustomerBonifications()

  const createBonification = useCreateCustomerBonification()
  const updateBonification = useUpdateCustomerBonification()
  const deleteBonification = useDeleteCustomerBonification()

  const filteredBonifications = useMemo(() => {
    let filtered = bonifications

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((b) => b.category === categoryFilter)
    }

    // Filter by recipient type
    if (recipientFilter !== "all") {
      filtered = filtered.filter((b) => 
        recipientFilter === "CUSTOMER" ? b.customerId !== null : b.customerId === null
      )
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((b) =>
        b.customer?.name.toLowerCase().includes(term) ||
        b.companyName?.toLowerCase().includes(term) ||
        b.givenBy.toLowerCase().includes(term) ||
        b.reason?.toLowerCase().includes(term) ||
        b.observation?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [bonifications, categoryFilter, recipientFilter, searchTerm])

  // Stats
  const totalBonifications = bonifications.length
  const totalValue = bonifications.reduce((acc, b) => acc + Number(b.itemsValue || 0), 0)
  const customerBonifications = bonifications.filter((b) => b.customerId !== null).length
  const companyBonifications = bonifications.filter((b) => b.customerId === null).length

  const resetBonificationForm = () => {
    setBonificationForm(emptyBonificationForm())
    setBonificationBeingEdited(null)
  }

  const handleOpenCreateBonification = () => {
    resetBonificationForm()
    setIsBonificationDialogOpen(true)
  }

  const handleOpenEditBonification = (entry: CustomerBonificationEntry) => {
    setBonificationBeingEdited(entry)
    
    // Parse items from products JSON
    const items: BonificationItem[] = Array.isArray(entry.products) 
      ? entry.products.map((p, idx) => ({
          id: `${idx}`,
          description: typeof p === 'string' ? p : p.description || '',
          quantity: typeof p === 'object' && p.quantity ? p.quantity : 1,
          unitValue: typeof p === 'object' && p.unitValue ? p.unitValue : 0,
        }))
      : []

    setBonificationForm({
      recipientType: entry.customerId ? "CUSTOMER" : "COMPANY",
      customerId: entry.customerId || "",
      companyName: entry.companyName || "",
      givenBy: entry.givenBy,
      reason: entry.reason || "",
      observation: entry.observation || "",
      category: entry.category as BonificationCategory,
      bonifiedAt: entry.bonifiedAt.slice(0, 10),
      items,
    })
    setIsBonificationDialogOpen(true)
  }

  const handleAddItem = () => {
    setBonificationForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          description: "",
          quantity: 1,
          unitValue: 0,
        },
      ],
    }))
  }

  const handleRemoveItem = (id: string) => {
    setBonificationForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }))
  }

  const handleUpdateItem = (id: string, field: keyof BonificationItem, value: string | number) => {
    setBonificationForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }))
  }

  const calculateTotalValue = () => {
    return bonificationForm.items.reduce(
      (acc, item) => acc + item.quantity * item.unitValue,
      0
    )
  }

  const handleSubmitBonification = async () => {
    // Validations
    if (bonificationForm.recipientType === "CUSTOMER" && !bonificationForm.customerId) {
      toast.error("Selecione um cliente")
      return
    }
    if (bonificationForm.recipientType === "COMPANY" && !bonificationForm.companyName.trim()) {
      toast.error("Informe o nome da empresa")
      return
    }
    if (!bonificationForm.givenBy.trim()) {
      toast.error("Informe quem concedeu a bonificação")
      return
    }
    if (!bonificationForm.reason.trim()) {
      toast.error("Informe o motivo da bonificação")
      return
    }
    if (bonificationForm.items.length === 0) {
      toast.error("Adicione pelo menos um item")
      return
    }
    if (bonificationForm.items.some((item) => !item.description.trim())) {
      toast.error("Todos os itens devem ter descrição")
      return
    }

    const totalValue = calculateTotalValue()

    const payload = {
      recipientType: bonificationForm.recipientType,
      customerId: bonificationForm.recipientType === "CUSTOMER" ? bonificationForm.customerId : null,
      companyName: bonificationForm.recipientType === "COMPANY" ? bonificationForm.companyName.trim() : null,
      givenBy: bonificationForm.givenBy.trim(),
      reason: bonificationForm.reason.trim(),
      observation: bonificationForm.observation.trim() || null,
      category: bonificationForm.category,
      bonifiedAt: bonificationForm.bonifiedAt,
      itemsValue: totalValue,
      products: bonificationForm.items.map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unitValue: item.unitValue,
        totalValue: item.quantity * item.unitValue,
      })),
    }

    try {
      if (bonificationBeingEdited) {
        await updateBonification.mutateAsync({
          id: bonificationBeingEdited.id,
          ...payload,
        })
        toast.success("Bonificação atualizada!")
      } else {
        await createBonification.mutateAsync(payload)
        toast.success("Bonificação registrada!")
      }
      setIsBonificationDialogOpen(false)
      resetBonificationForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar bonificação"
      toast.error(message)
    }
  }

  const handleDeleteBonification = async () => {
    if (!bonificationPendingDeletion) return
    try {
      await deleteBonification.mutateAsync(bonificationPendingDeletion.id)
      toast.success("Bonificação removida!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao remover bonificação"
      toast.error(message)
    } finally {
      setBonificationPendingDeletion(null)
    }
  }

  const isSavingBonification = createBonification.isPending || updateBonification.isPending

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
              <Gift className="h-8 w-8 text-amber-500" />
              Bonificações & Degustações
            </h1>
            <p className="text-muted-foreground mt-1">
              Registre e gerencie brindes, degustações e cortesias concedidas
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Bonificações</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBonifications}</div>
                <p className="text-xs text-muted-foreground">Registros totais</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">Em bonificações</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Para Clientes</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerBonifications}</div>
                <p className="text-xs text-muted-foreground">Bonificações</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Para Empresas</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{companyBonifications}</div>
                <p className="text-xs text-muted-foreground">Bonificações</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <CardTitle>Lista de Bonificações</CardTitle>
                <CardDescription>
                  Pesquise e gerencie todas as bonificações registradas
                </CardDescription>
              </div>
              <Button onClick={handleOpenCreateBonification} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Bonificação
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, empresa, motivo..."
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Destinatário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="CUSTOMER">Clientes</SelectItem>
                  <SelectItem value="COMPANY">Empresas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bonifications List */}
            {isLoadingBonifications || isFetchingBonifications ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4 rounded-lg border p-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[300px]" />
                      <Skeleton className="h-3 w-[250px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBonifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Gift className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  {searchTerm || categoryFilter !== "all" || recipientFilter !== "all"
                    ? "Nenhuma bonificação encontrada"
                    : "Nenhuma bonificação registrada"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  {searchTerm || categoryFilter !== "all" || recipientFilter !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Comece registrando sua primeira bonificação"}
                </p>
                {!searchTerm && categoryFilter === "all" && recipientFilter === "all" && (
                  <Button onClick={handleOpenCreateBonification}>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Primeira Bonificação
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBonifications.map((bonification) => (
                  <Card key={bonification.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                            {bonification.customerId ? (
                              <User className="h-5 w-5 text-amber-500" />
                            ) : (
                              <Building2 className="h-5 w-5 text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {bonification.customer?.name || bonification.companyName || "—"}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {CATEGORY_OPTIONS.find((c) => c.value === bonification.category)?.label || bonification.category}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Motivo:</span>{" "}
                          <span className="font-medium">{bonification.reason}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Concedido por:</span>{" "}
                          <span>{bonification.givenBy}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Data:</span>{" "}
                          <span>{formatDate(bonification.bonifiedAt)}</span>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Valor Total</div>
                          <div className="text-lg font-bold text-amber-600">
                            {formatCurrency(Number(bonification.itemsValue || 0))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Itens</div>
                          <div className="text-lg font-semibold">
                            {Array.isArray(bonification.products) ? bonification.products.length : 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenEditBonification(bonification)}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBonificationPendingDeletion(bonification)}
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

      {/* Bonification Form Dialog */}
      <Dialog open={isBonificationDialogOpen} onOpenChange={(open) => {
        setIsBonificationDialogOpen(open)
        if (!open) resetBonificationForm()
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bonificationBeingEdited ? "Editar Bonificação" : "Nova Bonificação"}
            </DialogTitle>
            <DialogDescription>
              {bonificationBeingEdited
                ? "Atualize os detalhes da bonificação"
                : "Registre uma nova bonificação ou degustação"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Recipient Type */}
            <div className="space-y-2">
              <Label>Destinatário *</Label>
              <RadioGroup
                value={bonificationForm.recipientType}
                onValueChange={(value: RecipientType) =>
                  setBonificationForm((prev) => ({ ...prev, recipientType: value }))
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CUSTOMER" id="customer" />
                  <Label htmlFor="customer" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Cliente
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COMPANY" id="company" />
                  <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="h-4 w-4" />
                    Empresa
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Customer or Company */}
            {bonificationForm.recipientType === "CUSTOMER" ? (
              <div className="space-y-2">
                <Label htmlFor="customer-select">Cliente *</Label>
                <Select
                  value={bonificationForm.customerId}
                  onValueChange={(value) =>
                    setBonificationForm((prev) => ({ ...prev, customerId: value }))
                  }
                >
                  <SelectTrigger id="customer-select">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Empresa *</Label>
                <Input
                  id="company-name"
                  value={bonificationForm.companyName}
                  onChange={(e) =>
                    setBonificationForm((prev) => ({ ...prev, companyName: e.target.value }))
                  }
                  placeholder="Ex: Restaurante XYZ, Bar ABC"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="given-by">Concedido Por *</Label>
                <Input
                  id="given-by"
                  value={bonificationForm.givenBy}
                  onChange={(e) =>
                    setBonificationForm((prev) => ({ ...prev, givenBy: e.target.value }))
                  }
                  placeholder="Nome do colaborador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonified-at">Data *</Label>
                <Input
                  id="bonified-at"
                  type="date"
                  value={bonificationForm.bonifiedAt}
                  onChange={(e) =>
                    setBonificationForm((prev) => ({ ...prev, bonifiedAt: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={bonificationForm.category}
                onValueChange={(value: BonificationCategory) =>
                  setBonificationForm((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div>
                        <div className="font-medium">{cat.label}</div>
                        <div className="text-xs text-muted-foreground">{cat.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo *</Label>
              <Input
                id="reason"
                value={bonificationForm.reason}
                onChange={(e) =>
                  setBonificationForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Ex: Fidelidade, Inauguração, Parceria"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observation">Observações</Label>
              <Textarea
                id="observation"
                value={bonificationForm.observation}
                onChange={(e) =>
                  setBonificationForm((prev) => ({ ...prev, observation: e.target.value }))
                }
                placeholder="Informações adicionais (opcional)"
                rows={2}
              />
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Itens Bonificados *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>

              {bonificationForm.items.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-xs">Clique em "Adicionar Item" para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bonificationForm.items.map((item, index) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Item {index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="sm:col-span-3">
                              <Label htmlFor={`item-desc-${item.id}`} className="text-xs">
                                Descrição *
                              </Label>
                              <Input
                                id={`item-desc-${item.id}`}
                                value={item.description}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, "description", e.target.value)
                                }
                                placeholder="Ex: Chope Pilsen 300ml"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`item-qty-${item.id}`} className="text-xs">
                                Quantidade *
                              </Label>
                              <Input
                                id={`item-qty-${item.id}`}
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, "quantity", parseInt(e.target.value) || 1)
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor={`item-value-${item.id}`} className="text-xs">
                                Valor Unitário
                              </Label>
                              <Input
                                id={`item-value-${item.id}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitValue}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, "unitValue", parseFloat(e.target.value) || 0)
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Total</Label>
                              <div className="text-sm font-semibold flex items-center h-10">
                                {formatCurrency(item.quantity * item.unitValue)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {bonificationForm.items.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-semibold">Valor Total da Bonificação</span>
                  <span className="text-xl font-bold text-amber-600">
                    {formatCurrency(calculateTotalValue())}
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBonificationDialogOpen(false)}
              disabled={isSavingBonification}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitBonification} disabled={isSavingBonification}>
              {isSavingBonification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bonificationBeingEdited ? "Salvar Alterações" : "Registrar Bonificação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={bonificationPendingDeletion !== null}
        onOpenChange={(open) => {
          if (!open) setBonificationPendingDeletion(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta bonificação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBonification}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Bonificação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
