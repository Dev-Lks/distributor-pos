import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer'
import { PrinterConfig, PrinterStatus, ReceiptTemplate, PrintCommand } from './types'

export class ThermalPrinterService {
  private printer: ThermalPrinter | null = null
  private config: PrinterConfig | null = null

  constructor(config?: PrinterConfig) {
    if (config) {
      this.configure(config)
    }
  }

  configure(config: PrinterConfig): void {
    this.config = config
    
    let printerType: PrinterTypes
    
    switch (config.type) {
      case 'USB':
        printerType = PrinterTypes.EPSON
        break
      case 'Network':
        printerType = PrinterTypes.EPSON
        break
      case 'Serial':
        printerType = PrinterTypes.EPSON
        break
      default:
        printerType = PrinterTypes.EPSON
    }

    this.printer = new ThermalPrinter({
      type: printerType,
      interface: config.connectionString,
      width: config.width,
      removeSpecialCharacters: false,
      lineCharacter: '-',
    })
  }

  async getStatus(): Promise<PrinterStatus> {
    if (!this.printer) {
      return {
        connected: false,
        online: false,
        paperStatus: 'out',
        error: 'Impressora não configurada',
      }
    }

    try {
      // Tenta verificar o status da impressora
      const isConnected = await this.printer.isPrinterConnected()
      
      return {
        connected: isConnected,
        online: isConnected,
        paperStatus: 'ok', // TODO: Implementar verificação real de papel
      }
    } catch (error) {
      return {
        connected: false,
        online: false,
        paperStatus: 'out',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  }

  async print(template: ReceiptTemplate): Promise<void> {
    if (!this.printer) {
      throw new Error('Impressora não configurada')
    }

    try {
      // Limpa buffer anterior
      this.printer.clear()

      // Processa cada comando do template
      for (const command of template.commands) {
        await this.processCommand(command)
      }

      // Envia para impressora
      await this.printer.execute()
      
      console.log('Recibo impresso com sucesso')
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      throw error
    }
  }

  private async processCommand(command: PrintCommand): Promise<void> {
    if (!this.printer) return

    switch (command.type) {
      case 'align':
        if (command.value === 'center') {
          this.printer.alignCenter()
        } else if (command.value === 'right') {
          this.printer.alignRight()
        } else {
          this.printer.alignLeft()
        }
        break

      case 'text':
        if (command.bold) {
          this.printer.bold(true)
        }
        
        if (command.size === 'large') {
          this.printer.setTextDoubleHeight()
          this.printer.setTextDoubleWidth()
        } else if (command.size === 'small') {
          this.printer.setTextNormal()
        }
        
        this.printer.println(command.value || '')
        
        if (command.bold) {
          this.printer.bold(false)
        }
        
        if (command.size === 'large') {
          this.printer.setTextNormal()
        }
        break

      case 'feed':
        this.printer.newLine()
        if (command.lines && command.lines > 1) {
          for (let i = 1; i < command.lines; i++) {
            this.printer.newLine()
          }
        }
        break

      case 'separator':
        const char = command.char || '-'
        const width = this.config?.width || 48
        this.printer.println(char.repeat(width))
        break

      case 'qrcode':
        if (command.data) {
          this.printer.printQR(command.data, {
            cellSize: 6,
            correction: 'M',
            model: 2,
          })
        }
        break

      case 'barcode':
        if (command.data) {
          this.printer.printBarcode(command.data)
        }
        break

      case 'cut':
        this.printer.cut()
        break
    }
  }

  async testPrint(): Promise<void> {
    const testTemplate: ReceiptTemplate = {
      commands: [
        { type: 'align', value: 'center' },
        { type: 'text', value: '=== TESTE DE IMPRESSÃO ===', size: 'large', bold: true },
        { type: 'feed', lines: 1 },
        { type: 'align', value: 'left' },
        { type: 'text', value: 'Se você está lendo isso,' },
        { type: 'text', value: 'sua impressora está funcionando!' },
        { type: 'feed', lines: 1 },
        { type: 'separator' },
        { type: 'text', value: `Data: ${new Date().toLocaleString('pt-BR')}` },
        { type: 'separator' },
        { type: 'feed', lines: 2 },
        { type: 'cut' },
      ],
    }

    await this.print(testTemplate)
  }

  disconnect(): void {
    this.printer = null
    this.config = null
  }
}

// Singleton instance
let printerInstance: ThermalPrinterService | null = null

export function getPrinterInstance(config?: PrinterConfig): ThermalPrinterService {
  if (!printerInstance) {
    printerInstance = new ThermalPrinterService(config)
  } else if (config) {
    printerInstance.configure(config)
  }
  
  return printerInstance
}
