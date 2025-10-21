import { useState, useCallback } from "react"
import { toast } from "sonner"
import { calculateCartItemCount, calculateCartSubtotal } from "@/lib/utils/calculations"

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
}

/**
 * Hook para gerenciar o carrinho de vendas
 * @returns Funções e estado do carrinho
 */
export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])

  /**
   * Adiciona um produto ao carrinho ou incrementa a quantidade
   */
  const addToCart = useCallback((product: {
    id: string
    name: string
    salePrice: number
    stock: number
  }) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id)

      if (existingItem) {
        // Verifica se há estoque disponível
        if (existingItem.quantity >= product.stock) {
          toast.error(`Estoque insuficiente para ${product.name}`)
          return prevCart
        }

        // Incrementa quantidade
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      // Verifica se há estoque antes de adicionar
      if (product.stock <= 0) {
        toast.error(`${product.name} sem estoque`)
        return prevCart
      }

      // Adiciona novo item
      return [
        ...prevCart,
        {
          productId: product.id,
          name: product.name,
          price: product.salePrice,
          quantity: 1,
          stock: product.stock,
        },
      ]
    })
  }, [])

  /**
   * Atualiza a quantidade de um item específico
   */
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productId === productId) {
          // Verifica estoque
          if (quantity > item.stock) {
            toast.error(`Estoque insuficiente. Disponível: ${item.stock}`)
            return item
          }
          return { ...item, quantity }
        }
        return item
      })
    )
  }, [])

  /**
   * Remove um item do carrinho
   */
  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId))
  }, [])

  /**
   * Limpa todo o carrinho
   */
  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  /**
   * Calcula o total do carrinho
   */
  const getCartTotal = useCallback(() => {
    return calculateCartSubtotal(cart)
  }, [cart])

  /**
   * Retorna a quantidade total de itens
   */
  const getItemCount = useCallback(() => {
    return calculateCartItemCount(cart)
  }, [cart])

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getItemCount,
  }
}
