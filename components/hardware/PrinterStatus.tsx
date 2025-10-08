'use client'

import { Printer, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrinterStatus as PrinterStatusType } from '@/lib/hardware/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PrinterStatusProps {
  status: PrinterStatusType
  isPrinting?: boolean
  className?: string
  onClick?: () => void
}

export function PrinterStatus({ 
  status, 
  isPrinting = false,
  className,
  onClick 
}: PrinterStatusProps) {
  const getStatusColor = () => {
    if (isPrinting) return 'text-blue-500'
    if (!status.connected) return 'text-red-500'
    if (status.paperStatus === 'low') return 'text-yellow-500'
    if (status.paperStatus === 'out') return 'text-red-500'
    return 'text-green-500'
  }

  const getStatusText = () => {
    if (isPrinting) return 'Imprimindo...'
    if (!status.connected) return 'Desconectada'
    if (status.paperStatus === 'out') return 'Sem papel'
    if (status.paperStatus === 'low') return 'Papel baixo'
    return 'Pronta'
  }

  const getIcon = () => {
    if (isPrinting) return <Loader2 className="h-4 w-4 animate-spin" />
    if (!status.connected || status.paperStatus === 'out') return <AlertCircle className="h-4 w-4" />
    return <CheckCircle2 className="h-4 w-4" />
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-105',
              'bg-background hover:bg-accent',
              className
            )}
          >
            <Printer className={cn('h-5 w-5', getStatusColor())} />
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium">Impressora</span>
              <span className={cn('text-xs', getStatusColor())}>
                {getStatusText()}
              </span>
            </div>
            {getIcon()}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">Status da Impressora</p>
            <p className="text-sm">Conexão: {status.connected ? '✓' : '✗'}</p>
            <p className="text-sm">Online: {status.online ? '✓' : '✗'}</p>
            <p className="text-sm">Papel: {status.paperStatus}</p>
            {status.error && (
              <p className="text-sm text-red-500">Erro: {status.error}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Clique para configurar
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
