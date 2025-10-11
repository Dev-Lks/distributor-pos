// Templates de Recibos Prontos para Usar
// Copie e cole em lib/hardware/printerTemplates.ts

import { ReceiptTemplate, PrintCommand } from './types'
import type { Sale, SaleItem, Product } from '@prisma/client'

interface SaleWithItems extends Sale {
  items: (SaleItem & { product: Product })[]
  pointOfSale?: { name: string; address?: string } | null
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

// ============================================================================
// TEMPLATE 1: MODERNO E MINIMALISTA
// ============================================================================
export function generateModernReceipt(
  sale: SaleWithItems,
  config: ReceiptConfig
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  
  // Header minimalista
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: config.storeName.toUpperCase(), size: 'large', bold: true })
  commands.push({ type: 'text', value: config.storeAddress || '' })
  commands.push({ type: 'text', value: config.storePhone || '' })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '━' })
  
  // Info da venda
  commands.push({ type: 'align', value: 'left' })
  commands.push({ type: 'text', value: `Pedido  ${sale.id.slice(-8).toUpperCase()}` })
  commands.push({ type: 'text', value: `Data    ${new Date(sale.date).toLocaleDateString('pt-BR')} ${new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` })
  if (sale.customerName) {
    commands.push({ type: 'text', value: `Cliente ${sale.customerName}` })
  }
  commands.push({ type: 'separator', char: '━' })
  
  // Produtos
  for (const item of sale.items) {
    commands.push({ type: 'text', value: item.product.name })
    const line = `${item.quantity}x R$ ${item.price.toFixed(2)}`.padEnd(config.width - 15) + 
                 `R$ ${(item.quantity * item.price).toFixed(2)}`.padStart(15)
    commands.push({ type: 'text', value: line })
    commands.push({ type: 'feed', lines: 1 })
  }
  
  commands.push({ type: 'separator', char: '━' })
  commands.push({ 
    type: 'text', 
    value: 'TOTAL'.padEnd(config.width - 15) + `R$ ${sale.total.toFixed(2)}`.padStart(15),
    size: 'large',
    bold: true
  })
  commands.push({ type: 'separator', char: '━' })
  
  // Footer
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'qrcode', data: sale.id })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'text', value: 'Obrigado!' })
  commands.push({ type: 'feed', lines: 3 })
  commands.push({ type: 'cut' })
  
  return { commands }
}

// ============================================================================
// TEMPLATE 2: TRADICIONAL COM BORDA
// ============================================================================
export function generateTraditionalReceipt(
  sale: SaleWithItems,
  config: ReceiptConfig
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  
  // Borda superior
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: '╔' + '═'.repeat(config.width - 2) + '╗' })
  commands.push({ type: 'text', value: '║' + config.storeName.padStart((config.width + config.storeName.length - 2) / 2).padEnd(config.width - 2) + '║', bold: true })
  commands.push({ type: 'text', value: '╠' + '═'.repeat(config.width - 2) + '╣' })
  
  // Dados da loja
  if (config.storeDocument) {
    commands.push({ type: 'text', value: '║ ' + `CNPJ: ${config.storeDocument}`.padEnd(config.width - 3) + '║' })
  }
  if (config.storeAddress) {
    commands.push({ type: 'text', value: '║ ' + config.storeAddress.padEnd(config.width - 3) + '║' })
  }
  if (config.storePhone) {
    commands.push({ type: 'text', value: '║ ' + `Tel: ${config.storePhone}`.padEnd(config.width - 3) + '║' })
  }
  
  commands.push({ type: 'text', value: '╠' + '═'.repeat(config.width - 2) + '╣' })
  
  // Venda
  commands.push({ type: 'align', value: 'left' })
  commands.push({ type: 'text', value: '║ ' + `Venda: #${sale.id.slice(-8)}`.padEnd(config.width - 3) + '║' })
  commands.push({ type: 'text', value: '║ ' + `Data: ${new Date(sale.date).toLocaleString('pt-BR')}`.padEnd(config.width - 3) + '║' })
  
  commands.push({ type: 'text', value: '╠' + '═'.repeat(config.width - 2) + '╣' })
  
  // Produtos
  for (const item of sale.items) {
    const name = item.product.name.substring(0, config.width - 4)
    commands.push({ type: 'text', value: '║ ' + name.padEnd(config.width - 3) + '║' })
    
    const detail = `  ${item.quantity}x R$ ${item.price.toFixed(2)} = R$ ${(item.quantity * item.price).toFixed(2)}`
    commands.push({ type: 'text', value: '║ ' + detail.padEnd(config.width - 3) + '║' })
  }
  
  commands.push({ type: 'text', value: '╠' + '═'.repeat(config.width - 2) + '╣' })
  
  // Total
  const totalLine = `TOTAL: R$ ${sale.total.toFixed(2)}`
  commands.push({ type: 'text', value: '║ ' + totalLine.padStart((config.width + totalLine.length - 2) / 2).padEnd(config.width - 3) + '║', bold: true })
  
  commands.push({ type: 'text', value: '╚' + '═'.repeat(config.width - 2) + '╝' })
  
  // Footer
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'text', value: 'Obrigado pela preferência!' })
  commands.push({ type: 'feed', lines: 3 })
  commands.push({ type: 'cut' })
  
  return { commands }
}

// ============================================================================
// TEMPLATE 3: DIVERTIDO COM EMOJIS
// ============================================================================
export function generateFunReceipt(
  sale: SaleWithItems,
  config: ReceiptConfig
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  
  // Header divertido
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: '🍺🍺🍺🍺🍺🍺🍺🍺' })
  commands.push({ type: 'text', value: config.storeName, size: 'large', bold: true })
  commands.push({ type: 'text', value: '🍺🍺🍺🍺🍺🍺🍺🍺' })
  commands.push({ type: 'feed', lines: 1 })
  
  // Info
  commands.push({ type: 'align', value: 'left' })
  commands.push({ type: 'text', value: `🛒 Pedido: #${sale.id.slice(-8)}` })
  commands.push({ type: 'text', value: `📅 ${new Date(sale.date).toLocaleDateString('pt-BR')}` })
  commands.push({ type: 'text', value: `⏰ ${new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` })
  if (sale.customerName) {
    commands.push({ type: 'text', value: `👤 ${sale.customerName}` })
  }
  commands.push({ type: 'separator', char: '━' })
  
  // Produtos com emoji
  for (const item of sale.items) {
    commands.push({ type: 'text', value: `🍺 ${item.product.name}` })
    commands.push({ type: 'text', value: `   ${item.quantity}x R$ ${item.price.toFixed(2)} = R$ ${(item.quantity * item.price).toFixed(2)}` })
    commands.push({ type: 'feed', lines: 1 })
  }
  
  commands.push({ type: 'separator', char: '━' })
  
  // Total
  commands.push({ type: 'align', value: 'center' })
  commands.push({ 
    type: 'text', 
    value: `💰 TOTAL: R$ ${sale.total.toFixed(2)} 💰`,
    size: 'large',
    bold: true
  })
  commands.push({ type: 'separator', char: '━' })
  
  // Mensagem divertida
  const funMessages = [
    '🎉 Saúde e aproveite!',
    '😎 Você tem bom gosto!',
    '🌟 Excelente escolha!',
    '🎊 Que delícia!',
    '🥳 Salve, salve!',
  ]
  const randomMsg = funMessages[Math.floor(Math.random() * funMessages.length)]
  commands.push({ type: 'text', value: randomMsg, bold: true })
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'text', value: '⚠️ Beba com moderação ⚠️' })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'text', value: '❤️ Volte sempre! ❤️' })
  
  commands.push({ type: 'feed', lines: 3 })
  commands.push({ type: 'cut' })
  
  return { commands }
}

// ============================================================================
// TEMPLATE 4: PROFISSIONAL COM NOTA FISCAL
// ============================================================================
export function generateProfessionalReceipt(
  sale: SaleWithItems,
  config: ReceiptConfig
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  
  // Cabeçalho profissional
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
  commands.push({ type: 'text', value: 'CUPOM FISCAL NÃO FISCAL', bold: true })
  commands.push({ type: 'text', value: `Documento: ${sale.id.slice(-8).toUpperCase()}` })
  commands.push({ type: 'separator', char: '=' })
  
  // Dados da venda
  commands.push({ type: 'align', value: 'left' })
  const date = new Date(sale.date)
  commands.push({ type: 'text', value: `Data de Emissão: ${date.toLocaleDateString('pt-BR')}` })
  commands.push({ type: 'text', value: `Hora de Emissão: ${date.toLocaleTimeString('pt-BR')}` })
  
  if (sale.pointOfSale) {
    commands.push({ type: 'text', value: `Ponto de Venda: ${sale.pointOfSale.name}` })
  }
  
  if (sale.customerName) {
    commands.push({ type: 'text', value: `Cliente: ${sale.customerName}` })
  }
  
  commands.push({ type: 'separator', char: '=' })
  
  // Tabela de produtos
  const header = 'ITEM'.padEnd(4) + 'DESCRICAO'.padEnd(20) + 'QTD'.padEnd(5) + 'VL UNIT'.padEnd(10) + 'VL TOTAL'
  commands.push({ type: 'text', value: header, bold: true })
  commands.push({ type: 'separator', char: '-' })
  
  sale.items.forEach((item, index) => {
    const line1 = `${(index + 1).toString().padEnd(4)}${item.product.name.substring(0, 20).padEnd(20)}`
    commands.push({ type: 'text', value: line1 })
    
    const line2 = ''.padEnd(4) + 
                  ''.padEnd(20) +
                  item.quantity.toString().padEnd(5) +
                  `R$ ${item.price.toFixed(2)}`.padEnd(10) +
                  `R$ ${(item.quantity * item.price).toFixed(2)}`
    commands.push({ type: 'text', value: line2 })
    commands.push({ type: 'feed', lines: 1 })
  })
  
  commands.push({ type: 'separator', char: '-' })
  
  // Totais
  if (sale.subtotal && sale.subtotal !== sale.total) {
    commands.push({ type: 'text', value: `Subtotal:`.padEnd(config.width - 15) + `R$ ${sale.subtotal.toFixed(2)}`.padStart(15) })
  }
  
  if (sale.discountValue > 0) {
    commands.push({ type: 'text', value: `Desconto:`.padEnd(config.width - 15) + `R$ ${sale.discountValue.toFixed(2)}`.padStart(15) })
  }
  
  commands.push({ type: 'separator', char: '=' })
  commands.push({ 
    type: 'text', 
    value: `VALOR TOTAL:`.padEnd(config.width - 15) + `R$ ${sale.total.toFixed(2)}`.padStart(15),
    size: 'large',
    bold: true
  })
  commands.push({ type: 'separator', char: '=' })
  
  // Forma de pagamento
  if (sale.paymentMethod) {
    const paymentMap: Record<string, string> = {
      'cash': 'Dinheiro',
      'card': 'Cartão',
      'pix': 'PIX',
      'debit': 'Cartão de Débito',
      'credit': 'Cartão de Crédito',
    }
    commands.push({ type: 'text', value: `Forma de Pagamento: ${paymentMap[sale.paymentMethod] || sale.paymentMethod}` })
  }
  
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'separator', char: '=' })
  
  // QR Code
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: 'Consulte este documento em:' })
  commands.push({ type: 'feed', lines: 1 })
  commands.push({ type: 'qrcode', data: sale.id })
  commands.push({ type: 'feed', lines: 1 })
  
  // Footer
  commands.push({ type: 'text', value: 'Este não é um documento fiscal' })
  commands.push({ type: 'text', value: 'Obrigado pela preferência!' })
  
  commands.push({ type: 'feed', lines: 3 })
  commands.push({ type: 'cut' })
  
  return { commands }
}

// ============================================================================
// TEMPLATE 5: COMPACTO (ECONOMIZA PAPEL)
// ============================================================================
export function generateCompactReceipt(
  sale: SaleWithItems,
  config: ReceiptConfig
): ReceiptTemplate {
  const commands: PrintCommand[] = []
  
  // Header compacto
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: config.storeName, bold: true })
  commands.push({ type: 'text', value: `#${sale.id.slice(-8)} | ${new Date(sale.date).toLocaleDateString('pt-BR')} ${new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` })
  commands.push({ type: 'separator', char: '-' })
  
  // Produtos compactos
  commands.push({ type: 'align', value: 'left' })
  for (const item of sale.items) {
    const line = `${item.quantity}x ${item.product.name.substring(0, config.width - 20)} R$ ${(item.quantity * item.price).toFixed(2)}`
    commands.push({ type: 'text', value: line })
  }
  
  commands.push({ type: 'separator', char: '-' })
  
  // Total
  commands.push({ type: 'align', value: 'right' })
  commands.push({ type: 'text', value: `TOTAL: R$ ${sale.total.toFixed(2)}`, bold: true })
  
  // Footer minimo
  commands.push({ type: 'align', value: 'center' })
  commands.push({ type: 'text', value: 'Obrigado!' })
  commands.push({ type: 'feed', lines: 2 })
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

// ============================================================================
// EXPORTAR O TEMPLATE QUE VOCÊ QUER USAR
// ============================================================================

// Descomente a linha do template que você quer usar:

// export const generateSaleReceipt = generateModernReceipt
// export const generateSaleReceipt = generateTraditionalReceipt
// export const generateSaleReceipt = generateFunReceipt
export const generateSaleReceipt = generateProfessionalReceipt
// export const generateSaleReceipt = generateCompactReceipt
