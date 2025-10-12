'use client'

import { useState, useCallback, useEffect } from 'react'
import { PrinterConfig, PrinterStatus, ReceiptType, PrintJob, UseThermalPrinter } from './types'
import { toast } from 'sonner'

export function useThermalPrinter(): UseThermalPrinter {
  const [status, setStatus] = useState<PrinterStatus>({
    connected: false,
    online: false,
    paperStatus: 'out',
  })
  const [isPrinting, setIsPrinting] = useState(false)
  const [queue, setQueue] = useState<PrintJob[]>([])

  // Verifica status da impressora periodicamente
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/hardware/printer/status')
        if (response.ok) {
          const data = await response.json()
          setStatus(data)
        }
      } catch (error) {
        console.error('Erro ao verificar status da impressora:', error)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 10000) // A cada 10 segundos

    return () => clearInterval(interval)
  }, [])

  const configure = useCallback(async (config: PrinterConfig) => {
    try {
      const response = await fetch('/api/hardware/printer/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const result = await response.json()

      if (!response.ok) {
        // Mostrar mensagem mais detalhada se disponível
        toast.error(result.message || 'Erro ao configurar impressora', {
          description: result.help || 'Verifique a documentação',
          duration: 5000,
        })
        throw new Error(result.message || 'Erro ao configurar impressora')
      }

      toast.success('Impressora configurada com sucesso')
      
      // Atualiza status
      const statusResponse = await fetch('/api/hardware/printer/status')
      if (statusResponse.ok) {
        const data = await statusResponse.json()
        setStatus(data)
      }
    } catch (error: any) {
      console.error('Erro ao configurar impressora:', error)
      if (!error.message.includes('desabilitada')) {
        toast.error('Erro ao configurar impressora')
      }
      throw error
    }
  }, [])

  const print = useCallback(async (data: any, type: ReceiptType) => {
    setIsPrinting(true)
    
    try {
      const response = await fetch('/api/hardware/printer/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, type }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao imprimir')
      }

      const result = await response.json()
      
      toast.success('Recibo impresso com sucesso!')
      
      return result
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      toast.error('Erro ao imprimir recibo')
      throw error
    } finally {
      setIsPrinting(false)
    }
  }, [])

  const testPrint = useCallback(async () => {
    setIsPrinting(true)
    
    try {
      const response = await fetch('/api/hardware/printer/test', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erro ao testar impressora')
      }

      toast.success('Teste de impressão enviado!')
    } catch (error) {
      console.error('Erro no teste de impressão:', error)
      toast.error('Erro no teste de impressão')
      throw error
    } finally {
      setIsPrinting(false)
    }
  }, [])

  return {
    status,
    print,
    isPrinting,
    queue,
    configure,
    testPrint,
  }
}
