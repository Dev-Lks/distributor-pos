'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { BarcodeScannerOptions, BarcodeScanResult, UseBarcodeScanner } from './types'
import { Howl } from 'howler'

// Sons de feedback
const successSound = typeof window !== 'undefined' ? new Howl({
  src: ['/sounds/beep-success.mp3'],
  volume: 0.5,
}) : null

const errorSound = typeof window !== 'undefined' ? new Howl({
  src: ['/sounds/beep-error.mp3'],
  volume: 0.5,
}) : null

export function useBarcodeScanner(options: BarcodeScannerOptions): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<BarcodeScanResult[]>([])
  
  const bufferRef = useRef<string>('')
  const lastKeypressRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const { enabled, autoAddToCart, minScanSpeed = 50, onScan, onError, prefix, suffix } = options

  const processBarcode = useCallback((barcode: string) => {
    let cleanBarcode = barcode.trim()
    
    // Remove prefixo se configurado
    if (prefix && cleanBarcode.startsWith(prefix)) {
      cleanBarcode = cleanBarcode.slice(prefix.length)
    }
    
    // Remove sufixo se configurado
    if (suffix && cleanBarcode.endsWith(suffix)) {
      cleanBarcode = cleanBarcode.slice(0, -suffix.length)
    }
    
    // Validação básica
    const isValid = cleanBarcode.length >= 8 && /^[0-9A-Za-z]+$/.test(cleanBarcode)
    
    const scanResult: BarcodeScanResult = {
      barcode: cleanBarcode,
      timestamp: Date.now(),
      isValid,
    }
    
    setScanHistory(prev => [scanResult, ...prev].slice(0, 10)) // Mantém últimos 10 scans
    setLastScanned(cleanBarcode)
    
    if (isValid) {
      successSound?.play()
      onScan(cleanBarcode)
    } else {
      errorSound?.play()
      onError?.('Código de barras inválido')
    }
    
    setIsScanning(false)
  }, [onScan, onError, prefix, suffix])

  useEffect(() => {
    if (!enabled) return

    const handleKeyPress = (event: KeyboardEvent) => {
      const now = Date.now()
      const timeSinceLastKeypress = now - lastKeypressRef.current
      
      // Se passou mais tempo que o limite, é digitação manual
      if (timeSinceLastKeypress > minScanSpeed && bufferRef.current.length > 0) {
        bufferRef.current = ''
      }
      
      lastKeypressRef.current = now
      
      // Enter indica fim do scan
      if (event.key === 'Enter' && bufferRef.current.length > 0) {
        event.preventDefault()
        processBarcode(bufferRef.current)
        bufferRef.current = ''
        return
      }
      
      // Ignora teclas especiais
      if (event.key.length > 1 && event.key !== 'Enter') {
        return
      }
      
      // Adiciona ao buffer
      if (event.key.length === 1) {
        bufferRef.current += event.key
        setIsScanning(true)
        
        // Reset timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        // Se não receber mais teclas em 100ms, limpa buffer
        timeoutRef.current = setTimeout(() => {
          if (bufferRef.current.length > 0) {
            bufferRef.current = ''
            setIsScanning(false)
          }
        }, 100)
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    
    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, minScanSpeed, processBarcode])

  const clearHistory = useCallback(() => {
    setScanHistory([])
    setLastScanned(null)
  }, [])

  return {
    isScanning,
    lastScanned,
    scanHistory,
    clearHistory,
  }
}
