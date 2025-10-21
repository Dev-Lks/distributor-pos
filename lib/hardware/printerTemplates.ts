import { ReceiptTemplate, PrintCommand } from './types'
import type { Sale, SaleItem, Product } from '@prisma/client'

interface SaleWithItems extends Sale {
  items: (SaleItem & { product: Product })[]
  pointOfSale?: { name: string; address?: string } | null
}

interface CashTransaction {
  type: string
  amount: number
  description?: string
  performedBy?: string
  createdAt: Date
}

interface ReceiptConfig {
  storeName: string
  storeDocument?: string
  storeAddress?: string
  storePhone?: string
  logoUrl?: string
  footerMessage?: string
  width: number
  showQRCode?: boolean
}

interface ColumnSpec {
  text: string
  width?: number
  align?: 'left' | 'right' | 'center'
}

class ThermalTemplateBuilder {
  private readonly commands: PrintCommand[] = []
  private readonly width: number

  constructor(width?: number) {
    this.width = normalizeWidth(width)
  }

  align(value: 'left' | 'center' | 'right'): this {
    this.commands.push({ type: 'align', value })
    return this
  }

  text(value: string, options?: { bold?: boolean; size?: 'small' | 'normal' | 'large'; align?: 'left' | 'center' | 'right' }): this {
    const command: PrintCommand = { type: 'text', value }
    if (options?.bold) command.bold = true
    if (options?.size) command.size = options.size
    if (options?.align) command.align = options.align
    this.commands.push(command)
    return this
  }

  blank(lines = 1): this {
    if (lines > 0) {
      this.commands.push({ type: 'feed', lines })
    }
    return this
  }

  separator(char: string = '-'): this {
    this.commands.push({ type: 'separator', char })
    return this
  }

  qrcode(data: string): this {
    this.commands.push({ type: 'qrcode', data })
    return this
  }

  barcode(data: string): this {
    this.commands.push({ type: 'barcode', data })
    return this
  }

  keyValue(label: string, value: string, options?: { bold?: boolean; size?: 'small' | 'normal' | 'large'; gap?: number }): this {
    const textLine = formatColumns([
      { text: label },
      { text: value, align: 'right' }
    ], this.width, options?.gap ?? 2)

    return this.text(textLine, { bold: options?.bold, size: options?.size })
  }

  columns(columns: ColumnSpec[], gap = 1, options?: { bold?: boolean; size?: 'small' | 'normal' | 'large' }): this {
    const textLine = formatColumns(columns, this.width, gap)
    return this.text(textLine, { bold: options?.bold, size: options?.size })
  }

  raw(command: PrintCommand): this {
    this.commands.push(command)
    return this
  }

  cut(): this {
    this.commands.push({ type: 'cut' })
    return this
  }

  getWidth(): number {
    return this.width
  }

  build(): ReceiptTemplate {
    return { commands: this.commands }
  }
}

export function generateSaleReceipt(
  sale: SaleWithItems,
  config: ReceiptConfig
): ReceiptTemplate {
  const builder = new ThermalTemplateBuilder(config.width)
  const width = builder.getWidth()

  renderStoreHeader(builder, config, { uppercase: true })

  builder
    .text('CUPOM NAO-FISCAL')
    .text(`Venda #${sale.id.slice(-8).toUpperCase()}`)
    .text(`Data: ${formatDateTime(sale.date, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`)

  if (sale.pointOfSale?.name) {
    builder.text(`PDV: ${sale.pointOfSale.name}`)
  }

  if (sale.customerName) {
    builder.text(`Cliente: ${sale.customerName}`)
  }

  builder
    .blank()
    .separator('-')
    .columns([
      { text: 'ITEM', width: Math.max(16, width - 18) },
      { text: 'QTD', width: 6, align: 'right' },
      { text: 'TOTAL', align: 'right' }
    ], 2, { bold: true })
    .separator('-')

  for (const item of sale.items) {
    const itemName = truncateString(item.product.name, width)
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.price || 0)
    const total = quantity * unitPrice

    builder
      .text(itemName)
      .columns([
        { text: '', width: 2 },
        { text: `${quantity}x`, width: 6 },
        { text: formatCurrency(unitPrice), width: 12, align: 'right' },
        { text: formatCurrency(total), align: 'right' }
      ], 1)
      .blank()
  }

  builder.separator('-')

  if (sale.subtotal && sale.subtotal !== sale.total) {
    builder.keyValue('Subtotal:', formatCurrency(Number(sale.subtotal)))
  }

  const discountValue = Number(sale.discountValue || 0)
  if (discountValue > 0) {
    builder.keyValue('Desconto:', formatCurrency(-discountValue))
  }

  builder
    .separator('=')
    .keyValue('TOTAL:', formatCurrency(Number(sale.total)), { bold: true, size: 'large' })
    .separator('=')
    .blank()

  if (sale.paymentMethod) {
    const paymentMap: Record<string, string> = {
      cash: 'Dinheiro',
      card: 'Cartao',
      pix: 'PIX',
      debit: 'Cartao Debito',
      credit: 'Cartao Credito'
    }
    builder.text(`Forma de Pagamento: ${paymentMap[sale.paymentMethod] || sale.paymentMethod}`)
  }

  builder.blank(2)

  if (config.showQRCode !== false) {
    builder
      .align('center')
      .text('Consulte sua venda:')
      .blank()
      .qrcode(sale.id)
      .blank()
      .align('left')
  }

  if (config.footerMessage) {
    builder.text(config.footerMessage)
  } else {
    builder
      .text('Obrigado pela preferencia!')
      .text('Volte sempre! :)')
  }

  builder
    .blank(2)
    .separator('=')
    .blank(3)
    .cut()

  return builder.build()
}

export function generateCashTransactionReceipt(
  transaction: CashTransaction,
  config: ReceiptConfig
): ReceiptTemplate {
  const builder = new ThermalTemplateBuilder(config.width)

  renderStoreHeader(builder, config, { uppercase: false })

  const transactionTitle = getTransactionTitle(transaction.type)

  builder
    .align('center')
    .text(transactionTitle, { bold: true, size: 'large' })
    .blank()
    .separator('=')
    .blank()
    .align('left')
    .text(`Data: ${formatDateTime(transaction.createdAt)}`)

  if (transaction.performedBy) {
    builder.text(`Operador: ${transaction.performedBy}`)
  }

  builder
    .blank()
    .separator('-')
    .blank()
    .align('center')
    .text(formatCurrency(Number(transaction.amount)), { bold: true, size: 'large' })
    .blank()
    .separator('-')

  if (transaction.description) {
    builder
      .blank()
      .align('left')
      .text('Observacao:')
      .text(transaction.description)
  }

  builder
    .blank(2)
    .separator('=')
    .blank(3)
    .cut()

  return builder.build()
}

export function generateCashClosingReceipt(
  cashSession: any,
  config: ReceiptConfig
): ReceiptTemplate {
  const builder = new ThermalTemplateBuilder(config.width)

  renderStoreHeader(builder, config, { uppercase: false })

  builder
    .align('center')
    .text('FECHAMENTO DE CAIXA', { bold: true, size: 'large' })
    .blank()
    .separator('=')
    .blank()
    .align('left')
    .text(`Abertura: ${formatDateTime(cashSession.openedAt)}`)
    .text(`Fechamento: ${formatDateTime(cashSession.closedAt)}`)
    .text(`Operador: ${cashSession.user?.fullName || 'N/A'}`)
    .blank()
    .separator('-')

  const opening = Number(cashSession.openingAmount || 0)
  const expected = Number(cashSession.expectedClosingAmount || 0)
  const closing = Number(cashSession.closingAmount || 0)
  const difference = Number(cashSession.differenceAmount || 0)
  const salesTotal = expected - opening

  builder
    .keyValue('Abertura:', formatCurrency(opening))
    .keyValue('Vendas:', formatCurrency(salesTotal))
    .separator('-')
    .keyValue('Esperado:', formatCurrency(expected), { bold: true })
    .keyValue('Informado:', formatCurrency(closing), { bold: true })

  if (difference !== 0) {
    const diffLabel = difference > 0 ? 'Sobra:' : 'Falta:'
    builder
      .separator('-')
      .keyValue(diffLabel, formatCurrency(Math.abs(difference)), { bold: true })
  }

  builder
    .blank(2)
    .separator('=')
    .blank(3)
    .cut()

  return builder.build()
}

export function generateDeliveryReceipt(
  delivery: any,
  config: ReceiptConfig,
  receiptType: 'driver' | 'customer' | 'organizer' = 'customer'
): ReceiptTemplate {
  const builder = new ThermalTemplateBuilder(config.width)
  const width = builder.getWidth()

  renderStoreHeader(builder, config, { uppercase: true })

  const titles: Record<typeof receiptType, string> = {
    driver: 'COMPROVANTE - ENTREGADOR',
    customer: 'COMPROVANTE - CLIENTE',
    organizer: 'COMPROVANTE - ORGANIZADOR'
  }

  builder
    .align('center')
    .text(titles[receiptType], { bold: true, size: 'large' })
    .blank()
    .separator('-')
    .blank()
    .align('left')

  const now = new Date()
  builder
    .text(`Entrega: #${delivery.deliveryNumber || delivery.id || 'N/A'}`, { bold: true })
    .text(`Data: ${formatDateTime(now)}`)

  if (delivery.scheduledFor) {
    builder.text(`Agendado: ${formatDateTime(delivery.scheduledFor)}`)
  }

  builder
    .blank()
    .separator('-')
    .text('CLIENTE', { bold: true })
    .text(delivery.customer?.name || delivery.customerName || 'N/A')

  const customerPhone = delivery.customer?.phone || delivery.customerPhone
  if (customerPhone) {
    builder.text(`Tel: ${customerPhone}`)
  }

  builder
    .blank()
    .separator('-')
    .text('ENDERECO DE ENTREGA', { bold: true })

  const address = delivery.deliveryAddress || delivery.address || ''
  const number = delivery.addressNumber ? `, ${delivery.addressNumber}` : ''
  const complement = delivery.addressComplement
  const district = delivery.district || ''
  const city = delivery.city || ''
  const state = delivery.state || ''

  if (address) {
    builder.text(`${address}${number}`.trim())
  }
  if (complement) {
    builder.text(`Compl: ${complement}`)
  }
  if (district || city || state) {
    builder.text(`${district} - ${city}/${state}`.trim())
  }
  if (delivery.referencePoint) {
    builder.text(`Ref: ${delivery.referencePoint}`)
  }
  if (delivery.deliveryInstructions) {
    builder
      .blank()
      .text('INSTRUCOES:', { bold: true })
      .text(delivery.deliveryInstructions)
  }

  builder.blank().separator('-')

  const items = Array.isArray(delivery.items) ? delivery.items : []
  if (items.length > 0) {
    builder
      .text('ITENS', { bold: true })
      .blank()

    for (const item of items) {
      const itemName = truncateString(item.name || item.product?.name || 'Item', width)
      const quantity = Number(item.quantity || 0)
      const unitPrice = Number(item.price || 0)
      const lineTotal = quantity * unitPrice

      builder
        .text(itemName)
        .columns([
          { text: '', width: 2 },
          { text: `${quantity}x`, width: 6 },
          { text: formatCurrency(unitPrice), width: 12, align: 'right' },
          { text: formatCurrency(lineTotal), align: 'right' }
        ])
        .blank()
    }

    builder.separator('-')
  }

  const subtotal = Number(delivery.subtotal || 0)
  const deliveryFee = Number(delivery.deliveryFee || 0)
  const discountValue = Number(delivery.discountValue || 0)
  const total = Number(delivery.total ?? subtotal + deliveryFee - discountValue)

  if (subtotal > 0) {
    builder.keyValue('Subtotal:', formatCurrency(subtotal))
  }
  builder.keyValue('Taxa de Entrega:', formatCurrency(deliveryFee))
  if (discountValue > 0) {
    builder.keyValue('Desconto:', formatCurrency(-discountValue))
  }

  builder
    .separator('-')
    .keyValue('TOTAL:', formatCurrency(total), { bold: true, size: 'large' })

  if (delivery.paymentMethod) {
    builder
      .blank()
      .text(`Pagamento: ${delivery.paymentMethod}`)

    if (delivery.paidInAdvance) {
      builder.text('** JA PAGO **', { bold: true })
    } else if (delivery.changeFor) {
      const changeFor = Number(delivery.changeFor)
      builder
        .text(`Troco para: ${formatCurrency(changeFor)}`)
        .text(`Troco: ${formatCurrency(changeFor - total)}`)
    }
  }

  if ((receiptType === 'driver' || receiptType === 'organizer') && delivery.driver) {
    builder
      .blank()
      .separator('-')
      .text('ENTREGADOR', { bold: true })
      .text(delivery.driver.name || 'N/A')

    if (delivery.driver.phone) {
      builder.text(`Tel: ${delivery.driver.phone}`)
    }
    if (delivery.driver.vehicleType) {
      builder.text(`Veiculo: ${delivery.driver.vehicleType}`)
    }
  }

  if (delivery.notes) {
    builder
      .blank()
      .separator('-')
      .text('OBS:', { bold: true })
      .text(delivery.notes)
  }

  if (receiptType === 'customer') {
    builder
      .blank(2)
      .separator('-')
      .align('center')
      .text('Assinatura do Recebedor')
      .blank()
      .align('left')
  }

  builder
    .blank()
    .separator('=')
    .align('center')

  if (config.footerMessage) {
    builder.text(config.footerMessage)
  }

  builder
    .blank(3)
    .cut()

  return builder.build()
}

function renderStoreHeader(
  builder: ThermalTemplateBuilder,
  config: ReceiptConfig,
  options?: { uppercase?: boolean; showContacts?: boolean }
): void {
  const title = options?.uppercase === false ? config.storeName : config.storeName.toUpperCase()

  builder
    .align('center')
    .text(title, { bold: true, size: 'large' })
    .blank()

  if (options?.showContacts !== false) {
    if (config.storeDocument) {
      builder.text(`CNPJ: ${config.storeDocument}`)
    }
    if (config.storeAddress) {
      builder.text(config.storeAddress)
    }
    if (config.storePhone) {
      builder.text(`Tel: ${config.storePhone}`)
    }
  }

  builder
    .blank()
    .separator('=')
    .blank()
    .align('left')
}

function getTransactionTitle(type: string): string {
  switch (type) {
    case 'OPENING':
      return 'ABERTURA DE CAIXA'
    case 'SUPPLY':
      return 'SUPRIMENTO'
    case 'WITHDRAWAL':
      return 'SANGRIA'
    case 'ADJUSTMENT':
      return 'AJUSTE DE CAIXA'
    default:
      return 'TRANSACAO DE CAIXA'
  }
}

function normalizeWidth(width?: number): number {
  const value = Number(width) || 0
  if (value >= 24 && value <= 80) {
    return value
  }
  return 48
}

function formatCurrency(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0
  return `R$ ${safeValue.toFixed(2)}`
}

function formatDateTime(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleString('pt-BR', options)
}

function formatColumns(columns: ColumnSpec[], totalWidth: number, gap = 1): string {
  if (!columns.length) return ''

  const safeGap = Math.max(1, gap)
  const totalGapWidth = safeGap * (columns.length - 1)
  const availableWidth = Math.max(1, totalWidth - totalGapWidth)

  const providedWidth = columns
    .filter(col => typeof col.width === 'number')
    .reduce((sum, col) => sum + (col.width || 0), 0)

  let remainingWidth = Math.max(0, availableWidth - providedWidth)
  let unspecifiedColumns = columns.filter(col => col.width === undefined).length

  const resolvedWidths = columns.map((col, index) => {
    if (typeof col.width === 'number' && col.width > 0) {
      return col.width
    }

    if (unspecifiedColumns <= 0) {
      return 1
    }

    const widthShare = unspecifiedColumns === 1
      ? Math.max(1, remainingWidth)
      : Math.max(1, Math.floor(remainingWidth / unspecifiedColumns))

    remainingWidth = Math.max(0, remainingWidth - widthShare)
    unspecifiedColumns -= 1

    return widthShare
  })

  // Distribui largura remanescente (se houver) para a última coluna
  if (remainingWidth > 0 && resolvedWidths.length > 0) {
    resolvedWidths[resolvedWidths.length - 1] += remainingWidth
  }

  const gapString = ' '.repeat(safeGap)

  const formatted = columns.map((col, index) => {
    const targetWidth = Math.max(1, resolvedWidths[index])
    const truncated = truncateString(col.text ?? '', targetWidth)
    const align = col.align || 'left'
    return padString(truncated, targetWidth, ' ', align)
  })

  return formatted.join(gapString).slice(0, totalWidth)
}

function padString(
  str: string,
  length: number,
  char: string = ' ',
  align: 'left' | 'right' | 'center' = 'left'
): string {
  const safeLength = Math.max(0, length)
  const trimmed = str.slice(0, safeLength)

  if (align === 'right') {
    return trimmed.padStart(safeLength, char).slice(-safeLength)
  }

  if (align === 'center') {
    const totalPadding = Math.max(0, safeLength - trimmed.length)
    const leftPadding = Math.floor(totalPadding / 2)
    const rightPadding = totalPadding - leftPadding
    return `${char.repeat(leftPadding)}${trimmed}${char.repeat(rightPadding)}`.slice(0, safeLength)
  }

  return trimmed.padEnd(safeLength, char).slice(0, safeLength)
}

function truncateString(str: string, maxLength: number): string {
  const safeLength = Math.max(0, maxLength)
  if (str.length <= safeLength) return str
  if (safeLength <= 3) return str.slice(0, safeLength)
  return `${str.slice(0, safeLength - 3)}...`
}
