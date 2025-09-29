import { addDays, format, startOfDay } from "date-fns"
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
  const doc = new PDFDocument({ margin: 40 })
  const chunks: Buffer[] = []

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: string | Buffer) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
    })

    doc.on("error", (error: unknown) => reject(error))

    doc.on("end", () => {
      resolve(Buffer.concat(chunks))
    })

  const formattedDate = format(toZonedTime(params.reportDate, params.timezone), "dd/MM/yyyy")

    doc.fontSize(18).text("Relatório Z - Fechamento Diário", { align: "center" })
    doc.moveDown(0.5)

    doc.fontSize(12).text(`Data de referência: ${formattedDate}`)
    if (params.pointOfSaleName) {
      doc.text(`Ponto de venda: ${params.pointOfSaleName}`)
    }
    doc.moveDown()

    const { computation } = params

    doc.fontSize(14).text("Resumo Financeiro", { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text(`Subtotal bruto: ${toCurrency(computation.subtotal)}`)
    doc.text(`Descontos: ${toCurrency(computation.discountTotal)}`)
    doc.text(`Impostos: ${toCurrency(computation.taxTotal)}`)
    doc.text(`Serviço: ${toCurrency(computation.serviceChargeTotal)}`)
    doc.text(`Total líquido: ${toCurrency(computation.netTotal)}`)
    doc.moveDown()

    doc.fontSize(14).text("Totais por método de pagamento", { underline: true })
    doc.moveDown(0.5)

    computation.paymentSummaries.forEach((summary) => {
      doc.fontSize(12).text(`${summary.method.toUpperCase()}`)
      doc.fontSize(10)
      doc.text(`Previsto: ${toCurrency(summary.expectedAmount)} | Recebido: ${toCurrency(summary.receivedAmount)} | Pagamentos: ${summary.paymentsCount}`)
      doc.text(`Status: Pendente ${summary.statuses[PaymentStatus.PENDING] ?? 0} · Parcial ${summary.statuses[PaymentStatus.PARTIAL] ?? 0} · Pago ${summary.statuses[PaymentStatus.PAID] ?? 0} · Atrasado ${summary.statuses[PaymentStatus.OVERDUE] ?? 0}`)
      doc.moveDown(0.35)
    })

    doc.end()
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

  const savedPdf = await saveReportFile({
    buffer: pdfBuffer,
    filename: buildReportFilename(baseFilename, "pdf"),
    contentType: "application/pdf",
  })

  const savedCsv = await saveReportFile({
    buffer: csvBuffer,
    filename: buildReportFilename(baseFilename, "csv"),
    contentType: "text/csv",
  })

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
    fileUrl: savedPdf.url,
    fileType: "pdf",
    storageKey: savedPdf.storageKey,
    metadata: {
      csv: {
        storageKey: savedCsv.storageKey,
        url: savedCsv.url,
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
  const report = await prisma.dailyReport.findUnique({ where: { id: reportId } })

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

  if (!report.storageKey) {
    throw new Error("REPORT_FILE_MISSING")
  }

  const [pdfFile, csvFile, pointOfSale] = await Promise.all([
    readReportFile(report.storageKey),
    (async () => {
      const csvMetadataCandidate = metadata && isJsonObject(metadata.csv) ? metadata.csv : undefined
      const csvStorageKey = typeof csvMetadataCandidate?.storageKey === "string" ? csvMetadataCandidate.storageKey : null
      if (!csvStorageKey) return null
      try {
        return await readReportFile(String(csvStorageKey))
      } catch (error) {
        console.warn("Failed to load CSV for report", report.id, error)
        return null
      }
    })(),
    report.pointOfSaleId ? prisma.pointOfSale.findUnique({ where: { id: report.pointOfSaleId } }) : null,
  ])

  const formattedDate = format(toZonedTime(report.reportDate, timezone), "dd/MM/yyyy")
  const subject = `Relatório Z · ${formattedDate}${pointOfSale ? ` · ${pointOfSale.name}` : ""}`

  const text = [
    `Segue em anexo o relatório Z do dia ${formattedDate}.`,
    pointOfSale ? `Ponto de venda: ${pointOfSale.name}.` : "",
    `Total líquido: ${toCurrency(report.netTotal)}`,
  ]
    .filter(Boolean)
    .join("\n")

  const attachments = [
    {
      filename: pdfFile.filename,
      content: pdfFile.buffer,
      contentType: pdfFile.contentType,
    },
  ]

  if (csvFile) {
    attachments.push({
      filename: csvFile.filename,
      content: csvFile.buffer,
      contentType: csvFile.contentType,
    })
  }

  const delivery = await sendMail({
    to: recipients,
    subject,
    text,
    attachments,
  })

  const status = delivery.skipped ? report.status : DailyReportStatus.SENT

  return prisma.dailyReport.update({
    where: { id: report.id },
    data: {
      status,
      sentAt: delivery.skipped ? report.sentAt : new Date(),
      resentCount: delivery.skipped ? report.resentCount : report.resentCount + (report.sentAt ? 1 : 0),
      lastResentAt: delivery.skipped ? report.lastResentAt : report.sentAt ? new Date() : report.lastResentAt,
      deliveryMetadata: {
        ...(typeof report.deliveryMetadata === "object" ? report.deliveryMetadata : {}),
        lastResult: delivery,
        lastSentAt: new Date().toISOString(),
        recipients,
      },
    },
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
