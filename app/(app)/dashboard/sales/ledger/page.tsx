'use client'

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  ArrowUpDown,
  Ban,
  CalendarClock,
  Filter,
  Loader2,
  MapPin,
  PenSquare,
  Phone,
  RefreshCcw,
  Search,
  Sparkles,
  TrendingUp,
  User,
  WalletCards,
  Download,
  X,
  FileDown,
  DollarSign
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useSales, type SaleRecord, type UpdateSalePayload } from "@/hooks/useSales"
import { useCashSession } from "@/hooks/useCashSession"
import { ImprovedCustomerSelector } from "@/components/customers/ImprovedCustomerSelector"
import type { CustomerSummary } from "@/hooks/useCustomers"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short"
})

const paymentLabels: Record<string, string> = {
  cash: "Dinheiro",
  card: "Cartão",
  pix: "PIX",
  other: "Outros"
}

const statusLabels: Record<string, string> = {
  completed: "Concluída",
  pending: "Pendente",
  processing: "Processando",
  flagged: "Revisar"
}

const statusStyles: Record<string, string> = {
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  processing: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  flagged: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
}

const sortOptions = [
  { value: "date-desc", label: "Mais recentes" },
  { value: "date-asc", label: "Mais antigas" },
  { value: "value-desc", label: "Maior valor" },
  { value: "value-asc", label: "Menor valor" },
  { value: "customer", label: "Cliente (A-Z)" }
] as const

type SortOption = (typeof sortOptions)[number]["value"]

const highValueThreshold = 400

export default function SalesLedgerPage() {
  const { sales = [], salesLoading, cancelSale, updateSale, refetchSales } = useSales()
  const { session: cashSession } = useCashSession()

  const [searchTerm, setSearchTerm] = useState("")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [sort, setSort] = useState<SortOption>("date-desc")
  const [showHighValueOnly, setShowHighValueOnly] = useState(false)
  const [showCurrentSessionOnly, setShowCurrentSessionOnly] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (!editorOpen) {
      setSelectedSale(null)
    }
  }, [editorOpen])

  const filteredSales = useMemo(() => {
    if (!sales) return []

    const term = searchTerm.trim().toLowerCase()
    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(toDate) : null
    if (from) from.setHours(0, 0, 0, 0)
    if (to) to.setHours(23, 59, 59, 999)

    return sales.filter((sale) => {
      const saleDate = new Date(sale.date)
      if (from && saleDate < from) return false
      if (to && saleDate > to) return false

      if (paymentFilter !== "all") {
        const method = (sale.paymentMethod ?? "other").toLowerCase()
        if (method !== paymentFilter) return false
      }

      if (statusFilter !== "all") {
        const status = (sale.status ?? "completed").toLowerCase()
        if (status !== statusFilter) return false
      }

      if (showHighValueOnly && (sale.total ?? 0) < highValueThreshold) return false

      // Filtro por sessão de caixa atual
      if (showCurrentSessionOnly && cashSession) {
        const sessionStart = new Date(cashSession.openedAt)
        if (saleDate < sessionStart) return false
        if (cashSession.closedAt) {
          const sessionEnd = new Date(cashSession.closedAt)
          if (saleDate > sessionEnd) return false
        }
      }

      if (term.length > 0) {
        const haystack = getSaleSearchContent(sale)
        if (!haystack.includes(term)) return false
      }

      return true
    })
  }, [sales, searchTerm, paymentFilter, statusFilter, fromDate, toDate, showHighValueOnly, showCurrentSessionOnly, cashSession])

  const sortedSales = useMemo(() => {
    const result = [...filteredSales]

    switch (sort) {
      case "date-asc":
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        break
      case "value-desc":
        result.sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
        break
      case "value-asc":
        result.sort((a, b) => (a.total ?? 0) - (b.total ?? 0))
        break
      case "customer":
        result.sort((a, b) => {
          const aName = (a.customer?.name ?? a.customerName ?? "").toLowerCase()
          const bName = (b.customer?.name ?? b.customerName ?? "").toLowerCase()
          return aName.localeCompare(bName)
        })
        break
      default:
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    return result
  }, [filteredSales, sort])

  const { totalValue, averageTicket, pendingCount, flaggedCount, uniqueCustomers, topPayment } = useMemo(() => {
    const totalValue = filteredSales.reduce((sum, sale) => sum + (sale.total ?? 0), 0)
    const totalCount = filteredSales.length
    const averageTicket = totalCount > 0 ? totalValue / totalCount : 0

    let pendingCount = 0
    let flaggedCount = 0
    const customerSet = new Set<string>()
    const paymentCounter = new Map<string, number>()

    filteredSales.forEach((sale) => {
      const status = (sale.status ?? "completed").toLowerCase()
      if (status === "pending") pendingCount += 1
      if (status === "flagged") flaggedCount += 1

      if (sale.customer?.id) {
        customerSet.add(`id:${sale.customer.id}`)
      } else if (sale.customerName) {
        customerSet.add(`name:${sale.customerName}`)
      }

      const method = (sale.paymentMethod ?? "other").toLowerCase()
      paymentCounter.set(method, (paymentCounter.get(method) ?? 0) + 1)
    })

    const [topPaymentMethod, topPaymentCount] = Array.from(paymentCounter.entries()).sort((a, b) => b[1] - a[1])[0] ?? [undefined, 0]

    return {
      totalValue,
      averageTicket,
      pendingCount,
      flaggedCount,
      uniqueCustomers: customerSet.size,
      topPayment: topPaymentMethod ? { method: topPaymentMethod, count: topPaymentCount } : null
    }
  }, [filteredSales])

  const handleClearFilters = () => {
    setSearchTerm("")
    setPaymentFilter("all")
    setStatusFilter("all")
    setFromDate("")
    setToDate("")
    setShowHighValueOnly(false)
    setShowCurrentSessionOnly(false)
  }

  const handleExportCSV = () => {
    if (sortedSales.length === 0) {
      toast.error("Nenhuma venda para exportar")
      return
    }

    try {
      // Preparar dados para CSV
      const csvData = sortedSales.map((sale) => ({
        ID: sale.id.slice(-8),
        Data: dateFormatter.format(new Date(sale.date)),
        Cliente: sale.customer?.name ?? sale.customerName ?? "Não informado",
        Telefone: sale.customerPhone || "",
        "Ponto de Venda": sale.pointOfSale?.name || "",
        Canal: sale.channel || "",
        Status: statusLabels[(sale.status ?? "completed").toLowerCase()] || sale.status,
        Pagamento: paymentLabels[(sale.paymentMethod ?? "other").toLowerCase()] || sale.paymentMethod,
        Total: `R$ ${(sale.total ?? 0).toFixed(2)}`,
        Itens: sale.items.map((item) => `${item.quantity}x ${item.product?.name ?? "Produto"}`).join("; "),
        Observações: sale.notes || ""
      }))

      // Converter para CSV
      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => 
          headers.map((header) => {
            const value = row[header as keyof typeof row]
            // Escapar vírgulas e aspas
            return `"${String(value).replace(/"/g, '""')}"`
          }).join(",")
        )
      ].join("\n")

      // Download do arquivo
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `vendas_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`${sortedSales.length} vendas exportadas com sucesso`)
    } catch (error) {
      console.error("Erro ao exportar CSV:", error)
      toast.error("Erro ao exportar vendas")
    }
  }

  const handleOpenEditor = (sale: SaleRecord) => {
    setSelectedSale(sale)
    setEditorOpen(true)
  }

  const handleSaveSale = async (updates: UpdateSalePayload) => {
    if (!selectedSale) return
    setIsSaving(true)
    try {
      const updated = await updateSale(selectedSale.id, updates)
      setSelectedSale(updated)
      toast.success("Venda atualizada com sucesso.")
      setEditorOpen(false)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a venda.")
    } finally {
      setIsSaving(false)
    }
  }

  const confirmCancelSale = async (sale: SaleRecord) => {
    const confirmation = window.confirm(
      "Cancelar esta venda vai estornar o estoque correspondente. Deseja continuar?"
    )
    if (!confirmation) return

    setIsCancelling(true)
    try {
      await toast.promise(
        cancelSale(sale.id),
        {
          loading: "Cancelando venda...",
          success: "Venda cancelada com sucesso.",
          error: "Não foi possível cancelar a venda."
        }
      )
      if (selectedSale?.id === sale.id) {
        setEditorOpen(false)
        setSelectedSale(null)
      } else {
        setSelectedSale((current) => (current?.id === sale.id ? null : current))
      }
      void refetchSales()
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <div className="space-y-6 pb-10">
        <Card className="border-none bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-2xl md:text-3xl">Registro de Vendas</CardTitle>
                  {cashSession && (
                    <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      <DollarSign className="h-3 w-3" />
                      Caixa aberto
                    </Badge>
                  )}
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Consulte, edite e audite todas as transações. Visualize o histórico completo de vendas com filtros avançados e ferramentas de análise.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleExportCSV}
                  disabled={sortedSales.length === 0}
                >
                  <FileDown className="h-4 w-4" />
                  Exportar CSV
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href="/dashboard">
                    <ArrowUpDown className="h-4 w-4" />
                    Ver painel geral
                  </Link>
                </Button>
                <Button asChild className="gap-2">
                  <Link href="/dashboard/sales">
                    <Sparkles className="h-4 w-4" />
                    Registrar nova venda
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Receita filtrada"
                icon={TrendingUp}
                value={currencyFormatter.format(totalValue)}
                helper={`${filteredSales.length} venda${filteredSales.length === 1 ? "" : "s"}`}
              />
              <MetricCard
                title="Ticket médio"
                icon={WalletCards}
                value={currencyFormatter.format(averageTicket)}
                helper={topPayment ? `Pagamentos: ${paymentLabels[topPayment.method] ?? topPayment.method} (${topPayment.count})` : "Sem dados"}
              />
              <MetricCard
                title="Pendências"
                icon={CalendarClock}
                value={`${pendingCount} em aberto`}
                helper={flaggedCount > 0 ? `${flaggedCount} para revisão` : "Tudo em ordem"}
              />
              <MetricCard
                title="Clientes atendidos"
                icon={User}
                value={uniqueCustomers.toString()}
                helper={showHighValueOnly ? "Filtro de alto ticket ativo" : "Clientes únicos"}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtros avançados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por cliente, produto, canal ou observação"
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Pagamento</Label>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="flagged">Revisar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">De</Label>
                  <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Até</Label>
                  <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <Switch checked={showHighValueOnly} onCheckedChange={setShowHighValueOnly} id="high-value" />
                <Label htmlFor="high-value" className="cursor-pointer text-sm">
                  Mostrar apenas tickets acima de {currencyFormatter.format(highValueThreshold)}
                </Label>
              </div>
              {cashSession && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                  <Switch 
                    checked={showCurrentSessionOnly} 
                    onCheckedChange={setShowCurrentSessionOnly} 
                    id="current-session" 
                  />
                  <Label htmlFor="current-session" className="cursor-pointer text-sm text-emerald-700 dark:text-emerald-300">
                    Apenas sessão de caixa atual
                  </Label>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleClearFilters}>
                  Limpar filtros
                </Button>
                <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => void refetchSales()}>
                  <RefreshCcw className="h-4 w-4" /> Atualizar lista
                </Button>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Label className="text-xs uppercase text-muted-foreground">Ordenar por</Label>
                <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Mais recentes" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">
                {salesLoading ? "Carregando vendas..." : `${sortedSales.length} venda${sortedSales.length === 1 ? "" : "s"} no filtro`}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Clique em qualquer linha para visualizar, editar ou cancelar uma venda.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {salesLoading ? (
              <SalesTableSkeleton />
            ) : sortedSales.length === 0 ? (
              <EmptyState hasFilters={searchTerm.length > 0 || paymentFilter !== "all" || statusFilter !== "all" || fromDate !== "" || toDate !== "" || showHighValueOnly} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">Venda</TableHead>
                      <TableHead className="min-w-[200px]">Cliente & ponto</TableHead>
                      <TableHead className="min-w-[240px]">Itens & observações</TableHead>
                      <TableHead className="min-w-[140px]">Pagamento</TableHead>
                      <TableHead className="min-w-[120px]">Status</TableHead>
                      <TableHead className="min-w-[120px] text-right">Total</TableHead>
                      <TableHead className="w-[140px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSales.map((sale) => {
                      const saleStatus = (sale.status ?? "completed").toLowerCase()
                      const notes = sale.notes?.trim()
                      return (
                        <TableRow
                          key={sale.id}
                          onClick={() => handleOpenEditor(sale)}
                          className="cursor-pointer transition-colors hover:bg-muted/40"
                        >
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                  {sale.id.slice(-8)}
                                </Badge>
                                <span className="text-sm font-medium">{dateFormatter.format(new Date(sale.date))}</span>
                              </div>
                              {sale.channel && (
                                <span className="text-xs text-muted-foreground">
                                  Canal: {sale.channel}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{sale.customer?.name ?? sale.customerName ?? "Cliente não informado"}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {sale.customerPhone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {sale.customerPhone}
                                  </span>
                                )}
                                {sale.pointOfSale?.name && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {sale.pointOfSale.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[320px]">
                            <p className="truncate text-xs text-muted-foreground">
                              {sale.items.map((item) => `${item.quantity}x ${item.product?.name ?? "Produto"}`).join(", ")}
                            </p>
                            {notes && (
                              <p className="mt-1 truncate text-xs text-amber-600 dark:text-amber-400">
                                Nota: {notes}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <PaymentBadge method={sale.paymentMethod} />
                              {sale.payments && sale.payments.length > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  {sale.payments.length} parcelas registradas
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={saleStatus} />
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold">
                            {currencyFormatter.format(sale.total ?? 0)}
                            {(sale.total ?? 0) >= highValueThreshold && (
                              <Badge variant="outline" className="ml-2 text-[10px] uppercase text-amber-600">
                                Alto ticket
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleOpenEditor(sale)
                                }}
                              >
                                <PenSquare className="h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 text-destructive hover:text-destructive"
                                disabled={isCancelling}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void confirmCancelSale(sale)
                                }}
                              >
                                <Ban className="h-4 w-4" />
                                <span className="sr-only">Cancelar venda</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SaleEditorDialog
        open={editorOpen && !!selectedSale}
        sale={selectedSale}
        onOpenChange={setEditorOpen}
        onSubmit={handleSaveSale}
        onCancelSale={selectedSale ? () => confirmCancelSale(selectedSale) : async () => undefined}
        isSaving={isSaving}
        isCancelling={isCancelling}
      />
    </>
  )
}

function MetricCard({ title, value, helper, icon: Icon }: { title: string; value: string; helper?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-1 text-xl font-semibold leading-tight">{value}</p>
          {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function PaymentBadge({ method }: { method?: string | null }) {
  if (!method) {
    return <Badge variant="outline">Não informado</Badge>
  }
  const label = paymentLabels[method] ?? method
  return <Badge variant="outline" className="capitalize">{label}</Badge>
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) {
    return <Badge variant="outline">Sem status</Badge>
  }

  const normalized = status.toLowerCase()
  const label = statusLabels[normalized] ?? status
  const className = statusStyles[normalized] ?? "border-border/50 bg-muted text-muted-foreground"

  return (
    <Badge
      variant="outline"
      className={cn("capitalize", className)}
    >
      {label}
    </Badge>
  )
}

function SalesTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <AlertTriangle className="h-10 w-10 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Nenhuma venda encontrada</p>
        <p className="text-xs text-muted-foreground">
          {hasFilters ? "Ajuste os filtros ou limpe a busca para visualizar mais resultados." : "As vendas aparecerão aqui assim que forem registradas."}
        </p>
      </div>
    </div>
  )
}

function SaleEditorDialog({
  sale,
  open,
  onOpenChange,
  onSubmit,
  onCancelSale,
  isSaving,
  isCancelling
}: {
  sale: SaleRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: UpdateSalePayload) => Promise<void>
  onCancelSale: () => Promise<void>
  isSaving: boolean
  isCancelling: boolean
}) {
  const [syncCustomer, setSyncCustomer] = useState(true)
  const [formValues, setFormValues] = useState(() => mapSaleToForm(sale))
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null)

  useEffect(() => {
    setFormValues(mapSaleToForm(sale))
    setSyncCustomer(Boolean(sale?.customer))
    
    // Popular o customer selector se a venda já tem um cliente
    if (sale?.customer) {
      setSelectedCustomer({
        id: sale.customer.id,
        name: sale.customer.name,
        phone: sale.customer.phone ?? null,
        email: sale.customer.email ?? null,
        address: sale.customer.address ?? null,
        document: null, // O tipo SaleRecord não retorna document no customer
        totalOrders: 0,
        totalSpend: 0,
        averageTicket: null,
        lastPurchaseAt: null,
        bonificationsCount: 0,
        createdAt: '',
        updatedAt: '',
      })
    } else {
      setSelectedCustomer(null)
    }
  }, [sale])

  if (!sale) {
    return null
  }

  const handleChange = (field: keyof typeof formValues, value: string) => {
    setFormValues((previous) => ({ ...previous, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const paymentMethod =
      formValues.paymentMethod === "unset"
        ? null
        : (formValues.paymentMethod as UpdateSalePayload["paymentMethod"])

    const payload: UpdateSalePayload = {
      status: formValues.status as UpdateSalePayload["status"],
      paymentMethod,
      // Se um cliente está selecionado, enviamos apenas o ID
      // Caso contrário, enviamos os campos individuais
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? null : emptyToNull(formValues.customerName),
      customerEmail: selectedCustomer ? null : emptyToNull(formValues.customerEmail),
      customerPhone: selectedCustomer ? null : emptyToNull(formValues.customerPhone),
      customerDocument: selectedCustomer ? null : emptyToNull(formValues.customerDocument),
      customerAddress: selectedCustomer ? null : emptyToNull(formValues.customerAddress),
      channel: emptyToNull(formValues.channel),
      notes: emptyToNull(formValues.notes),
      syncCustomer
    }

    await onSubmit(payload)
  }

  const handleCustomerSelect = (customer: CustomerSummary | null) => {
    setSelectedCustomer(customer)
    // Limpar os campos manuais quando um cliente é selecionado
    if (customer) {
      setFormValues((prev) => ({
        ...prev,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerDocument: "",
        customerAddress: ""
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="space-y-1 text-left flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold">Editar venda</DialogTitle>
          <DialogDescription>
            Ajuste informações do cliente, canal e status. Alterações podem ser sincronizadas com o cadastro do cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          <div className="grid gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Venda</p>
              <p className="font-semibold">{dateFormatter.format(new Date(sale.date))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="font-semibold">{currencyFormatter.format(sale.total ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ponto de venda</p>
              <p className="font-semibold">{sale.pointOfSale?.name ?? "Não informado"}</p>
            </div>
          </div>

          <form id="sale-edit-form" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sale-status">Status</Label>
              <Select value={formValues.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger id="sale-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="flagged">Revisar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-payment">Forma de pagamento</Label>
              <Select
                value={formValues.paymentMethod}
                onValueChange={(value) => handleChange("paymentMethod", value)}
              >
                <SelectTrigger id="sale-payment">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Não informar</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-channel">Canal</Label>
              <Input
                id="sale-channel"
                value={formValues.channel ?? ""}
                placeholder="Ex.: Balcão, Delivery, Evento"
                onChange={(event) => handleChange("channel", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-notes">Observações internas</Label>
              <textarea
                id="sale-notes"
                value={formValues.notes ?? ""}
                placeholder="Notas importantes sobre esta venda"
                onChange={(event) => handleChange("notes", event.target.value)}
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <ImprovedCustomerSelector
                value={selectedCustomer?.id}
                onSelect={handleCustomerSelect}
                allowCreate={true}
                showRecent={true}
                placeholder="Buscar cliente por nome, telefone ou documento"
              />
              {!selectedCustomer && (
                <p className="text-xs text-muted-foreground">
                  Selecione um cliente existente ou preencha os campos abaixo manualmente
                </p>
              )}
            </div>

            {/* Campos manuais - apenas visíveis quando não há cliente selecionado */}
            {!selectedCustomer && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Nome do cliente</Label>
                  <Input
                    id="customer-name"
                    value={formValues.customerName ?? ""}
                    onChange={(event) => handleChange("customerName", event.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Telefone</Label>
                  <Input
                    id="customer-phone"
                    value={formValues.customerPhone ?? ""}
                    onChange={(event) => handleChange("customerPhone", event.target.value)}
                    placeholder="(11) 90000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">E-mail</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={formValues.customerEmail ?? ""}
                    onChange={(event) => handleChange("customerEmail", event.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-document">Documento</Label>
                  <Input
                    id="customer-document"
                    value={formValues.customerDocument ?? ""}
                    onChange={(event) => handleChange("customerDocument", event.target.value)}
                    placeholder="CPF ou CNPJ"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="customer-address">Endereço</Label>
                  <textarea
                    id="customer-address"
                    value={formValues.customerAddress ?? ""}
                    onChange={(event) => handleChange("customerAddress", event.target.value)}
                    placeholder="Rua, número, complemento"
                    className="min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                  />
                </div>
              </div>
            )}
          </div>

          {selectedCustomer && (
            <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">Sincronizar com cadastro do cliente</p>
                  <p className="text-xs text-muted-foreground">
                    Atualize também o registro oficial deste cliente.
                  </p>
                </div>
                <Switch checked={syncCustomer} onCheckedChange={setSyncCustomer} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Resumo dos itens</p>
            <div className="space-y-2 rounded-lg border border-border/40 bg-muted/10 p-3 text-sm">
              {sale.items.map((item) => (
                <div key={`${item.productId}-${item.quantity}`} className="flex items-center justify-between">
                  <span className="max-w-[60%] truncate">{item.product?.name ?? "Produto"}</span>
                  <span className="font-medium">{item.quantity}x</span>
                  <span className="text-muted-foreground">{currencyFormatter.format(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
          </form>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-between flex-shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="destructive"
            className="gap-2"
            onClick={onCancelSale}
            disabled={isCancelling}
          >
            {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            Cancelar venda
          </Button>
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2" form="sale-edit-form">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenSquare className="h-4 w-4" />}
              Salvar alterações
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function mapSaleToForm(sale: SaleRecord | null) {
  if (!sale) {
    return {
      status: "completed",
      paymentMethod: "unset",
      channel: "",
      notes: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerDocument: "",
      customerAddress: ""
    }
  }

  const normalizedStatus = (sale.status ?? "completed").toLowerCase()
  const normalizedPayment = sale.paymentMethod && sale.paymentMethod.trim().length > 0
    ? sale.paymentMethod.toLowerCase()
    : "unset"

  // Prioritize customer data from sale.customer object, fall back to direct sale fields
  const customerName = sale.customer?.name ?? sale.customerName ?? ""
  const customerEmail = sale.customer?.email ?? sale.customerEmail ?? ""
  const customerPhone = sale.customer?.phone ?? sale.customerPhone ?? ""
  const customerAddress = sale.customer?.address ?? sale.customerAddress ?? ""

  return {
    status: normalizedStatus,
    paymentMethod: normalizedPayment,
    channel: sale.channel ?? "",
    notes: sale.notes ?? "",
    customerName,
    customerEmail,
    customerPhone,
    customerDocument: sale.customerDocument ?? "",
    customerAddress
  }
}

function emptyToNull(value?: string | null) {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getSaleSearchContent(sale: SaleRecord): string {
  const pieces: string[] = [sale.id]
  const customerName = sale.customer?.name ?? sale.customerName
  if (customerName) pieces.push(customerName)
  if (sale.customerPhone) pieces.push(sale.customerPhone)
  if (sale.customerEmail) pieces.push(sale.customerEmail)
  if (sale.channel) pieces.push(sale.channel)
  if (sale.notes) pieces.push(sale.notes)
  if (sale.pointOfSale?.name) pieces.push(sale.pointOfSale.name)
  sale.items.forEach((item) => {
    if (item.product?.name) pieces.push(item.product.name)
  })
  return pieces.join(" ").toLowerCase()
}
