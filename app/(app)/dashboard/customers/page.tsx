"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Loader2, Gift, Users } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
  type CustomerSummary,
} from "@/hooks/useCustomers"
import {
  useCreateCustomerBonification,
  useCustomerBonifications,
  useDeleteCustomerBonification,
  useUpdateCustomerBonification,
  type CustomerBonificationEntry,
} from "@/hooks/useCustomerBonifications"
import { formatPhone, formatDate, formatDocumentDisplay } from "@/lib/utils/formatters"
import { sanitizeDocument, formatDocument as baseFormatDocument } from "@/lib/documents"

const CATEGORY_OPTIONS = [
  { value: "BONIFICATION", label: "Bonificação" },
  { value: "DEGUSTATION", label: "Degustação" },
] as const

type BonificationCategoryValue = (typeof CATEGORY_OPTIONS)[number]["value"]

type CustomerFormState = {
  name: string
  document: string
  phone: string
  address: string
}

type BonificationFormState = {
  customerId: string
  givenBy: string
  observation: string
  products: string
  category: BonificationCategoryValue
  bonifiedAt: string
}

const emptyCustomerForm: CustomerFormState = {
  name: "",
  document: "",
  phone: "",
  address: "",
}

const buildEmptyBonificationForm = (): BonificationFormState => ({
  customerId: "",
  givenBy: "",
  observation: "",
  products: "",
  category: "BONIFICATION",
  bonifiedAt: new Date().toISOString().slice(0, 10),
})

const formatAddress = (customer: CustomerSummary) => {
  if (!customer.address) return "—"
  return customer.address
}

const mapProductsToString = (products: string[]) => (products.length ? products.join(", ") : "—")

export default function CustomersPage() {
  const queryClient = useQueryClient()

  // Pull to refresh
  const { isPulling, isRefreshing, progress, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] })
      await queryClient.invalidateQueries({ queryKey: ["customer-bonifications"] })
    },
  })

  const [activeTab, setActiveTab] = useState<"customers" | "bonifications">("customers")
  const [searchTerm, setSearchTerm] = useState("")

  const [customerForm, setCustomerForm] = useState<CustomerFormState>(emptyCustomerForm)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [customerBeingEdited, setCustomerBeingEdited] = useState<CustomerSummary | null>(null)
  const [customerPendingDeletion, setCustomerPendingDeletion] = useState<CustomerSummary | null>(null)

  const [bonificationForm, setBonificationForm] = useState<BonificationFormState>(buildEmptyBonificationForm)
  const [isBonificationDialogOpen, setIsBonificationDialogOpen] = useState(false)
  const [bonificationBeingEdited, setBonificationBeingEdited] = useState<CustomerBonificationEntry | null>(null)
  const [bonificationPendingDeletion, setBonificationPendingDeletion] = useState<CustomerBonificationEntry | null>(null)
  const [bonificationCustomerFilter, setBonificationCustomerFilter] = useState<string>("")

  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    isFetching: isFetchingCustomers,
  } = useCustomers()
  const {
    data: bonifications = [],
    isLoading: isLoadingBonifications,
    isFetching: isFetchingBonifications,
  } = useCustomerBonifications(bonificationCustomerFilter || undefined)

  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const createBonification = useCreateCustomerBonification()
  const updateBonification = useUpdateCustomerBonification()
  const deleteBonification = useDeleteCustomerBonification()

  const filteredCustomers = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()
    const digitTerm = sanitizeDocument(searchTerm)
    if (!normalizedTerm) return customers

    return customers.filter((customer) => {
      const name = customer.name.toLowerCase()
      const phone = (customer.phone ?? "").toLowerCase()
      const address = (customer.address ?? "").toLowerCase()
      const document = customer.document ?? ""
      const formattedDocument = formatDocumentDisplay(document).toLowerCase()

      if (
        name.includes(normalizedTerm) ||
        phone.includes(normalizedTerm) ||
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

  const totalBonifications = useMemo(
    () => customers.reduce((acc, customer) => acc + customer.bonificationsCount, 0),
    [customers]
  )

  const resetCustomerForm = () => {
    setCustomerForm(emptyCustomerForm)
    setCustomerBeingEdited(null)
  }

  const resetBonificationForm = () => {
    setBonificationForm(buildEmptyBonificationForm())
    setBonificationBeingEdited(null)
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
          address: customerForm.address.trim() || null,
        })
        toast.success("Cliente atualizado com sucesso.")
      } else {
        await createCustomer.mutateAsync({
          name: customerForm.name.trim(),
          document: customerForm.document.trim() || null,
          phone: customerForm.phone.trim() || null,
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

  const handleOpenCreateBonification = () => {
    resetBonificationForm()
    if (bonificationCustomerFilter) {
      setBonificationForm((prev) => ({ ...prev, customerId: bonificationCustomerFilter }))
    }
    setIsBonificationDialogOpen(true)
  }

  const handleOpenEditBonification = (entry: CustomerBonificationEntry) => {
    setBonificationBeingEdited(entry)
    setBonificationForm({
      customerId: entry.customerId || "",
      givenBy: entry.givenBy,
      observation: entry.observation ?? "",
      products: entry.products.join(", "),
      category: entry.category as BonificationCategoryValue,
      bonifiedAt: entry.bonifiedAt.slice(0, 10),
    })
    setIsBonificationDialogOpen(true)
  }

  const handleSubmitBonification = async () => {
    if (!bonificationForm.customerId) {
      toast.error("Selecione um cliente.")
      return
    }
    if (!bonificationForm.givenBy.trim()) {
      toast.error("Informe quem concedeu a bonificação.")
      return
    }

    const payload = {
      customerId: bonificationForm.customerId,
      givenBy: bonificationForm.givenBy.trim(),
      reason: bonificationForm.observation.trim() || "Bonificação",
      observation: bonificationForm.observation.trim() || null,
      products: bonificationForm.products
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      category: bonificationForm.category,
      bonifiedAt: bonificationForm.bonifiedAt,
    }

    try {
      if (bonificationBeingEdited) {
        await updateBonification.mutateAsync({
          id: bonificationBeingEdited.id,
          ...payload,
        })
        toast.success("Bonificação atualizada.")
      } else {
        await createBonification.mutateAsync(payload)
        toast.success("Bonificação lançada.")
      }
      setIsBonificationDialogOpen(false)
      resetBonificationForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar a bonificação."
      toast.error(message)
    }
  }

  const handleDeleteBonification = async () => {
    if (!bonificationPendingDeletion) return
    try {
      await deleteBonification.mutateAsync(bonificationPendingDeletion.id)
      toast.success("Bonificação removida.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível remover a bonificação."
      toast.error(message)
    } finally {
      setBonificationPendingDeletion(null)
    }
  }

  const isSavingCustomer = createCustomer.isPending || updateCustomer.isPending
  const isSavingBonification = createBonification.isPending || updateBonification.isPending

  return (
    <>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        progress={progress}
        pullDistance={pullDistance}
      />
      <div className="space-y-6">
      <Card className="border-dashed bg-muted/40">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-amber-500" />
              Clientes & Bonificações
            </CardTitle>
            <CardDescription>
              Centralize o cadastro dos clientes e acompanhe brindes e degustações concedidas pela equipe.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Total de clientes: {customers.length}</span>
            <Separator orientation="vertical" className="hidden h-5 sm:flex" />
            <span className="flex items-center gap-1">
              <Gift className="h-4 w-4 text-amber-500" /> {totalBonifications} lançamentos
            </span>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="customers" value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="bonifications">Bonificações</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Cadastro de clientes</CardTitle>
                <CardDescription>Mantenha os dados principais sempre atualizados para facilitar campanhas e contatos.</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  placeholder="Buscar por nome, telefone ou endereço"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full min-w-[240px]"
                />
                <Button onClick={handleOpenCreateCustomer} className="whitespace-nowrap">
                  <Plus className="mr-2 h-4 w-4" /> novo cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-center">Bonificações</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingCustomers || isFetchingCustomers ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Carregando clientes...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        Nenhum cliente encontrado. Cadastre o primeiro clicando em "novo cliente".
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{formatDocumentDisplay(customer.document)}</TableCell>
                        <TableCell>{formatPhone(customer.phone)}</TableCell>
                        <TableCell>{formatAddress(customer)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={customer.bonificationsCount > 0 ? "default" : "secondary"}>
                            {customer.bonificationsCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenEditCustomer(customer)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar cliente</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCustomerPendingDeletion(customer)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir cliente</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonifications" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Lançamentos de bonificações</CardTitle>
                <CardDescription>Registre brindes, degustações e observações para manter o histórico do relacionamento.</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select
                  value={bonificationCustomerFilter}
                  onValueChange={(value) => setBonificationCustomerFilter(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="min-w-[220px]">
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleOpenCreateBonification} className="whitespace-nowrap">
                  <Plus className="mr-2 h-4 w-4" /> nova bonificação
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Itens bonificados</TableHead>
                    <TableHead>Quem concedeu</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingBonifications || isFetchingBonifications ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Carregando bonificações...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : bonifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Ainda não há bonificações registradas. Utilize o botão "nova bonificação" para lançar a primeira.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bonifications.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.customer?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={entry.category === "DEGUSTATION" ? "secondary" : "default"}>
                            {CATEGORY_OPTIONS.find((option) => option.value === entry.category)?.label ?? entry.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{mapProductsToString(entry.products)}</TableCell>
                        <TableCell>{entry.givenBy}</TableCell>
                        <TableCell>{formatDate(entry.bonifiedAt)}</TableCell>
                        <TableCell>{entry.observation ?? "—"}</TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenEditBonification(entry)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar bonificação</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setBonificationPendingDeletion(entry)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir bonificação</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isCustomerDialogOpen} onOpenChange={(open) => {
        setIsCustomerDialogOpen(open)
        if (!open) {
          resetCustomerForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{customerBeingEdited ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>
              {customerBeingEdited
                ? "Atualize as informações do cliente selecionado."
                : "Informe os dados principais para cadastrar o cliente."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nome completo</Label>
              <Input
                id="customer-name"
                value={customerForm.name}
                onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ex: João da Silva"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-document">CPF/CNPJ</Label>
                <Input
                  id="customer-document"
                  value={customerForm.document}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, document: event.target.value }))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Telefone</Label>
                <Input
                  id="customer-phone"
                  value={customerForm.phone}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customer-address">Endereço</Label>
                <Input
                  id="customer-address"
                  value={customerForm.address}
                  onChange={(event) => setCustomerForm((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Rua, número, complemento"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)} disabled={isSavingCustomer}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitCustomer} disabled={isSavingCustomer}>
              {isSavingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {customerBeingEdited ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={customerPendingDeletion !== null} onOpenChange={(open) => {
        if (!open) {
          setCustomerPendingDeletion(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita e removerá também as bonificações vinculadas a este cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBonificationDialogOpen} onOpenChange={(open) => {
        setIsBonificationDialogOpen(open)
        if (!open) {
          resetBonificationForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{bonificationBeingEdited ? "Editar bonificação" : "Nova bonificação"}</DialogTitle>
            <DialogDescription>
              {bonificationBeingEdited
                ? "Atualize os detalhes da bonificação concedida."
                : "Preencha os campos para registrar um novo benefício."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="bonification-customer">Cliente</Label>
              <Select
                value={bonificationForm.customerId}
                onValueChange={(value) => setBonificationForm((prev) => ({ ...prev, customerId: value }))}
              >
                <SelectTrigger id="bonification-customer">
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bonification-given-by">Quem concedeu</Label>
                <Input
                  id="bonification-given-by"
                  value={bonificationForm.givenBy}
                  onChange={(event) => setBonificationForm((prev) => ({ ...prev, givenBy: event.target.value }))}
                  placeholder="Nome do colaborador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonification-date">Data da bonificação</Label>
                <Input
                  id="bonification-date"
                  type="date"
                  value={bonificationForm.bonifiedAt}
                  onChange={(event) => setBonificationForm((prev) => ({ ...prev, bonifiedAt: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonification-products">O que foi bonificado</Label>
              <Input
                id="bonification-products"
                value={bonificationForm.products}
                onChange={(event) => setBonificationForm((prev) => ({ ...prev, products: event.target.value }))}
                placeholder="Itens separados por vírgula"
              />
              <p className="text-xs text-muted-foreground">Ex: Chope Pilsen 300ml, Taça personalizada</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bonification-category">Categoria</Label>
                <Select
                  value={bonificationForm.category}
                  onValueChange={(value) => setBonificationForm((prev) => ({
                    ...prev,
                    category: value as BonificationCategoryValue,
                  }))}
                >
                  <SelectTrigger id="bonification-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonification-observation">Observações</Label>
                <Textarea
                  id="bonification-observation"
                  value={bonificationForm.observation}
                  onChange={(event) => setBonificationForm((prev) => ({ ...prev, observation: event.target.value }))}
                  placeholder="Detalhes adicionais, motivo ou feedback do cliente"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBonificationDialogOpen(false)} disabled={isSavingBonification}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitBonification} disabled={isSavingBonification}>
              {isSavingBonification && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bonificationBeingEdited ? "Salvar alterações" : "Registrar bonificação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bonificationPendingDeletion !== null} onOpenChange={(open) => {
        if (!open) {
          setBonificationPendingDeletion(null)
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bonificação</AlertDialogTitle>
            <AlertDialogDescription>
              Essa operação removerá o registro da bonificação selecionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBonification} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  )
}
