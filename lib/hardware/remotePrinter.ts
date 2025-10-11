// lib/hardware/remotePrinter.ts
/**
 * Cliente para impressão remota via servidor local
 * Usado quando o app está hospedado na nuvem (Vercel)
 */

export interface RemotePrinterConfig {
  serverUrl: string
  authToken: string
}

export interface PrinterStatus {
  connected: boolean
  online: boolean
  paperStatus: 'ok' | 'low' | 'out' | 'unknown'
  error?: string
}

export interface PrintCommand {
  type: 'text' | 'align' | 'feed' | 'separator' | 'qrcode' | 'barcode' | 'cut'
  value?: string
  bold?: boolean
  size?: 'small' | 'normal' | 'large'
  lines?: number
  char?: string
  data?: string
}

export interface PrintTemplate {
  commands: PrintCommand[]
}

class RemotePrinter {
  private config: RemotePrinterConfig | null = null
  private isConfigured = false

  /**
   * Configurar servidor de impressão
   */
  configure(config: RemotePrinterConfig) {
    this.config = config
    this.isConfigured = true
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('remotePrinterConfig', JSON.stringify(config))
    }
  }

  /**
   * Carregar configuração do localStorage
   */
  loadConfig(): RemotePrinterConfig | null {
    if (typeof window === 'undefined') return null
    
    const saved = localStorage.getItem('remotePrinterConfig')
    if (!saved) return null
    
    try {
      const config = JSON.parse(saved)
      this.config = config
      this.isConfigured = true
      return config
    } catch {
      return null
    }
  }

  /**
   * Verificar se está configurado
   */
  isReady(): boolean {
    return this.isConfigured && this.config !== null
  }

  /**
   * Obter configuração atual
   */
  getConfig(): RemotePrinterConfig | null {
    return this.config
  }

  /**
   * Verificar status da impressora
   */
  async getStatus(): Promise<PrinterStatus> {
    if (!this.config) {
      return {
        connected: false,
        online: false,
        paperStatus: 'unknown',
        error: 'Servidor de impressão não configurado',
      }
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/api/printer/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        connected: data.connected || false,
        online: data.online || false,
        paperStatus: data.paperStatus || 'unknown',
        error: data.error,
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      return {
        connected: false,
        online: false,
        paperStatus: 'unknown',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  }

  /**
   * Imprimir template
   */
  async print(template: PrintTemplate): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      return {
        success: false,
        error: 'Servidor de impressão não configurado',
      }
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/api/printer/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.authToken}`,
        },
        body: JSON.stringify({ template }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  }

  /**
   * Imprimir teste
   */
  async printTest(): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      return {
        success: false,
        error: 'Servidor de impressão não configurado',
      }
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/api/printer/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao imprimir teste:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  }

  /**
   * Verificar conectividade com o servidor
   */
  async checkConnection(): Promise<boolean> {
    if (!this.config) return false

    try {
      const response = await fetch(`${this.config.serverUrl}/api/health`, {
        method: 'GET',
      })

      return response.ok
    } catch {
      return false
    }
  }
}

// Instância singleton
export const remotePrinter = new RemotePrinter()
