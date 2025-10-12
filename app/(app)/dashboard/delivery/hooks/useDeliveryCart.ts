import { useState, useCallback, useMemo } from "react"
import { toast } from "sonner"

export interface DeliveryCartItem {
  productId: string
  name: string
  price: number
  quantity: number
  stock: number
  discount?: number
  notes?: string
}

/**
 * Hook para gerenciar o carrinho de delivery
 * @returns Funções e estado do carrinho
 */
export function useDeliveryCart() {
  const [cart, setCart] = useState<DeliveryCartItem[]>([])

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
   * Atualiza o desconto de um item
   */
  const updateDiscount = useCallback((productId: string, discount: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId ? { ...item, discount: Math.max(0, discount) } : item
      )
    )
  }, [])

  /**
   * Atualiza observações de um item
   */
  const updateNotes = useCallback((productId: string, notes: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId ? { ...item, notes } : item
      )
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
   * Calcula valores do carrinho
   */
  const calculations = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity
      return sum + itemTotal
    }, 0)

    const totalDiscount = cart.reduce((sum, item) => {
      return sum + (item.discount || 0)
    }, 0)

    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    return {
      subtotal,
      totalDiscount,
      itemCount,
    }
  }, [cart])

  /**
   * Exporta os itens no formato esperado pela API
   */
  const getCartItems = useCallback(() => {
    return cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount || 0,
      notes: item.notes || null,
    }))
  }, [cart])

  return {
    cart,
    addToCart,
    updateQuantity,
    updateDiscount,
    updateNotes,
    removeFromCart,
    clearCart,
    getCartItems,
    ...calculations,
  }
}
