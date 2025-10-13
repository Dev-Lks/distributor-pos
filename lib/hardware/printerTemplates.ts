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

export function generateSaleReceipt(
  sale: SaleWithItems,
  config: ReceiptConfig
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  const lineWidth = config.width || 48
  
  // Header - Centralizado e bem formatado
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: config.storeName.toUpperCase(), size: 'large', bold: true })
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
  // Separador com largura exata
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Informações da venda
  commands.push({ type: 'align', value: 'left' })
  commands.push({ type: 'text', value: `CUPOM NAO-FISCAL` })
  commands.push({ type: 'text', value: `Venda #${sale.id.slice(-8).toUpperCase()}` })
  commands.push({ type: 'text', value: `Data: ${new Date(sale.date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}` })
  
  if (sale.pointOfSale) {
    commands.push({ type: 'text', value: `PDV: ${sale.pointOfSale.name}` })
  }
  
  if (sale.customerName) {
    commands.push({ type: 'text', value: `Cliente: ${sale.customerName}` })
  }
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '-' })
  
  // Cabeçalho dos produtos - Melhor formatado
  commands.push({ type: 'text', value: padString('ITEM', 20) + ' ' + padString('QTD', 4, ' ') + ' ' + padString('TOTAL', lineWidth - 26) })
  commands.push({ type: 'separator', char: '-' })
  
  // Produtos - Com melhor formatação
  for (const item of sale.items) {
    const productName = truncateString(item.product.name, lineWidth - 2)
    commands.push({ type: 'text', value: productName })
    
    const qtyText = `${item.quantity}x`
    const priceText = `R$ ${item.price.toFixed(2)}`
    const totalText = `R$ ${(item.quantity * item.price).toFixed(2)}`
    
    const itemLine = '  ' + padString(qtyText, 5) + ' ' + 
                     padString(priceText, 12) + ' ' + 
                     padString(totalText, lineWidth - 20, ' ', 'right')
    commands.push({ type: 'text', value: itemLine })
    commands.push({ type: 'feed', lines: 1 })
  }
  
  commands.push({ type: 'separator', char: '-' })
  
  // Totais - Melhor alinhamento
  if (sale.subtotal && sale.subtotal !== sale.total) {
    commands.push({ 
      type: 'text', 
      value: padString('Subtotal:', lineWidth - 15) + padString(`R$ ${sale.subtotal.toFixed(2)}`, 15, ' ', 'right')
    })
  }
  
  if (sale.discountValue > 0) {
    commands.push({ 
      type: 'text', 
      value: padString('Desconto:', lineWidth - 15) + padString(`-R$ ${sale.discountValue.toFixed(2)}`, 15, ' ', 'right')
    })
  }
  
  commands.push({ type: 'separator', char: '=' })
  commands.push({ 
    type: 'text', 
    value: padString('TOTAL:', lineWidth - 15) + padString(`R$ ${sale.total.toFixed(2)}`, 15, ' ', 'right'),
    size: 'large',
    bold: true
  })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Pagamento
  if (sale.paymentMethod) {
    const paymentMap: Record<string, string> = {
      'cash': 'Dinheiro',
      'card': 'Cartão',
      'pix': 'PIX',
      'debit': 'Cartão Débito',
      'credit': 'Cartão Crédito',
    }
    commands.push({ 
      type: 'text', 
      value: `Forma de Pagamento: ${paymentMap[sale.paymentMethod] || sale.paymentMethod}` 
    })
  }
  
  commands.push({ type: 'feed', lines: 2 })
  
  // QR Code (se configurado)
  if (config.showQRCode !== false) {
    commands.push({ type: 'align', value: 'center' })
    commands.push({ type: 'text', value: 'Consulte sua venda:' })
    commands.push({ type: 'feed', lines: 1 })
    commands.push({ type: 'qrcode', data: sale.id })
    commands.push({ type: 'feed', lines: 1 })
  }
  
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

export function generateDeliveryReceipt(
  delivery: any,
  config: ReceiptConfig,
  receiptType: 'driver' | 'customer' | 'organizer' = 'customer'
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  const lineWidth = config.width || 48
  
  // Header
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: config.storeName.toUpperCase(), size: 'large', bold: true })
  commands.push({ type: 'feed', lines: 1 })
  
  if (config.storeAddress) {
    commands.push({ type: 'text', value: config.storeAddress })
  }
  if (config.storePhone) {
    commands.push({ type: 'text', value: `Tel: ${config.storePhone}` })
  }
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '=' })
  
  // Tipo de comprovante
  const titles: Record<typeof receiptType, string> = {
    driver: 'COMPROVANTE - ENTREGADOR',
    customer: 'COMPROVANTE - CLIENTE',
    organizer: 'COMPROVANTE - ORGANIZADOR'
  }
  
  commands.push({ type: 'text', value: titles[receiptType], size: 'large', bold: true })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '-' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Informações da Entrega
  commands.push({ type: 'align', value: 'left' })
  commands.push({ type: 'text', value: `Entrega: #${delivery.deliveryNumber || delivery.id}`, bold: true })
  commands.push({ type: 'text', value: `Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}` })
  
  if (delivery.scheduledFor) {
    commands.push({ type: 'text', value: `Agendado: ${new Date(delivery.scheduledFor).toLocaleString('pt-BR')}` })
  }
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '-' })
  
  // Cliente
  commands.push({ type: 'text', value: 'CLIENTE', bold: true })
  commands.push({ type: 'text', value: delivery.customer?.name || delivery.customerName || 'N/A' })
  
  const phone = delivery.customer?.phone || delivery.customerPhone
  if (phone) {
    commands.push({ type: 'text', value: `Tel: ${phone}` })
  }
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '-' })
  
  // Endereço de Entrega
  commands.push({ type: 'text', value: 'ENDERECO DE ENTREGA', bold: true })
  
  const address = delivery.deliveryAddress || delivery.address || ''
  const number = delivery.addressNumber || ''
  const complement = delivery.addressComplement || ''
  const district = delivery.district || ''
  const city = delivery.city || ''
  const state = delivery.state || ''
  
  commands.push({ type: 'text', value: `${address}${number ? ', ' + number : ''}` })
  if (complement) {
    commands.push({ type: 'text', value: `Compl: ${complement}` })
  }
  commands.push({ type: 'text', value: `${district} - ${city}/${state}` })
  
  if (delivery.referencePoint) {
    commands.push({ type: 'text', value: `Ref: ${delivery.referencePoint}` })
  }
  
  if (delivery.deliveryInstructions) {
    commands.push({ type: 'feed', lines: 1 })
    commands.push({ type: 'text', value: 'INSTRUCOES:', bold: true })
    commands.push({ type: 'text', value: delivery.deliveryInstructions })
  }
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '-' })
  
  // Items (se houver)
  if (delivery.items && delivery.items.length > 0) {
    commands.push({ type: 'text', value: 'ITENS', bold: true })
    commands.push({ type: 'feed', lines: 1 })
    
    delivery.items.forEach((item: any) => {
      const itemName = truncateString(item.name || item.product?.name || 'Item', lineWidth - 12)
      const qty = `${item.quantity}x`
      const price = `R$ ${(item.price * item.quantity).toFixed(2)}`
      
      commands.push({ type: 'text', value: `${qty} ${itemName}` })
      commands.push({ type: 'text', value: `    ${price}`, align: 'right' })
    })
    
    commands.push({ type: 'feed', lines: 1 })
    commands.push({ type: 'separator', char: '-' })
  }
  
  // Valores
  commands.push({ type: 'text', value: 'VALORES', bold: true })
  commands.push({ type: 'feed', lines: 1 })
  
  const subtotal = delivery.subtotal || 0
  const deliveryFee = delivery.deliveryFee || 0
  const discount = delivery.discountValue || 0
  const total = delivery.total || (subtotal + deliveryFee - discount)
  
  const createValueLine = (label: string, value: number) => {
    const valueStr = `R$ ${value.toFixed(2)}`
    const spaces = lineWidth - label.length - valueStr.length
    return label + ' '.repeat(Math.max(1, spaces)) + valueStr
  }
  
  if (subtotal > 0) {
    commands.push({ type: 'text', value: createValueLine('Subtotal:', subtotal) })
  }
  commands.push({ type: 'text', value: createValueLine('Taxa de Entrega:', deliveryFee) })
  if (discount > 0) {
    commands.push({ type: 'text', value: createValueLine('Desconto:', -discount) })
  }
  
  commands.push({ type: 'separator', char: '-' })
  commands.push({ type: 'text', value: createValueLine('TOTAL:', total), bold: true, size: 'large' })
  
  // Forma de pagamento
  if (delivery.paymentMethod) {
    commands.push({ type: 'feed', lines: 1 })
    commands.push({ type: 'text', value: `Pagamento: ${delivery.paymentMethod}` })
    
    if (delivery.paidInAdvance) {
      commands.push({ type: 'text', value: '** JA PAGO **', bold: true })
    } else if (delivery.changeFor) {
      commands.push({ type: 'text', value: `Troco para: R$ ${delivery.changeFor.toFixed(2)}` })
      commands.push({ type: 'text', value: `Troco: R$ ${(delivery.changeFor - total).toFixed(2)}` })
    }
  }
  
  // Entregador (para comprovante do motorista e organizador)
  if ((receiptType === 'driver' || receiptType === 'organizer') && delivery.driver) {
    commands.push({ type: 'feed', lines: 1 })
    commands.push({ type: 'separator', char: '-' })
    commands.push({ type: 'text', value: 'ENTREGADOR', bold: true })
    commands.push({ type: 'text', value: delivery.driver.name || 'N/A' })
    if (delivery.driver.phone) {
      commands.push({ type: 'text', value: `Tel: ${delivery.driver.phone}` })
    }
    if (delivery.driver.vehicleType) {
      commands.push({ type: 'text', value: `Veiculo: ${delivery.driver.vehicleType}` })
    }
  }
  
  // Observações
  if (delivery.notes) {
    commands.push({ type: 'feed', lines: 1 })
    commands.push({ type: 'separator', char: '-' })
    commands.push({ type: 'text', value: 'OBS:', bold: true })
    commands.push({ type: 'text', value: delivery.notes })
  }
  
  // Assinatura (para comprovante do cliente)
  if (receiptType === 'customer') {
    commands.push({ type: 'feed', lines: 2 })
    commands.push({ type: 'separator', char: '-' })
    commands.push({ type: 'align', value: 'center' })
    commands.push({ type: 'text', value: 'Assinatura do Recebedor' })
    commands.push({ type: 'feed', lines: 1 })
  }
  
  // Footer
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '=' })
  commands.push({ type: 'align', value: 'center' })
  
  if (config.footerMessage) {
    commands.push({ type: 'text', value: config.footerMessage })
  }
  
  commands.push({ type: 'feed', lines: 3 })
  commands.push({ type: 'cut' })
  
  return { commands }
}

// Funções auxiliares
function padString(str: string, length: number, char: string = ' ', align: 'left' | 'right' = 'left'): string {
  if (align === 'right') {
    return str.padStart(length, char).slice(-length)
  }
  return str.padEnd(length, char).slice(0, length)
}

function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}
