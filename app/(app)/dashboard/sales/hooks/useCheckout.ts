import { useState, useCallback } from "react"
import { toast } from "sonner"
import { handleError } from "@/lib/errors"
import { logger } from "@/lib/logger"
import type { CartItem } from "./useCart"

interface CheckoutOptions<T = unknown> {
  cart: CartItem[]
  paymentMethod: "cash" | "card" | "pix"
  pointOfSaleId: string
  customerData?: {
    name?: string
    phone?: string
    address?: string
  }
  onSuccess: () => void
  createSale: (data: T) => Promise<unknown>
}

/**
 * Hook para gerenciar o processo de checkout (finalização de venda)
 */
export function useCheckout() {
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Valida se a venda pode ser finalizada
   */
  const validateCheckout = useCallback((cart: CartItem[], pointOfSaleId: string) => {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao carrinho")
      return false
    }

    if (!pointOfSaleId) {
      toast.error("Selecione um ponto de venda")
      return false
    }

    return true
  }, [])

  /**
   * Finaliza a venda
   */
  const finalizeSale = useCallback(async <T = unknown>({
    cart,
    paymentMethod,
    pointOfSaleId,
    customerData,
    onSuccess,
    createSale,
  }: CheckoutOptions<T>) => {
    // Validação
    if (!validateCheckout(cart, pointOfSaleId)) {
      return
    }

    setIsProcessing(true)

    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

      const saleData = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod,
        pointOfSaleId,
        total,
        customerData: customerData?.name ? customerData : undefined,
      } as T

      await createSale(saleData)

      toast.success("Venda finalizada com sucesso!", {
        description: `Total: R$ ${total.toFixed(2)}`,
      })

      onSuccess()
    } catch (error) {
      const { message } = handleError(error)
      logger.error("Erro ao finalizar venda", { error, pointOfSaleId })
      toast.error("Erro ao finalizar venda", {
        description: message || "Tente novamente",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [validateCheckout])

  return {
    isProcessing,
    finalizeSale,
  }
}
