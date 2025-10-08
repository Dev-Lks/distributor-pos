'use client'

import { useState, useRef, useEffect } from 'react'
import { Scan, X, Search, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/button'
import { cn } from '@/lib/utils'

interface BarcodeInputProps {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
  autoFocus?: boolean
  enabled?: boolean
  showHistory?: boolean
  className?: string
  isScanning?: boolean
  scanHistory?: Array<{ barcode: string; timestamp: number }>
}

export function BarcodeInput({
  onScan,
  onError,
  autoFocus = true,
  enabled = true,
  showHistory = true,
  className,
  isScanning = false,
  scanHistory = [],
}: BarcodeInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!value.trim()) {
      onError?.('Digite ou escaneie um código de barras')
      return
    }

    onScan(value.trim())
    setValue('')
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setValue('')
    inputRef.current?.focus()
  }

  const handleHistoryClick = (barcode: string) => {
    onScan(barcode)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          {/* Ícone do scanner */}
          <div className={cn(
            'absolute left-3 flex items-center justify-center transition-all',
            isScanning && 'animate-pulse text-green-500'
          )}>
            <Scan className="h-5 w-5" />
          </div>

          {/* Input */}
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Escaneie ou digite o código de barras..."
            disabled={!enabled}
            className={cn(
              'pl-12 pr-24 h-12 text-lg font-mono',
              isScanning && 'border-green-500 ring-2 ring-green-500/20',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            )}
          />

          {/* Botões de ação */}
          <div className="absolute right-2 flex items-center gap-1">
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!value.trim()}
              className="h-8"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Badge de status */}
        {isScanning && (
          <div className="absolute -top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full animate-pulse">
            ESCANEANDO
          </div>
        )}
      </form>

      {/* Histórico de scans */}
      {showHistory && scanHistory.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            Últimos scans
          </div>
          <div className="space-y-1">
            {scanHistory.slice(0, 5).map((scan, index) => (
              <button
                key={`${scan.barcode}-${scan.timestamp}`}
                onClick={() => handleHistoryClick(scan.barcode)}
                className="w-full flex items-center justify-between px-3 py-2 bg-background rounded hover:bg-accent transition-colors text-sm group"
              >
                <span className="font-mono">{scan.barcode}</span>
                <span className="text-xs text-muted-foreground group-hover:text-accent-foreground">
                  {new Date(scan.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Atalho de teclado */}
      <div className="text-xs text-muted-foreground text-center">
        Pressione <kbd className="px-2 py-1 bg-muted rounded">Ctrl</kbd> +{' '}
        <kbd className="px-2 py-1 bg-muted rounded">B</kbd> para focar
      </div>
    </div>
  )
}
