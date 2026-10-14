import { addDays, format, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { fromZonedTime, toZonedTime } from "date-fns-tz"
import PDFDocument from "pdfkit"

import { prisma } from "@/lib/prisma"
import { saveReportFile, readReportFile } from "@/lib/reportStorage"
import { resolveDailyReportRecipients, sendMail } from "@/lib/mailer"
import { DailyReportStatus, PaymentStatus, Prisma } from "@prisma/client"

const DEFAULT_TIMEZONE = process.env.REPORTS_TIMEZONE || "America/Sao_Paulo"

export type DailyReportGenerationInput = {
  date?: Date | string
  pointOfSaleId?: string | null
  cashSessionId?: string | null
  regenerate?: boolean
  sendEmail?: boolean
  recipients?: string[]
  timezone?: string
}

export type DailyReportResendInput = {
  reportId: string
  recipients?: string[]
}

type PaymentSummary = {
  method: string
  expectedAmount: number
  receivedAmount: number
  paymentsCount: number
  statuses: Record<PaymentStatus, number>
}

type ReportComputation = {
  subtotal: number
  discountTotal: number
  taxTotal: number
  serviceChargeTotal: number
  netTotal: number
  grossTotal: number
  paymentSummaries: PaymentSummary[]
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function resolveDate(input?: Date | string): Date {
  if (!input) {
    return new Date()
  }

  if (input instanceof Date) {
    return input
  }

  return new Date(input)
}

function resolvePeriod(date: Date, timezone: string) {
  const tzDate = toZonedTime(date, timezone)
  const start = fromZonedTime(startOfDay(tzDate), timezone)
  const end = fromZonedTime(addDays(startOfDay(tzDate), 1), timezone)

  return { periodStart: start, periodEnd: end }
}

async function computeReport(periodStart: Date, periodEnd: Date, pointOfSaleId?: string | null): Promise<ReportComputation> {
  const sales = await prisma.sale.findMany({
    where: {
      date: {
        gte: periodStart,
        lt: periodEnd,
      },
      status: "completed",
      ...(pointOfSaleId ? { pointOfSaleId } : {}),
    },
    select: {
      id: true,
      total: true,
      subtotal: true,
      discountValue: true,
      taxValue: true,
      serviceCharge: true,
      payments: {
        where: {
          status: {
            not: PaymentStatus.CANCELLED,
          },
        },
        select: {
          method: true,
          amount: true,
          paidAmount: true,
          status: true,
        },
      },
    },
  })

  const paymentSummariesMap = new Map<string, PaymentSummary>()

  let subtotal = 0
  let discountTotal = 0
  let taxTotal = 0
  let serviceChargeTotal = 0
  let netTotal = 0

  for (const sale of sales) {
    const saleSubtotal = sale.subtotal ?? sale.total + sale.discountValue

    subtotal += saleSubtotal
    discountTotal += sale.discountValue ?? 0
    taxTotal += sale.taxValue ?? 0
    serviceChargeTotal += sale.serviceCharge ?? 0
    netTotal += sale.total

    for (const payment of sale.payments) {
      const summary = paymentSummariesMap.get(payment.method) ?? {
        method: payment.method,
        expectedAmount: 0,
        receivedAmount: 0,
        paymentsCount: 0,
        statuses: {
          [PaymentStatus.PENDING]: 0,
          [PaymentStatus.PARTIAL]: 0,
          [PaymentStatus.PAID]: 0,
          [PaymentStatus.OVERDUE]: 0,
          [PaymentStatus.CANCELLED]: 0,
        },
      }

      summary.expectedAmount += payment.amount
      summary.receivedAmount += payment.paidAmount ?? 0
      summary.paymentsCount += 1
      summary.statuses[payment.status] = (summary.statuses[payment.status] ?? 0) + 1

      paymentSummariesMap.set(payment.method, summary)
    }
  }

  const grossTotal = subtotal + taxTotal + serviceChargeTotal

  return {
    subtotal,
    discountTotal,
    taxTotal,
    serviceChargeTotal,
    netTotal,
    grossTotal,
    paymentSummaries: Array.from(paymentSummariesMap.values()).sort((a, b) => a.method.localeCompare(b.method)),
  }
}

function toCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

async function buildPdfBuffer(params: {
  reportDate: Date
  timezone: string
  pointOfSaleName?: string | null
  computation: ReportComputation
}): Promise<Buffer> {
  const doc = new PDFDocument({ 
    margin: 50,
    bufferPages: true,
    autoFirstPage: true,
    size: 'A4',
  })
  
  const chunks: Buffer[] = []

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: string | Buffer) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
    })

    doc.on("error", (error: unknown) => {
      console.error("PDF generation error:", error)
      reject(error)
    })

    doc.on("end", () => {
      resolve(Buffer.concat(chunks))
    })

    try {
      const formattedDate = format(toZonedTime(params.reportDate, params.timezone), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      const { computation } = params
      const pageWidth = doc.page.width
      const pageHeight = doc.page.height

      // ==========================================
      // HEADER COM DESIGN MODERNO
      // ==========================================
      
      // Retângulo azul no topo
      doc.rect(0, 0, pageWidth, 80)
         .fill('#2563eb')
      
      // Título branco centralizado
      doc.fillColor('#ffffff')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('RELATÓRIO Z', 50, 25, { align: 'center' })
      
      doc.fontSize(14)
         .font('Helvetica')
         .text('Fechamento Diário', 50, 52, { align: 'center' })

      // Reset cor para preto
      doc.fillColor('#000000')
      
      // ==========================================
      // INFORMAÇÕES DO RELATÓRIO
      // ==========================================
      
      doc.moveDown(4)
      
      // Box com informações gerais
      const infoBoxY = doc.y
      doc.rect(50, infoBoxY, pageWidth - 100, 60)
         .fillAndStroke('#f8fafc', '#e2e8f0')
      
      doc.fillColor('#1e293b')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('Data de Referência:', 60, infoBoxY + 15)
         .font('Helvetica')
         .text(formattedDate, 180, infoBoxY + 15)
      
      if (params.pointOfSaleName) {
        doc.font('Helvetica-Bold')
           .text('Ponto de Venda:', 60, infoBoxY + 35)
           .font('Helvetica')
           .text(params.pointOfSaleName, 180, infoBoxY + 35)
      }
      
      doc.moveDown(2)

      // ==========================================
      // RESUMO FINANCEIRO
      // ==========================================
      
      const summaryY = doc.y + 10
      
      // Título da seção
      doc.fillColor('#0f172a')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('Resumo Financeiro', 50, summaryY)
      
      doc.moveTo(50, summaryY + 22)
         .lineTo(pageWidth - 50, summaryY + 22)
         .strokeColor('#3b82f6')
         .lineWidth(2)
         .stroke()
      
      doc.moveDown(1.5)
      
      // Tabela de valores
      const tableY = doc.y
      const col1X = 60
      const col2X = pageWidth - 200
      
      const financialItems = [
        { label: 'Subtotal Bruto', value: computation.subtotal, color: '#64748b' },
        { label: 'Descontos', value: computation.discountTotal, color: '#ef4444' },
        { label: 'Impostos', value: computation.taxTotal, color: '#f59e0b' },
        { label: 'Taxa de Serviço', value: computation.serviceChargeTotal, color: '#8b5cf6' },
      ]
      
      let currentY = tableY
      
      financialItems.forEach((item, index) => {
        // Linha alternada
        if (index % 2 === 0) {
          doc.rect(50, currentY - 5, pageWidth - 100, 25)
             .fill('#f8fafc')
        }
        
        doc.fillColor(item.color)
           .fontSize(11)
           .font('Helvetica')
           .text(item.label, col1X, currentY, { width: 300 })
        
        doc.fillColor('#1e293b')
           .font('Helvetica-Bold')
           .text(toCurrency(item.value), col2X, currentY, { align: 'right', width: 150 })
        
        currentY += 25
      })
      
      // Total Líquido - destaque especial
      currentY += 5
      doc.rect(50, currentY - 5, pageWidth - 100, 35)
         .fill('#dcfce7')
      
      doc.fillColor('#059669')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Total Líquido', col1X, currentY + 5, { width: 300 })
      
      doc.fontSize(16)
         .text(toCurrency(computation.netTotal), col2X, currentY + 5, { align: 'right', width: 150 })
      
      doc.moveDown(3)

      // ==========================================
      // MÉTODOS DE PAGAMENTO
      // ==========================================
      
      const paymentY = doc.y + 10
      
      doc.fillColor('#0f172a')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('Métodos de Pagamento', 50, paymentY)
      
      doc.moveTo(50, paymentY + 22)
         .lineTo(pageWidth - 50, paymentY + 22)
         .strokeColor('#3b82f6')
         .lineWidth(2)
         .stroke()
      
      doc.moveDown(1.5)
      
      computation.paymentSummaries.forEach((summary, index) => {
        const boxY = doc.y
        
        // Verificar se precisa de nova página
        if (boxY > pageHeight - 150) {
          doc.addPage()
        }
        
        // Box para cada método
        doc.rect(50, boxY, pageWidth - 100, 90)
           .fillAndStroke('#ffffff', '#e2e8f0')
           .lineWidth(1)
        
        // Nome do método com badge
        doc.roundedRect(60, boxY + 10, 100, 25, 3)
           .fill('#3b82f6')
        
        doc.fillColor('#ffffff')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text(summary.method.toUpperCase(), 60, boxY + 16, { width: 100, align: 'center' })
        
        // Valores
        doc.fillColor('#1e293b')
           .fontSize(10)
           .font('Helvetica')
           .text('Previsto:', 180, boxY + 15)
           .font('Helvetica-Bold')
           .text(toCurrency(summary.expectedAmount), 240, boxY + 15)
        
        doc.font('Helvetica')
           .text('Recebido:', 350, boxY + 15)
           .font('Helvetica-Bold')
           .fillColor('#059669')
           .text(toCurrency(summary.receivedAmount), 415, boxY + 15)
        
        // Estatísticas
        doc.fillColor('#64748b')
           .fontSize(9)
           .font('Helvetica')
           .text(`Total de Pagamentos: ${summary.paymentsCount}`, 60, boxY + 45)
        
        // Status com ícones/bullets
        const statusY = boxY + 60
        doc.fontSize(8)
        
        const statuses = [
          { label: 'Pagos', value: summary.statuses[PaymentStatus.PAID] ?? 0, color: '#10b981' },
          { label: 'Pendentes', value: summary.statuses[PaymentStatus.PENDING] ?? 0, color: '#f59e0b' },
          { label: 'Parciais', value: summary.statuses[PaymentStatus.PARTIAL] ?? 0, color: '#3b82f6' },
          { label: 'Atrasados', value: summary.statuses[PaymentStatus.OVERDUE] ?? 0, color: '#ef4444' },
        ]
        
        let statusX = 60
        statuses.forEach((status) => {
          if (status.value > 0) {
            doc.circle(statusX, statusY + 3, 3).fill(status.color)
            doc.fillColor('#1e293b')
               .text(`${status.label}: ${status.value}`, statusX + 8, statusY, { width: 80 })
            statusX += 95
          }
        })
        
        doc.moveDown(2.5)
      })
      
      // ==========================================
      // RODAPÉ
      // ==========================================
      
      const footerY = pageHeight - 50
      
      doc.fontSize(8)
         .fillColor('#94a3b8')
         .font('Helvetica')
         .text(
           `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} · Sistema Distribuidora`, 
           50, 
           footerY, 
           { align: 'center', width: pageWidth - 100 }
         )

      doc.end()
    } catch (error) {
      console.error("Error building PDF:", error)
      reject(error)
    }
  })
}

function buildCsvBuffer(params: {
  reportDate: Date
  timezone: string
  pointOfSaleName?: string | null
  computation: ReportComputation
}): Buffer {
  const formattedDate = format(toZonedTime(params.reportDate, params.timezone), "yyyy-MM-dd")
  const headerLines = [
    ["Relatorio", "Z"],
    ["Data", formattedDate],
    ["Ponto de venda", params.pointOfSaleName ?? "Consolidado"],
    ["Subtotal", params.computation.subtotal.toFixed(2)],
    ["Descontos", params.computation.discountTotal.toFixed(2)],
    ["Impostos", params.computation.taxTotal.toFixed(2)],
    ["Servico", params.computation.serviceChargeTotal.toFixed(2)],
    ["Liquido", params.computation.netTotal.toFixed(2)],
    [],
    ["Metodo", "Previsto", "Recebido", "Pagamentos", "Pendentes", "Parciais", "Pagos", "Atrasados"],
  ]

  const rows = params.computation.paymentSummaries.map((summary) => [
    summary.method,
    summary.expectedAmount.toFixed(2),
    summary.receivedAmount.toFixed(2),
    summary.paymentsCount.toString(),
    (summary.statuses[PaymentStatus.PENDING] ?? 0).toString(),
    (summary.statuses[PaymentStatus.PARTIAL] ?? 0).toString(),
    (summary.statuses[PaymentStatus.PAID] ?? 0).toString(),
    (summary.statuses[PaymentStatus.OVERDUE] ?? 0).toString(),
  ])

  const csv = [...headerLines, ...rows]
    .map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
    .join("\n")

  return Buffer.from(csv, "utf-8")
}

function buildReportFilename(baseName: string, extension: string) {
  return `${baseName}.${extension}`
}

function buildBaseFilename(reportDate: Date, timezone: string, pointOfSaleCode?: string | null) {
  const formattedDate = format(toZonedTime(reportDate, timezone), "yyyy-MM-dd")
  return ["relatorio-z", formattedDate, pointOfSaleCode?.toLowerCase()]
    .filter(Boolean)
    .join("-")
}

export async function generateDailyReport(input: DailyReportGenerationInput = {}) {
  const timezone = input.timezone ?? DEFAULT_TIMEZONE
  const referenceDate = resolveDate(input.date)
  const { periodStart, periodEnd } = resolvePeriod(referenceDate, timezone)

  const pointOfSale = input.pointOfSaleId
    ? await prisma.pointOfSale.findUnique({ where: { id: input.pointOfSaleId } })
    : null

  const existing = await prisma.dailyReport.findFirst({
    where: {
      reportDate: periodStart,
      pointOfSaleId: input.pointOfSaleId ?? null,
    },
  })

  if (existing && !input.regenerate) {
    return existing
  }

  const computation = await computeReport(periodStart, periodEnd, input.pointOfSaleId)
  const hasMovements = computation.paymentSummaries.length > 0 || computation.netTotal > 0

  const baseFilename = buildBaseFilename(referenceDate, timezone, pointOfSale?.code ?? pointOfSale?.name)
  const pdfBuffer = await buildPdfBuffer({
    reportDate: periodStart,
    timezone,
    pointOfSaleName: pointOfSale?.name,
    computation,
  })
  const csvBuffer = buildCsvBuffer({
    reportDate: periodStart,
    timezone,
    pointOfSaleName: pointOfSale?.name,
    computation,
  })

  // Novo sistema: Salvar PDFs diretamente no banco
  const pdfFilename = buildReportFilename(baseFilename, "pdf")
  const csvFilename = buildReportFilename(baseFilename, "csv")

  const pdfMetadata = {
    filename: pdfFilename,
    contentType: "application/pdf",
    size: pdfBuffer.length,
  }

  const csvMetadata = {
    filename: csvFilename,
    contentType: "text/csv",
    size: csvBuffer.length,
  }

  const payload = {
    reportDate: periodStart,
    periodStart,
    periodEnd,
    pointOfSaleId: pointOfSale?.id ?? null,
    cashSessionId: input.cashSessionId ?? null,
    status: hasMovements ? DailyReportStatus.GENERATED : DailyReportStatus.PENDING,
    totalsByMethod: computation.paymentSummaries,
    subtotal: computation.subtotal,
    discountTotal: computation.discountTotal,
    taxTotal: computation.taxTotal,
    serviceChargeTotal: computation.serviceChargeTotal,
    grossTotal: computation.grossTotal,
    netTotal: computation.netTotal,
    
    // Armazenar PDFs diretamente no banco
    pdfData: pdfBuffer,
    csvData: csvBuffer,
    
    // Manter campos legados como null (compatibilidade)
    fileUrl: null,
    fileType: "pdf",
    storageKey: null,
    
    metadata: {
      files: {
        pdf: pdfMetadata,
        csv: csvMetadata,
      },
      timezone,
    },
  }

  const report = existing
    ? await prisma.dailyReport.update({
        where: { id: existing.id },
        data: payload,
      })
    : await prisma.dailyReport.create({ data: payload })

  if (input.sendEmail ?? true) {
    await sendDailyReportEmail(report.id, {
      recipients: input.recipients,
      timezone,
    })
  }

  return report
}

export async function sendDailyReportEmail(reportId: string, options: { recipients?: string[]; timezone?: string } = {}) {
  const report = await prisma.dailyReport.findUnique({ 
    where: { id: reportId },
    include: {
      pointOfSale: true,
    }
  })

  if (!report) {
    throw new Error("REPORT_NOT_FOUND")
  }

  const metadata = isJsonObject(report.metadata) ? report.metadata : undefined
  const metadataTimezone = typeof metadata?.timezone === "string" ? metadata.timezone : undefined
  const timezone = options.timezone ?? metadataTimezone ?? DEFAULT_TIMEZONE

  const recipients = resolveDailyReportRecipients(options.recipients)

  if (recipients.length === 0) {
    console.warn(`Daily report ${report.id} not sent: no recipients configured`)
    return report
  }

  // Verificar se há PDFs no banco
  if (!report.pdfData) {
    throw new Error("REPORT_PDF_MISSING")
  }

  // Extrair nomes de arquivo do metadata
  const pdfFilename = 
    (metadata && isJsonObject(metadata.files) && isJsonObject(metadata.files.pdf) && typeof metadata.files.pdf.filename === "string")
      ? metadata.files.pdf.filename
      : "relatorio-z.pdf"
  
  const csvFilename = 
    (metadata && isJsonObject(metadata.files) && isJsonObject(metadata.files.csv) && typeof metadata.files.csv.filename === "string")
      ? metadata.files.csv.filename
      : "relatorio-z.csv"

  const formattedDate = format(toZonedTime(report.reportDate, timezone), "dd/MM/yyyy")
  const subject = `Relatório Z · ${formattedDate}${report.pointOfSale ? ` · ${report.pointOfSale.name}` : ""}`

  const text = [
    `Segue em anexo o relatório Z do dia ${formattedDate}.`,
    report.pointOfSale ? `Ponto de venda: ${report.pointOfSale.name}.` : "",
    `Total líquido: ${toCurrency(report.netTotal)}`,
  ]
    .filter(Boolean)
    .join("\n")

  const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [
    {
      filename: pdfFilename,
      content: Buffer.from(report.pdfData) as Buffer,
      contentType: "application/pdf",
    },
  ]

  // Adicionar CSV se disponível
  if (report.csvData) {
    attachments.push({
      filename: csvFilename,
      content: Buffer.from(report.csvData) as Buffer,
      contentType: "text/csv",
    })
  }

  const delivery = await sendMail({
    to: recipients,
    subject,
    text,
    attachments,
  })

  const now = new Date()
  const nowIso = now.toISOString()
  const metadataBase: Record<string, unknown> =
    typeof report.deliveryMetadata === "object" &&
    report.deliveryMetadata !== null &&
    !Array.isArray(report.deliveryMetadata)
      ? (report.deliveryMetadata as Record<string, unknown>)
      : {}

  const deliveryMetadata: Record<string, unknown> = {
    ...metadataBase,
    lastResult: delivery,
    lastAttemptAt: nowIso,
    recipients,
  }

  if (!delivery.skipped) {
    deliveryMetadata.lastSentAt = nowIso
  }

  if (delivery.error) {
    deliveryMetadata.lastError = delivery.error
  }

  if (delivery.reason === "error") {
    deliveryMetadata.lastErrorAt = nowIso
  }

  const updateData: Prisma.DailyReportUpdateInput = {
    deliveryMetadata: deliveryMetadata as Prisma.InputJsonValue,
  }

  if (!delivery.skipped) {
    updateData.status = DailyReportStatus.SENT
    updateData.sentAt = now
    updateData.resentCount = report.resentCount + (report.sentAt ? 1 : 0)
    updateData.lastResentAt = report.sentAt ? now : report.lastResentAt ?? null
  } else if (delivery.reason === "error") {
    updateData.status = DailyReportStatus.FAILED
  }

  return prisma.dailyReport.update({
    where: { id: report.id },
    data: updateData,
  })
}

export async function resendDailyReport(input: DailyReportResendInput) {
  const report = await prisma.dailyReport.findUnique({ where: { id: input.reportId } })

  if (!report) {
    throw new Error("REPORT_NOT_FOUND")
  }

  const metadata = isJsonObject(report.metadata) ? report.metadata : undefined
  const metadataTimezone = typeof metadata?.timezone === "string" ? metadata.timezone : undefined
  const timezone = metadataTimezone ?? DEFAULT_TIMEZONE

  return sendDailyReportEmail(report.id, {
    recipients: input.recipients,
    timezone,
  })
}

export async function listDailyReports(params: {
  from?: Date | string
  to?: Date | string
  status?: DailyReportStatus | "all"
  pointOfSaleId?: string
  take?: number
  skip?: number
}) {
  const where: Prisma.DailyReportWhereInput = {}

  if (params.from || params.to) {
    where.reportDate = {
      gte: params.from ? resolveDate(params.from) : undefined,
      lte: params.to ? resolveDate(params.to) : undefined,
    }
  }

  if (params.status && params.status !== "all") {
    where.status = params.status
  }

  if (params.pointOfSaleId) {
    where.pointOfSaleId = params.pointOfSaleId
  }

  try {
    const [reports, total] = await Promise.all([
      prisma.dailyReport.findMany({
        where,
        take: params.take ?? 50,
        skip: params.skip ?? 0,
        include: {
          pointOfSale: true,
          cashSession: {
            select: {
              id: true,
              openedAt: true,
              closedAt: true,
            },
          },
        },
        orderBy: {
          reportDate: "desc",
        },
      }),
      prisma.dailyReport.count({ where }),
    ])

    return { reports, total }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      console.warn("DailyReport table not found; returning empty dataset during build.")
      return { reports: [], total: 0 }
    }
    throw error
  }
}
