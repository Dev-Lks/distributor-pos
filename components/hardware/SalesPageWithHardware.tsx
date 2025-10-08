'use client'

import { useState, useCallback } from 'react'
import { BarcodeInput } from '@/components/hardware/BarcodeInput'
import { PrinterStatus } from '@/components/hardware/PrinterStatus'
import { useBarcodeScanner } from '@/lib/hardware/useBarcodeScanner'
import { useThermalPrinter } from '@/lib/hardware/useThermalPrinter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface SalesPageWithHardwareProps {
  onProductScanned?: (barcode: string) => void
  autoAddToCart?: boolean
}

export function SalesPageWithHardware({ 
  onProductScanned,
  autoAddToCart = true 
}: SalesPageWithHardwareProps) {
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)

  // Hook da impressora
  const { status: printerStatus, print, isPrinting } = useThermalPrinter()

  // Função para buscar produto por código de barras
  const handleProductScan = useCallback(async (barcode: string) => {
    setIsLoadingProduct(true)
    
    try {
      // Busca o produto pela API
      const response = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Produto não encontrado', {
            description: `Código: ${barcode}`,
          })
        } else {
          toast.error('Erro ao buscar produto')
        }
        return
      }

      const product = await response.json()
      
      toast.success('Produto encontrado!', {
        description: `${product.name} - R$ ${product.salePrice.toFixed(2)}`,
      })

      // Callback para adicionar ao carrinho
      onProductScanned?.(barcode)
      
    } catch (error) {
      console.error('Erro ao buscar produto:', error)
      toast.error('Erro ao processar código de barras')
    } finally {
      setIsLoadingProduct(false)
    }
  }, [onProductScanned])

  // Hook do scanner (detecta automaticamente)
  const { isScanning, lastScanned, scanHistory } = useBarcodeScanner({
    enabled: true,
    autoAddToCart,
    onScan: handleProductScan,
    onError: (error) => {
      toast.error(error)
    },
  })

  return (
    <div className="space-y-4">
      {/* Status da Impressora (floating) */}
      <div className="fixed top-4 right-4 z-50">
        <PrinterStatus 
          status={printerStatus} 
          isPrinting={isPrinting}
        />
      </div>

      {/* Scanner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Scanner de Produtos
            {isScanning && (
              <span className="text-sm text-green-500 animate-pulse">
                Escaneando...
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarcodeInput
            onScan={handleProductScan}
            onError={(error) => toast.error(error)}
            autoFocus={true}
            enabled={!isLoadingProduct}
            showHistory={true}
          />
          
          {lastScanned && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Último scan:</p>
              <p className="font-mono font-bold">{lastScanned}</p>
            </div>
          )}

          {isLoadingProduct && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground mt-2">Buscando produto...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Scans */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Histórico de Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <span className="font-mono text-sm">{scan.barcode}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      scan.isValid 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {scan.isValid ? 'Válido' : 'Inválido'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(scan.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dicas de Uso */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              💡 Dicas de uso:
            </p>
            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
              <li>• Escaneie o código de barras ou digite manualmente</li>
              <li>• Use <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-900 rounded text-xs">Ctrl+B</kbd> para focar no scanner</li>
              <li>• Produtos serão adicionados automaticamente ao carrinho</li>
              <li>• O recibo será impresso automaticamente após a venda</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
