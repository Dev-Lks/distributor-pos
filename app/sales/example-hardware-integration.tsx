'use client'

/**
 * EXEMPLO DE INTEGRAÇÃO - Sistema de Vendas com Hardware
 * 
 * Este é um exemplo de como integrar o scanner de código de barras
 * e a impressora térmica em uma página de vendas.
 * 
 * Para usar em produção:
 * 1. Copie este código para sua página de vendas real
 * 2. Ajuste as funções de busca de produtos e salvamento de vendas
 * 3. Integre com seu sistema de carrinho existente
 * 4. Configure o hardware nas configurações do ponto de venda
 */

import { useState, useEffect } from 'react'
import { Plus, Minus, Trash2, CreditCard, DollarSign } from 'lucide-react'
import { BarcodeInput, PrinterStatus, HardwareSettings } from '@/components/hardware'
import { useBarcodeScanner } from '@/lib/hardware/useBarcodeScanner'
import { useThermalPrinter } from '@/lib/hardware/useThermalPrinter'
import { Button } from '@/components/button'
import { toast } from 'sonner'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  barcode?: string
}

export default function SalesWithHardwareExample() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [pointOfSaleId, setPointOfSaleId] = useState('') // TODO: Get from context/session
  
  const { status, print, isPrinting } = useThermalPrinter()
  
  const { isScanning, scanHistory } = useBarcodeScanner({
    enabled: true,
    autoAddToCart: true,
    minScanSpeed: 50,
    onScan: handleBarcodeScan,
    onError: (error) => toast.error(error),
  })

  // Função chamada quando um código de barras é escaneado
  async function handleBarcodeScan(barcode: string) {
    try {
      // Buscar produto por código de barras
      const response = await fetch(`/api/products/by-barcode/${barcode}`)
      
      if (!response.ok) {
        throw new Error('Produto não encontrado')
      }
      
      const product = await response.json()
      
      // Adicionar ao carrinho
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.salePrice,
        quantity: 1,
        barcode: product.barcode,
      })
      
      toast.success(`${product.name} adicionado ao carrinho!`)
    } catch (error) {
      console.error('Erro ao buscar produto:', error)
      toast.error('Produto não encontrado')
    }
  }

  // Adicionar produto ao carrinho
  function addToCart(item: CartItem) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      
      return [...prev, item]
    })
  }

  // Atualizar quantidade
  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  // Remover item
  function removeItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  // Calcular totais
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal // TODO: Adicionar descontos, taxas, etc.

  // Finalizar venda e imprimir
  async function handleFinalizeSale(paymentMethod: string) {
    if (cart.length === 0) {
      toast.error('Carrinho vazio')
      return
    }

    try {
      // 1. Salvar venda no banco
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          total,
          paymentMethod,
          pointOfSaleId,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar venda')
      }

      const sale = await response.json()

      // 2. Imprimir recibo automaticamente
      try {
        await print(sale, 'sale')
        toast.success('Venda finalizada e recibo impresso!')
      } catch (printError) {
        console.error('Erro ao imprimir:', printError)
        toast.warning('Venda finalizada, mas houve erro ao imprimir')
      }

      // 3. Limpar carrinho
      setCart([])
    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      toast.error('Erro ao finalizar venda')
    }
  }

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter = Finalizar venda
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleFinalizeSale('cash')
      }
      
      // Esc = Limpar carrinho (com confirmação)
      if (e.key === 'Escape' && cart.length > 0) {
        if (confirm('Deseja cancelar a venda atual?')) {
          setCart([])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart])

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Ponto de Venda</h1>
          <div className="flex items-center gap-3">
            <PrinterStatus 
              status={status} 
              isPrinting={isPrinting}
            />
            <HardwareSettings pointOfSaleId={pointOfSaleId} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seção do Scanner */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🔍 Scanner de Produtos
            </h2>
            <BarcodeInput
              onScan={handleBarcodeScan}
              onError={(error) => toast.error(error)}
              autoFocus={true}
              showHistory={true}
              isScanning={isScanning}
              scanHistory={scanHistory}
            />
          </div>

          {/* Grid de produtos rápidos (opcional) */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Produtos Rápidos</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* TODO: Adicionar produtos frequentes aqui */}
              <Button variant="outline" className="h-20">
                Produto 1
              </Button>
              <Button variant="outline" className="h-20">
                Produto 2
              </Button>
            </div>
          </div>
        </div>

        {/* Carrinho */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
              🛒 Carrinho
              <span className="text-sm font-normal text-muted-foreground">
                {cart.length} {cart.length === 1 ? 'item' : 'itens'}
              </span>
            </h2>

            {/* Lista de itens */}
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Carrinho vazio</p>
                  <p className="text-sm mt-2">Escaneie ou busque produtos para adicionar</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {item.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="ml-4 min-w-[80px] text-right">
                      <p className="font-semibold">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totais */}
            {cart.length > 0 && (
              <>
                <div className="border-t pt-4 space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Desconto:</span>
                    <span>R$ 0,00</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t pt-2">
                    <span>TOTAL:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Métodos de pagamento */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleFinalizeSale('cash')}
                    disabled={isPrinting}
                    className="h-14"
                  >
                    <DollarSign className="h-5 w-5 mr-2" />
                    Dinheiro
                  </Button>
                  <Button
                    onClick={() => handleFinalizeSale('debit')}
                    disabled={isPrinting}
                    variant="outline"
                    className="h-14"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Débito
                  </Button>
                  <Button
                    onClick={() => handleFinalizeSale('credit')}
                    disabled={isPrinting}
                    variant="outline"
                    className="h-14"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Crédito
                  </Button>
                  <Button
                    onClick={() => handleFinalizeSale('pix')}
                    disabled={isPrinting}
                    variant="outline"
                    className="h-14"
                  >
                    📱 Pix
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Atalhos */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2">Atalhos de Teclado</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <kbd className="px-2 py-1 bg-background rounded">Ctrl+B</kbd> Focar scanner
              </div>
              <div>
                <kbd className="px-2 py-1 bg-background rounded">Ctrl+Enter</kbd> Finalizar
              </div>
              <div>
                <kbd className="px-2 py-1 bg-background rounded">Esc</kbd> Cancelar
              </div>
              <div>
                <kbd className="px-2 py-1 bg-background rounded">Ctrl+P</kbd> Reimprimir
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
