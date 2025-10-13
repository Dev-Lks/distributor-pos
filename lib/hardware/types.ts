// Types para hardware (scanner e impressora)

export interface BarcodeScannerOptions {
  enabled: boolean
  autoAddToCart?: boolean
  minScanSpeed?: number // ms entre caracteres para detectar scanner vs digitação manual
  onScan: (barcode: string) => void
  onError?: (error: string) => void
  prefix?: string // Alguns scanners enviam prefixo
  suffix?: string // Alguns scanners enviam sufixo (geralmente Enter)
}

export interface BarcodeScanResult {
  barcode: string
  timestamp: number
  isValid: boolean
}

export interface UseBarcodeScanner {
  isScanning: boolean
  lastScanned: string | null
  scanHistory: BarcodeScanResult[]
  clearHistory: () => void
}

export interface PrinterConfig {
  type: 'USB' | 'Network' | 'Serial'
  connectionString: string // Ex: "COM3", "192.168.1.100:9100", "/dev/ttyUSB0"
  characterSet?: string
  width: 32 | 48 | 58 | 80 // caracteres por linha
  encoding: 'UTF-8' | 'GB18030' | 'ISO-8859-1'
}

export interface PrinterStatus {
  connected: boolean
  online: boolean
  paperStatus: 'ok' | 'low' | 'out'
  error?: string
}

export interface PrintCommand {
  type: 'align' | 'text' | 'feed' | 'separator' | 'qrcode' | 'cut' | 'barcode'
  value?: string
  size?: 'small' | 'normal' | 'large'
  bold?: boolean
  char?: string
  lines?: number
  data?: string
  align?: 'left' | 'center' | 'right'
}

export interface ReceiptTemplate {
  commands: PrintCommand[]
}

export type ReceiptType = 
  | 'sale' 
  | 'cash-transaction' 
  | 'cash-opening' 
  | 'cash-closing' 
  | 'report'
  | 'delivery'
  | 'delivery-driver'
  | 'delivery-customer'
  | 'delivery-organizer'

export interface PrintJob {
  id: string
  type: ReceiptType
  data: any
  status: 'pending' | 'printing' | 'completed' | 'failed'
  error?: string
  createdAt: Date
  completedAt?: Date
  retryCount: number
}

export interface UseThermalPrinter {
  status: PrinterStatus
  print: (data: any, type: ReceiptType) => Promise<void>
  isPrinting: boolean
  queue: PrintJob[]
  configure: (config: PrinterConfig) => Promise<void>
  testPrint: () => Promise<void>
}

export interface HardwareConfig {
  id: string
  pointOfSaleId: string
  
  // Scanner
  scannerEnabled: boolean
  scannerAutoAdd: boolean
  scannerPrefix?: string
  scannerSuffix?: string
  
  // Printer
  printerEnabled: boolean
  printerType: string
  printerConnection?: string
  printerWidth: number
  printerEncoding: string
  autoPrint: boolean
  
  // Customização
  logoUrl?: string
  footerMessage?: string
  
  createdAt: Date
  updatedAt: Date
}
