import React, { createContext, useState, useMemo, useContext, useCallback, useEffect } from 'react'
import type { Product, SaleItem } from '@types'
import { createSale } from '../services/sales.service'
import { toast } from 'sonner'
import { useAuth } from '../../auth/context/AuthContext'
import { useSalesHistory } from './SalesHistoryContext'
import { useReports } from '../../reports/context/ReportsContext'
import { useProductsContext } from '../../products/context/ProductsContext'
import { usePromotionsContext } from '../../promtions/context/PromotionsContext'

export interface CartItem extends Omit<SaleItem, 'id' | 'saleId' | 'subtotal'> {
  stock: number
  isStockControlled: boolean
  productType: 'UNIT' | 'WEIGHT'
}

export interface AppliedPromotion {
  promotionId: number
  promotionName: string
  discountAmount: number
}

export interface SalesContextType {
  cart: CartItem[]
  appliedPromotions: AppliedPromotion[]
  subtotal: number
  discountTotal: number
  manualAdjustment: number
  total: number
  paymentMethodId: number | null
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (productId: number, delta: number) => void
  setItemQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  upsertPromotion: (promo: AppliedPromotion) => void
  removePromotion: (promotionId: number) => void
  setManualAdjustment: (amount: number) => void
  setPaymentMethod: (id: number) => void
  processSale: () => Promise<void>
  clearCart: () => void
  source: 'LOCAL' | 'ONLINE'
  setSource: (source: 'LOCAL' | 'ONLINE') => void
}

export const SalesContext = createContext<SalesContextType | undefined>(undefined)

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [appliedPromotions, setAppliedPromotions] = useState<AppliedPromotion[]>([])
  const [manualAdjustment, setManualAdjustment] = useState<number>(0)
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null)
  const [source, setSource] = useState<'LOCAL' | 'ONLINE'>('LOCAL')

  const { user } = useAuth()
  const { invalidateSalesHistory } = useSalesHistory()
  const { invalidateReports } = useReports()

  // Consume Global State for Validation
  const { products, loading: loadingProducts } = useProductsContext()
  const { promotions, loading: loadingPromotions } = usePromotionsContext()

  // Effect: Update prices when Source changes (Local <-> Online)
  useEffect(() => {
    if (cart.length === 0) return

    setCart(prevCart => {
      return prevCart.map(item => {
        const product = products.find(p => p.id === item.productId)
        if (!product) return item

        const newPrice = (source === 'ONLINE' && product.priceDelivery)
          ? product.priceDelivery
          : product.price

        return { ...item, unitPrice: newPrice }
      })
    })
  }, [source, products])

  // Effect: Validate Cart Items against Products List
  useEffect(() => {
    if (loadingProducts || products.length === 0) return

    setCart((prevCart) => {
      const validCart = prevCart.filter(item => {
        const exists = products.some(p => p.id === item.productId)
        if (!exists) {
          return false
        }
        return true
      })

      if (prevCart.length !== validCart.length) {
        toast.warning('Se eliminaron productos del carrito que ya no existen.')
      }
      return validCart
    })
  }, [products, loadingProducts])

  // Effect: Validate Applied Promotions
  useEffect(() => {
    if (loadingPromotions || promotions.length === 0) return

    setAppliedPromotions((prevPromos) => {
      const validPromos = prevPromos.filter(p => {
        const exists = promotions.some(promo => promo.id === p.promotionId)
        return exists
      })

      if (prevPromos.length !== validPromos.length) {
        toast.warning('Se eliminaron promociones que ya no son válidas.')
      }
      return validPromos
    })
  }, [promotions, loadingPromotions])

  // Effect: Reset Manual Adjustment when Cart is Empty
  useEffect(() => {
    if (cart.length === 0 && manualAdjustment !== 0) {
      setManualAdjustment(0)
    }
  }, [cart, manualAdjustment])

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [cart]
  )

  const discountTotal = useMemo(
    () => appliedPromotions.reduce((acc, promo) => acc + promo.discountAmount, 0),
    [appliedPromotions]
  )

  const total = useMemo(() => Math.max(subtotal - discountTotal + manualAdjustment, 0), [subtotal, discountTotal, manualAdjustment])

  const addItem = useCallback((product: Product, quantity = 1) => {
    if (product.isStockControlled && product.stock < quantity) {
      toast.error('Stock insuficiente')
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      const currentPrice = (source === 'ONLINE' && product.priceDelivery)
        ? product.priceDelivery
        : product.price

      if (existing) {
        if (product.isStockControlled && existing.quantity + quantity > product.stock) {
          toast.error(`Stock insuficiente. Disponible: ${product.stock}`)
          return prev
        }

        return prev.map((item) =>
          item.productId === product.id
            ? {
              ...item,
              quantity: existing.quantity + quantity,
              unitPrice: currentPrice // Ensure price matches current source
            }
            : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: currentPrice,
          quantity: quantity,
          stock: product.stock,
          isStockControlled: product.isStockControlled,
          productType: product.productType || 'UNIT'
        }
      ]
    })
  }, [source])

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = Math.max(0.01, item.quantity + delta) // Allow floats, but keep min > 0

          // Check stock if increasing quantity
          if (delta > 0 && item.isStockControlled && newQty > item.stock) {
            toast.error(`Stock insuficiente. Disponible: ${item.stock}`)
            return item
          }

          return { ...item, quantity: newQty }
        }
        return item
      })
    )
  }, [])

  const setItemQuantity = useCallback((productId: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          if (quantity <= 0) return item // Invalid

          if (item.isStockControlled && quantity > item.stock) {
            toast.error(`Stock insuficiente. Disponible: ${item.stock}`)
            return item
          }

          return { ...item, quantity }
        }
        return item
      })
    )
  }, [])

  const removeItem = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const upsertPromotion = useCallback((promo: AppliedPromotion) => {
    setAppliedPromotions((prev) => {
      const existing = prev.find((p) => p.promotionId === promo.promotionId)
      if (!existing) return [...prev, promo]
      if (Math.abs(existing.discountAmount - promo.discountAmount) < 0.01) return prev
      return prev.map((p) => (p.promotionId === promo.promotionId ? promo : p))
    })
  }, [])

  const removePromotion = useCallback((promotionId: number) => {
    setAppliedPromotions((prev) => prev.filter((p) => p.promotionId !== promotionId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setAppliedPromotions([])
    setManualAdjustment(0)
    setPaymentMethodId(null)
    setSource('LOCAL')
  }, [])

  const processSale = useCallback(async (): Promise<void> => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    if (!paymentMethodId) {
      toast.error('Selecciona un método de pago')
      return
    }

    try {
      await createSale({
        paymentMethodId,
        items: cart,
        promotions: appliedPromotions,
        userId: user?.id,
        source,
        manualAdjustment
      })
      toast.success('Venta realizada con éxito')
      clearCart()
      invalidateSalesHistory()
      invalidateReports()
      // Recargar productos para actualizar stock
      window.dispatchEvent(new Event('products-updated'))
      window.dispatchEvent(new Event('sales-updated'))
    } catch (error: any) {
      console.error(error)
      const errorMessage = error.message.includes('Stock insuficiente')
        ? error.message
        : 'Error al procesar la venta'
      toast.error(errorMessage)
    }
  }, [cart, paymentMethodId, appliedPromotions, manualAdjustment, clearCart, invalidateSalesHistory, invalidateReports])

  const contextValue = useMemo(() => ({
    cart,
    appliedPromotions,
    subtotal,
    discountTotal,
    manualAdjustment,
    total,
    paymentMethodId,
    addItem,
    updateQuantity,
    setItemQuantity,
    removeItem,
    upsertPromotion,
    removePromotion,
    setManualAdjustment,
    setPaymentMethod: setPaymentMethodId,
    processSale,
    clearCart,
    source,
    setSource
  }), [
    cart,
    appliedPromotions,
    subtotal,
    discountTotal,
    manualAdjustment,
    total,
    paymentMethodId,
    addItem,
    updateQuantity,
    setItemQuantity,
    removeItem,
    upsertPromotion,
    removePromotion,
    setManualAdjustment,
    processSale,
    clearCart,
    source,
    setSource
  ])

  return (
    <SalesContext.Provider value={contextValue}>
      {children}
    </SalesContext.Provider>
  )
}

export const useSales = () => {
  const context = useContext(SalesContext)
  if (!context) throw new Error('useSales must be used within SalesProvider')
  return context
}
