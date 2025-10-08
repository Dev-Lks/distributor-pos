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
}

export function generateSaleReceipt(
  sale: SaleWithItems,
  config: ReceiptConfig
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  
  // Header
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: config.storeName, size: 'large', bold: true })
  commands.push({ type: 'feed', lines: 1 })
  
  if (config.storeDocument) {
    commands.push({ type: 'text', value: `CNPJ: ${config.storeDocument}` })
  }
  
  if (config.storeAddress) {
    commands.push({ type: 'text', value: config.storeAddress })
  }
  
  if (config.storePhone) {
    commands.push({ type: 'text', value: `Tel: ${config.storePhone}` })
  }
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Informações da venda
  commands.push({ type: 'align', value: 'left' })
  commands.push({ type: 'text', value: `Venda #: ${sale.id.slice(-8)}` })
  commands.push({ type: 'text', value: `Data: ${new Date(sale.date).toLocaleString('pt-BR')}` })
  
  if (sale.pointOfSale) {
    commands.push({ type: 'text', value: `PDV: ${sale.pointOfSale.name}` })
  }
  
  if (sale.customerName) {
    commands.push({ type: 'text', value: `Cliente: ${sale.customerName}` })
  }
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '-' })
  
  // Cabeçalho dos produtos
  const itemHeader = padString('ITEM', 20) + padString('QTD', 5) + padString('VALOR', config.width - 25)
  commands.push({ type: 'text', value: itemHeader })
  commands.push({ type: 'separator', char: '-' })
  
  // Produtos
  for (const item of sale.items) {
    const productName = truncateString(item.product.name, config.width - 2)
    commands.push({ type: 'text', value: productName })
    
    const qtyPrice = padString(`${item.quantity}x`, 5) + 
                     padString(`R$ ${item.price.toFixed(2)}`, 12) +
                     padString(`R$ ${(item.quantity * item.price).toFixed(2)}`, config.width - 17)
    commands.push({ type: 'text', value: qtyPrice })
    commands.push({ type: 'feed', lines: 1 })
  }
  
  commands.push({ type: 'separator', char: '-' })
  
  // Totais
  if (sale.subtotal && sale.subtotal !== sale.total) {
    commands.push({ 
      type: 'text', 
      value: padString('SUBTOTAL:', config.width - 15) + padString(`R$ ${sale.subtotal.toFixed(2)}`, 15)
    })
  }
  
  if (sale.discountValue > 0) {
    commands.push({ 
      type: 'text', 
      value: padString('DESCONTO:', config.width - 15) + padString(`-R$ ${sale.discountValue.toFixed(2)}`, 15)
    })
  }
  
  commands.push({ type: 'separator', char: '=' })
  commands.push({ 
    type: 'text', 
    value: padString('TOTAL:', config.width - 15) + padString(`R$ ${sale.total.toFixed(2)}`, 15),
    size: 'large',
    bold: true
  })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Pagamento
  if (sale.paymentMethod) {
    commands.push({ type: 'text', value: `Pagamento: ${sale.paymentMethod}` })
  }
  
  commands.push({ type: 'feed', lines: 2 })
  
  // QR Code
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'qrcode', data: sale.id })
  commands.push({ type: 'feed', lines: 1 })
  
  // Footer
  if (config.footerMessage) {
    commands.push({ type: 'text', value: config.footerMessage })
  } else {
    commands.push({ type: 'text', value: 'Obrigado pela preferência!' })
    commands.push({ type: 'text', value: 'Volte sempre! 😊' })
  }
  
  commands.push({ type: 'feed', lines: 2 })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 3 })
  commands.push({ type: 'cut' })
  
  return { commands }
}

export function generateCashTransactionReceipt(
  transaction: CashTransaction,
  config: ReceiptConfig
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  
  // Header
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: config.storeName, size: 'large', bold: true })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Tipo de transação
  let transactionTitle = ''
  switch (transaction.type) {
    case 'OPENING':
      transactionTitle = 'ABERTURA DE CAIXA'
      break
    case 'SUPPLY':
      transactionTitle = 'SUPRIMENTO'
      break
    case 'WITHDRAWAL':
      transactionTitle = 'SANGRIA'
      break
    case 'ADJUSTMENT':
      transactionTitle = 'AJUSTE DE CAIXA'
      break
    default:
      transactionTitle = 'TRANSAÇÃO DE CAIXA'
  }
  
  commands.push({ type: 'text', value: transactionTitle, size: 'large', bold: true })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Detalhes
  commands.push({ type: 'align', value: 'left' })
  commands.push({ type: 'text', value: `Data: ${new Date(transaction.createdAt).toLocaleString('pt-BR')}` })
  
  if (transaction.performedBy) {
    commands.push({ type: 'text', value: `Operador: ${transaction.performedBy}` })
  }
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '-' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Valor
  commands.push({ type: 'align', value: 'center' })
  commands.push({ 
    type: 'text', 
    value: `R$ ${transaction.amount.toFixed(2)}`,
    size: 'large',
    bold: true
  })
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '-' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Descrição
  if (transaction.description) {
    commands.push({ type: 'align', value: 'left' })
    commands.push({ type: 'text', value: 'Observação:' })
    commands.push({ type: 'text', value: transaction.description })
  }
  
  commands.push({ type: 'feed', lines: 2 })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 3 })
  commands.push({ type: 'cut' })
  
  return { commands }
}

export function generateCashClosingReceipt(
  cashSession: any,
  config: ReceiptConfig
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: config.storeName, size: 'large', bold: true })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'text', value: 'FECHAMENTO DE CAIXA', size: 'large', bold: true })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 1 })
  
  commands.push({ type: 'align', value: 'left' })
  commands.push({ type: 'text', value: `Abertura: ${new Date(cashSession.openedAt).toLocaleString('pt-BR')}` })
  commands.push({ type: 'text', value: `Fechamento: ${new Date(cashSession.closedAt).toLocaleString('pt-BR')}` })
  commands.push({ type: 'text', value: `Operador: ${cashSession.user?.fullName || 'N/A'}` })
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '-' })
  commands.push({ type: 'feed', lines: 1 })
  
  commands.push({ type: 'text', value: padString('Abertura:', config.width - 15) + padString(`R$ ${cashSession.openingAmount.toFixed(2)}`, 15) })
  commands.push({ type: 'text', value: padString('Vendas:', config.width - 15) + padString(`R$ ${(cashSession.expectedClosingAmount - cashSession.openingAmount).toFixed(2)}`, 15) })
  commands.push({ type: 'separator', char: '-' })
  commands.push({ type: 'text', value: padString('Esperado:', config.width - 15) + padString(`R$ ${cashSession.expectedClosingAmount.toFixed(2)}`, 15), bold: true })
  commands.push({ type: 'text', value: padString('Informado:', config.width - 15) + padString(`R$ ${cashSession.closingAmount.toFixed(2)}`, 15), bold: true })
  
  if (cashSession.differenceAmount !== 0) {
    const diffLabel = cashSession.differenceAmount > 0 ? 'Sobra:' : 'Falta:'
    commands.push({ type: 'separator', char: '-' })
    commands.push({ type: 'text', value: padString(diffLabel, config.width - 15) + padString(`R$ ${Math.abs(cashSession.differenceAmount).toFixed(2)}`, 15), bold: true })
  }
  
  commands.push({ type: 'feed', lines: 2 })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 3 })
  commands.push({ type: 'cut' })
  
  return { commands }
}

// Funções auxiliares
function padString(str: string, length: number, char: string = ' '): string {
  return str.padEnd(length, char).slice(0, length)
}

function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}
