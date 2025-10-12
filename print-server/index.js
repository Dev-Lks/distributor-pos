const express = require('express')
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer')
const cors = require('cors')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// Configurar impressora
let printer = null
let printerConfig = {
  type: PrinterTypes.EPSON,
  interface: process.env.PRINTER_PORT || '/dev/usb/lp0',
  width: parseInt(process.env.PRINTER_WIDTH) || 48,
  characterSet: 'BRAZIL',
  removeSpecialCharacters: false,
  lineCharacter: '-',
}

function initPrinter() {
  try {
    printer = new ThermalPrinter(printerConfig)
    console.log('✅ Impressora configurada:', printerConfig.interface)
    return true
  } catch (error) {
    console.error('❌ Erro ao configurar impressora:', error.message)
    return false
  }
}

// Inicializar impressora
initPrinter()

// Middleware de autenticação
function authenticate(req, res, next) {
  const authToken = req.headers.authorization?.replace('Bearer ', '') || req.body.authToken
  
  if (!authToken || authToken !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Token inválido' 
    })
  }
  
  next()
}

// ==================== ROTAS ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
  })
})

// Status da impressora
app.get('/api/printer/status', async (req, res) => {
  try {
    if (!printer) {
      return res.json({
        success: true,
        connected: false,
        online: false,
        paperStatus: 'unknown',
        error: 'Impressora não inicializada',
      })
    }
    
    const isConnected = await printer.isPrinterConnected()
    
    res.json({
      success: true,
      connected: isConnected,
      online: isConnected,
      paperStatus: isConnected ? 'ok' : 'unknown',
      config: {
        port: printerConfig.interface,
        width: printerConfig.width,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    res.json({
      success: true,
      connected: false,
      online: false,
      paperStatus: 'out',
      error: error.message,
    })
  }
})

// Configurar impressora
app.post('/api/printer/configure', authenticate, async (req, res) => {
  try {
    const { port, width, type } = req.body
    
    if (port) printerConfig.interface = port
    if (width) printerConfig.width = width
    if (type) printerConfig.type = PrinterTypes[type] || PrinterTypes.EPSON
    
    // Reinicializar
    const success = initPrinter()
    
    res.json({
      success,
      message: success ? 'Impressora reconfigurada' : 'Erro ao configurar',
      config: printerConfig,
    })
  } catch (error) {
    console.error('Erro ao configurar:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// Imprimir
app.post('/api/printer/print', authenticate, async (req, res) => {
  try {
    if (!printer) {
      return res.status(503).json({
        success: false,
        error: 'Impressora não disponível',
      })
    }
    
    const { template } = req.body
    
    if (!template || !template.commands) {
      return res.status(400).json({
        success: false,
        error: 'Template inválido - "commands" é obrigatório',
      })
    }
    
    // Limpar buffer
    printer.clear()
    
    // Processar comandos
    for (const cmd of template.commands) {
      await processCommand(printer, cmd)
    }
    
    // Executar impressão
    await printer.execute()
    
    console.log('✅ Impressão realizada com sucesso')
    
    res.json({
      success: true,
      message: 'Impresso com sucesso',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Erro ao imprimir:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// Teste de impressão
app.post('/api/printer/test', authenticate, async (req, res) => {
  try {
    if (!printer) {
      return res.status(503).json({
        success: false,
        error: 'Impressora não disponível',
      })
    }
    
    printer.clear()
    printer.alignCenter()
    printer.bold(true)
    printer.setTextDoubleHeight()
    printer.println('TESTE DE IMPRESSÃO')
    printer.setTextNormal()
    printer.bold(false)
    printer.newLine()
    printer.alignLeft()
    printer.println('Se você está lendo isso,')
    printer.println('sua impressora está funcionando!')
    printer.newLine()
    printer.println('=' .repeat(printerConfig.width))
    printer.println(`Data: ${new Date().toLocaleString('pt-BR')}`)
    printer.println(`Porta: ${printerConfig.interface}`)
    printer.println(`Largura: ${printerConfig.width} caracteres`)
    printer.println('=' .repeat(printerConfig.width))
    printer.newLine()
    printer.newLine()
    printer.newLine()
    printer.cut()
    
    await printer.execute()
    
    console.log('✅ Teste de impressão realizado')
    
    res.json({
      success: true,
      message: 'Teste impresso com sucesso',
    })
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// ==================== FUNÇÕES AUXILIARES ====================

async function processCommand(printer, cmd) {
  switch (cmd.type) {
    case 'align':
      if (cmd.value === 'center') printer.alignCenter()
      else if (cmd.value === 'right') printer.alignRight()
      else printer.alignLeft()
      break
      
    case 'text':
      if (cmd.bold) printer.bold(true)
      
      if (cmd.size === 'large') {
        printer.setTextDoubleHeight()
        printer.setTextDoubleWidth()
      } else if (cmd.size === 'small') {
        printer.setTextNormal()
      }
      
      printer.println(cmd.value || '')
      
      if (cmd.bold) printer.bold(false)
      if (cmd.size === 'large') printer.setTextNormal()
      break
      
    case 'feed':
      const lines = cmd.lines || 1
      for (let i = 0; i < lines; i++) {
        printer.newLine()
      }
      break
      
    case 'separator':
      const char = cmd.char || '-'
      printer.println(char.repeat(printerConfig.width))
      break
      
    case 'qrcode':
      if (cmd.data) {
        printer.printQR(cmd.data, {
          cellSize: 6,
          correction: 'M',
          model: 2,
        })
      }
      break
      
    case 'barcode':
      if (cmd.data) {
        printer.printBarcode(cmd.data)
      }
      break
      
    case 'cut':
      printer.cut()
      break
      
    default:
      console.warn('Comando desconhecido:', cmd.type)
  }
}

// ==================== IMPRESSÃO DE DELIVERY ====================

app.post('/print', async (req, res) => {
  try {
    if (!printer) {
      return res.status(503).json({
        success: false,
        error: 'Impressora não disponível',
      })
    }
    
    const { type, data } = req.body
    
    if (type === 'delivery' && data) {
      await printDelivery(data)
      
      return res.json({
        success: true,
        message: 'Comprovante de entrega impresso com sucesso',
      })
    }
    
    return res.status(400).json({
      success: false,
      error: 'Tipo de impressão não suportado',
    })
  } catch (error) {
    console.error('❌ Erro ao imprimir:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

async function printDelivery(data) {
  printer.clear()
  
  // Cabeçalho
  printer.alignCenter()
  printer.bold(true)
  printer.setTextDoubleHeight()
  printer.println(data.header.title)
  printer.setTextNormal()
  printer.bold(false)
  printer.newLine()
  
  printer.println(`#${data.header.deliveryNumber}`)
  printer.println(data.header.date)
  printer.newLine()
  
  // Status
  printer.bold(true)
  printer.println(`Status: ${data.header.status}`)
  printer.bold(false)
  printer.drawLine()
  printer.newLine()
  
  // Cliente
  printer.alignLeft()
  printer.bold(true)
  printer.println('CLIENTE')
  printer.bold(false)
  printer.println(data.customer.name)
  if (data.customer.phone) {
    printer.println(`Tel: ${data.customer.phone}`)
  }
  printer.newLine()
  
  // Endereço
  printer.bold(true)
  printer.println('ENDERECO DE ENTREGA')
  printer.bold(false)
  printer.println(`${data.address.street}, ${data.address.number}`)
  if (data.address.complement) {
    printer.println(data.address.complement)
  }
  printer.println(`${data.address.district}`)
  printer.println(`${data.address.city} - ${data.address.state}`)
  if (data.address.postalCode) {
    printer.println(`CEP: ${data.address.postalCode}`)
  }
  
  if (data.address.reference) {
    printer.newLine()
    printer.println(`Ref: ${data.address.reference}`)
  }
  
  if (data.address.instructions) {
    printer.newLine()
    printer.bold(true)
    printer.println('INSTRUCOES:')
    printer.bold(false)
    printer.println(data.address.instructions)
  }
  
  printer.drawLine()
  printer.newLine()
  
  // Itens
  if (data.items && data.items.length > 0) {
    printer.bold(true)
    printer.println('PRODUTOS')
    printer.bold(false)
    printer.newLine()
    
    data.items.forEach((item) => {
      printer.println(`${item.quantity}x ${item.name}`)
      printer.tableCustom([
        { text: `  R$ ${item.unitPrice.toFixed(2)}`, align: 'LEFT', width: 0.5 },
        { text: `R$ ${item.totalPrice.toFixed(2)}`, align: 'RIGHT', width: 0.5 }
      ])
      
      if (item.discount > 0) {
        printer.println(`  Desconto: -R$ ${item.discount.toFixed(2)}`)
      }
    })
    
    printer.drawLine()
    printer.newLine()
  }
  
  // Resumo Financeiro
  printer.tableCustom([
    { text: 'Subtotal:', align: 'LEFT', width: 0.6 },
    { text: `R$ ${data.financial.subtotal.toFixed(2)}`, align: 'RIGHT', width: 0.4 }
  ])
  
  if (data.financial.discountValue > 0) {
    printer.tableCustom([
      { text: 'Desconto:', align: 'LEFT', width: 0.6 },
      { text: `-R$ ${data.financial.discountValue.toFixed(2)}`, align: 'RIGHT', width: 0.4 }
    ])
  }
  
  printer.tableCustom([
    { text: 'Taxa de Entrega:', align: 'LEFT', width: 0.6 },
    { text: `R$ ${data.financial.deliveryFee.toFixed(2)}`, align: 'RIGHT', width: 0.4 }
  ])
  
  printer.drawLine()
  
  printer.bold(true)
  printer.setTextDoubleHeight()
  printer.tableCustom([
    { text: 'TOTAL:', align: 'LEFT', width: 0.6 },
    { text: `R$ ${data.financial.total.toFixed(2)}`, align: 'RIGHT', width: 0.4 }
  ])
  printer.setTextNormal()
  printer.bold(false)
  
  printer.drawLine()
  printer.newLine()
  
  // Pagamento
  if (data.payment.method) {
    printer.println(`Pagamento: ${data.payment.method}`)
    if (data.payment.paidInAdvance) {
      printer.println('✓ PAGO ANTECIPADAMENTE')
    }
    if (data.payment.changeFor) {
      printer.println(`Troco para: R$ ${data.payment.changeFor.toFixed(2)}`)
    }
    printer.newLine()
  }
  
  // Agendamento
  if (data.scheduledFor) {
    printer.bold(true)
    printer.println('AGENDAMENTO:')
    printer.bold(false)
    printer.println(data.scheduledFor)
    printer.newLine()
  }
  
  // Observações
  if (data.notes) {
    printer.bold(true)
    printer.println('OBSERVACOES:')
    printer.bold(false)
    printer.println(data.notes)
    printer.newLine()
  }
  
  // Rodapé
  printer.drawLine()
  printer.alignCenter()
  printer.println(`Impresso por: ${data.footer.createdBy}`)
  printer.println(data.footer.printedAt)
  printer.newLine()
  printer.newLine()
  
  // Cortar papel
  printer.cut()
  
  // Executar
  await printer.execute()
  console.log('✅ Comprovante de entrega impresso')
}

// ==================== SERVIDOR ====================

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════╗')
  console.log('║   🖨️  SERVIDOR DE IMPRESSÃO        ║')
  console.log('╠═══════════════════════════════════════╣')
  console.log(`║   Porta: ${PORT.toString().padEnd(28)}║`)
  console.log(`║   Impressora: ${printerConfig.interface.substring(0, 20).padEnd(20)}║`)
  console.log(`║   Status: ${printer ? 'Pronta ✅'.padEnd(25) : 'Erro ❌'.padEnd(25)}║`)
  console.log('╚═══════════════════════════════════════╝')
  console.log('')
  console.log('📡 Endpoints disponíveis:')
  console.log(`   GET  http://localhost:${PORT}/api/health`)
  console.log(`   GET  http://localhost:${PORT}/api/printer/status`)
  console.log(`   POST http://localhost:${PORT}/api/printer/configure`)
  console.log(`   POST http://localhost:${PORT}/api/printer/print`)
  console.log(`   POST http://localhost:${PORT}/api/printer/test`)
  console.log('')
  console.log('💡 Para testar, use o arquivo test.js:')
  console.log('   node test.js')
  console.log('')
})

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando servidor...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT recebido, encerrando servidor...')
  process.exit(0)
})
