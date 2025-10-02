"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { DailyReportStatus, Prisma } from "@prisma/client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

type DailyReportWithRelations = Prisma.DailyReportGetPayload<{
  include: {
    pointOfSale: true
    cashSession: {
      select: {
        id: true
        openedAt: true
        closedAt: true
      }
    }
  }
}>

type Filters = {
  from?: string
  to?: string
  status: "all" | DailyReportStatus
  pointOfSaleId?: string
}

type Props = {
  initialData: DailyReportWithRelations[]
  initialTotal: number
  pointsOfSale: Array<{ id: string; name: string }>
  initialFilters: Filters
}

const statusLabels: Record<DailyReportStatus | "all", string> = {
  PENDING: "Pendente",
  GENERATED: "Gerado",
  SENT: "Enviado",
  RESENT: "Reenviado",
  FAILED: "Falhou",
  all: "Todos",
}

const statusColors: Record<DailyReportStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-600",
  GENERATED: "bg-blue-500/15 text-blue-600",
  SENT: "bg-emerald-500/15 text-emerald-600",
  RESENT: "bg-purple-500/15 text-purple-600",
  FAILED: "bg-red-500/15 text-red-600",
}

const CONSOLIDATED_POINT_VALUE = "__consolidated"

function toCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function DailyReportsClient({ initialData, initialTotal, pointsOfSale, initialFilters }: Props) {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [generationDate, setGenerationDate] = useState(() => new Date().toISOString().slice(0, 10))

  const queryKey = useMemo(() => ["daily-reports", filters], [filters])

  const reportsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.from) params.set("from", new Date(filters.from).toISOString())
      if (filters.to) params.set("to", new Date(filters.to).toISOString())
      if (filters.status && filters.status !== "all") params.set("status", filters.status)
      if (filters.pointOfSaleId) params.set("pointOfSaleId", filters.pointOfSaleId)
      params.set("take", "100")

      const response = await fetch(`/api/reports/daily?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Não foi possível carregar os relatórios")
      }

      return (await response.json()) as { data: DailyReportWithRelations[]; total: number }
    },
    initialData: { data: initialData, total: initialTotal },
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        date: new Date(generationDate).toISOString(),
        pointOfSaleId: filters.pointOfSaleId,
      }

      const response = await fetch("/api/reports/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Não foi possível gerar o relatório")
      }

      return (await response.json()) as DailyReportWithRelations
    },
    onSuccess: () => {
      toast.success("Relatório gerado com sucesso")
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Não foi possível gerar o relatório"
      toast.error(message)
    },
  })

  const resendMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/reports/daily/${reportId}/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Não foi possível reenviar o relatório")
      }

      return (await response.json()) as DailyReportWithRelations
    },
    onSuccess: () => {
      toast.success("Relatório reenviado com sucesso")
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Falha ao reenviar o relatório"
      toast.error(message)
    },
  })

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const next: Filters = {
      status: (formData.get("status") as Filters["status"]) || "all",
    }

    const from = formData.get("from") as string | null
    const to = formData.get("to") as string | null
    const pointOfSaleId = formData.get("pointOfSaleId") as string | null

    if (from) next.from = from
    if (to) next.to = to
    if (pointOfSaleId && pointOfSaleId !== CONSOLIDATED_POINT_VALUE) {
      next.pointOfSaleId = pointOfSaleId
    }

    setFilters(next)
  }

  const clearFilters = () => {
    setFilters({ status: "all" })
  }

  const reports = reportsQuery.data?.data ?? []
  const total = reportsQuery.data?.total ?? 0

  return (
    <div className="space-y-6 pb-10">
      {/* Header aprimorado */}
      <Card className="border-none bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-blue-500/5 shadow-sm">
        <CardHeader>
          <div className="space-y-2">
            <CardTitle className="text-2xl md:text-3xl">Relatórios Z - Fechamentos Diários</CardTitle>
            <CardDescription className="text-base">
              Gerencie os fechamentos diários do caixa. Gere, visualize e envie relatórios por email automaticamente.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Geração de Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gerar Novo Relatório</CardTitle>
          <CardDescription>Crie um relatório para uma data específica. Ideal para geração manual após fechamento de caixa.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data do relatório</label>
              <Input
                type="date"
                value={generationDate}
                onChange={(event) => setGenerationDate(event.target.value)}
                className="w-48"
              />
            </div>
            <Button 
              type="button" 
              onClick={() => generateMutation.mutate()} 
              disabled={generateMutation.isPending}
              className="gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Gerando...
                </>
              ) : (
                "Gerar Relatório"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Pesquise relatórios por período, status ou ponto de venda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-5" onSubmit={applyFilters}>
            <div className="space-y-2">
              <label className="text-sm font-medium">De</label>
              <Input type="date" name="from" defaultValue={filters.from} max={filters.to} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Até</label>
              <Input type="date" name="to" defaultValue={filters.to} min={filters.from} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select name="status" defaultValue={filters.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="GENERATED">Gerado</SelectItem>
                  <SelectItem value="SENT">Enviado</SelectItem>
                  <SelectItem value="RESENT">Reenviado</SelectItem>
                  <SelectItem value="FAILED">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ponto de venda</label>
              <Select name="pointOfSaleId" defaultValue={filters.pointOfSaleId ?? CONSOLIDATED_POINT_VALUE}>
                <SelectTrigger>
                  <SelectValue placeholder="Consolidado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CONSOLIDATED_POINT_VALUE}>Consolidado</SelectItem>
                  {pointsOfSale.map((point) => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="w-full">
                Aplicar filtros
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={clearFilters}>
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="text-base">Histórico de Relatórios</CardTitle>
            <CardDescription>
              {reportsQuery.isFetching ? "Atualizando..." : `Mostrando ${reports.length} de ${total} registros.`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ponto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Envio</TableHead>
                <TableHead>Total líquido</TableHead>
                <TableHead>Pagamentos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum relatório encontrado para o período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(report.reportDate), "dd 'de' MMMM yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{report.pointOfSale?.name ?? "Consolidado"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[report.status]}>{statusLabels[report.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs leading-tight text-muted-foreground">
                        {report.sentAt ? (
                          <span>Enviado {format(new Date(report.sentAt), "dd/MM HH:mm")}</span>
                        ) : (
                          <span>Sem envio</span>
                        )}
                        {report.resentCount > 0 && (
                          <span>Reenvios: {report.resentCount}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{toCurrency(report.netTotal)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        {Array.isArray(report.totalsByMethod)
                          ? report.totalsByMethod.map((summary: any) => (
                              <div key={summary.method} className="flex items-center justify-between gap-2">
                                <span className="font-medium uppercase">{summary.method}</span>
                                <span>{toCurrency(summary.receivedAmount ?? summary.expectedAmount ?? 0)}</span>
                              </div>
                            ))
                          : <span className="text-muted-foreground">Sem pagamentos</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Sempre mostrar botões - PDFs agora estão no banco */}
                        <Button asChild size="sm" variant="outline" className="gap-2">
                          <a href={`/api/reports/${report.id}/pdf`} target="_blank" rel="noopener noreferrer">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Ver PDF
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="gap-2">
                          <a href={`/api/reports/${report.id}/pdf`} download>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={resendMutation.isPending}
                          onClick={() => resendMutation.mutate(report.id)}
                          className="gap-2"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {resendMutation.isPending ? "Enviando..." : "Enviar Email"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Card informativo sobre o fluxo */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Fluxo de Fechamento de Caixa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-600">1</span>
              <span>Feche o caixa no <strong className="text-foreground">PDV</strong> (snapshot salvo automaticamente)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-600">2</span>
              <span>Gere o <strong className="text-foreground">Relatório Z</strong> nesta página selecionando a data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-600">3</span>
              <span>O relatório será gerado em PDF e enviado automaticamente por email</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-600">4</span>
              <span>Baixe o PDF ou reenvie o email se necessário usando os botões de ação</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Configuração:</strong> Os arquivos são armazenados na pasta configurada pelo ambiente. 
          Configure variáveis SMTP (EMAIL_SERVER, EMAIL_FROM) e destinatários no .env para envio automático.
        </p>
      </div>
    </div>
  )
}
