"use client"

import { useMemo, useState } from "react"
import { Ban, Eye, History, Receipt, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { SaleRecord } from "@/lib/useSales"

interface SalesHistoryProps {
  sales: SaleRecord[]
  isLoading: boolean
  onCancel: (saleId: string) => Promise<unknown>
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

const paymentLabels: Record<string, string> = {
  cash: "Dinheiro",
  card: "Cartão",
  pix: "PIX",
  other: "Outros"
}

function PaymentBadge({ method }: { method?: string | null }) {
  if (!method) {
    return <Badge variant="outline">Não informado</Badge>
  }

  const label = paymentLabels[method] ?? method

  return <Badge variant="outline">{label}</Badge>
}

function SalesSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-md" />
      ))}
    </div>
  )
}

export function SalesHistory({ sales, isLoading, onCancel }: SalesHistoryProps) {
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const totalSales = useMemo(() => sales.length, [sales])
  const totalRevenue = useMemo(
    () => sales.reduce((sum, sale) => sum + (sale.total ?? 0), 0),
    [sales]
  )

  const handleViewSale = (sale: SaleRecord) => {
    setSelectedSale(sale)
    setIsDialogOpen(true)
  }

  const handleCancelSale = async (saleId: string, options: { confirm?: boolean } = { confirm: true }) => {
    if (options.confirm !== false) {
      const confirmation = window.confirm(
        "Cancelar essa venda vai estornar o estoque correspondente. Deseja continuar?"
      )
      if (!confirmation) return
    }
    setIsCancelling(true)
    try {
      await toast.promise(
        onCancel(saleId),
        {
          loading: "Cancelando venda...",
          success: "Venda cancelada com sucesso.",
          error: (error) =>
            error instanceof Error
              ? `Erro ao cancelar: ${error.message}`
              : "Não foi possível cancelar a venda."
        }
      )
      setIsDialogOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Histórico de vendas
          </CardTitle>
          <p className="text-xs text-muted-foreground md:text-sm">
            {totalSales} venda{totalSales !== 1 ? "s" : ""} registradas • Receita líquida de
            <span className="font-semibold"> {currencyFormatter.format(totalRevenue)}</span>
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <SalesSkeleton />
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
            <Receipt className="h-10 w-10 opacity-70" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Nenhuma venda encontrada</p>
              <p className="text-xs text-muted-foreground">
                Ajuste os filtros ou registre uma nova venda para vê-la aqui.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Data</TableHead>
                  <TableHead className="text-xs md:text-sm">Cliente</TableHead>
                  <TableHead className="text-xs md:text-sm">Pagto.</TableHead>
                  <TableHead className="text-xs md:text-sm">Total</TableHead>
                  <TableHead className="text-xs md:text-sm">Itens</TableHead>
                  <TableHead className="text-xs md:text-sm text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id} className="text-xs md:text-sm">
                    <TableCell>{new Date(sale.date).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="font-medium">{sale.customerName ?? "-"}</TableCell>
                    <TableCell>
                      <PaymentBadge method={sale.paymentMethod ?? undefined} />
                    </TableCell>
                    <TableCell className="font-semibold">{currencyFormatter.format(sale.total ?? 0)}</TableCell>
                    <TableCell>
                      <span className="block max-w-[12rem] truncate">
                        {sale.items.map((item) => `${item.quantity}x ${item.product?.name ?? "Produto"}`).join(", ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleViewSale(sale)}
                        >
                          <Eye className="h-4 w-4" />
                          Detalhes
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleCancelSale(sale.id)}
                          disabled={isCancelling}
                        >
                          <Ban className="h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          {selectedSale && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Detalhes da venda
                </DialogTitle>
                <DialogDescription>
                  Registrada em {new Date(selectedSale.date).toLocaleString("pt-BR")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-medium">{selectedSale.customerName ?? "Não informado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Pagamento</p>
                    <PaymentBadge method={selectedSale.paymentMethod ?? undefined} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{currencyFormatter.format(selectedSale.total ?? 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Itens</p>
                    <p className="font-medium">{selectedSale.items.length}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Produtos</p>
                  <div className="space-y-2 rounded-md border border-dashed border-muted p-3">
                    {selectedSale.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{item.product?.name ?? "Produto"}</span>
                        <div className="text-right">
                          <p>{item.quantity}x</p>
                          <p className="text-xs text-muted-foreground">
                            {currencyFormatter.format(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="font-medium">
                      {currencyFormatter.format(selectedSale.subtotal ?? selectedSale.total ?? 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Descontos</p>
                    <p className="font-medium">{currencyFormatter.format(selectedSale.discountValue ?? 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Impostos</p>
                    <p className="font-medium">{currencyFormatter.format(selectedSale.taxValue ?? 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Serviço</p>
                    <p className="font-medium">{currencyFormatter.format(selectedSale.serviceCharge ?? 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Margem estimada</p>
                    <p className="font-medium">
                      {currencyFormatter.format(
                        selectedSale.grossMargin ?? ((selectedSale.total ?? 0) - (selectedSale.costOfGoods ?? 0))
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Canal</p>
                    <p className="font-medium">{selectedSale.channel ?? "POS"}</p>
                  </div>
                </div>
                {selectedSale.notes && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Observações</p>
                    <p className="text-sm">{selectedSale.notes}</p>
                  </div>
                )}
                {selectedSale.payments && selectedSale.payments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Pagamentos</p>
                    <div className="space-y-2 rounded-md border border-dashed border-muted p-3">
                      {selectedSale.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{payment.method}</span>
                          <span className="text-muted-foreground">
                            {currencyFormatter.format(payment.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  <XCircle className="mr-2 h-4 w-4" />
                  Fechar
                </Button>
                <Button
                  variant="destructive"
                  className="w-full gap-2 sm:w-auto"
                  onClick={() => selectedSale && handleCancelSale(selectedSale.id, { confirm: false })}
                  disabled={isCancelling}
                >
                  <Ban className="h-4 w-4" />
                  {isCancelling ? "Cancelando..." : "Cancelar venda"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
