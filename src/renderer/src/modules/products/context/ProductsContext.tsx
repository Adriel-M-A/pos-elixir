import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import type { Product } from '@types'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  toggleProduct,
  deleteProduct as deleteProductService,
  findPromotionsByProductId
} from '../services/products.service'

export interface ProductsContextValue {
  products: Product[]
  loading: boolean
  reload: () => Promise<void>
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'isActive'>) => Promise<void>
  editProduct: (
    id: number,
    data: Partial<Omit<Product, 'id' | 'createdAt'>>
  ) => Promise<void>
  toggleProductStatus: (id: number, isActive: boolean) => Promise<void>
  deleteProduct: (id: number) => Promise<void>
  findPromotions: (id: number) => Promise<string[]>
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const isLoadedRef = useRef(false)

  const loadProducts = useCallback(async (force = false) => {
    if (isLoadedRef.current && !force) return

    setLoading(true)
    try {
      const data = await fetchProducts()
      setProducts(data)
      isLoadedRef.current = true
    } finally {
      setLoading(false)
    }
  }, [])

  const addProduct = useCallback<ProductsContextValue['addProduct']>(async (product) => {
    const created = await createProduct(product)
    setProducts((prev) => [...prev, created])
    window.dispatchEvent(new Event('products-updated'))
  }, [])

  const editProduct = useCallback<ProductsContextValue['editProduct']>(async (id, data) => {
    await updateProduct(id, data)
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
    window.dispatchEvent(new Event('products-updated'))
  }, [])

  const toggleProductStatus = useCallback<ProductsContextValue['toggleProductStatus']>(async (id, isActive) => {
    await toggleProduct(id, isActive)
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive } : p)))
    window.dispatchEvent(new Event('products-updated'))
  }, [])

  const deleteProduct = useCallback<ProductsContextValue['deleteProduct']>(async (id) => {
    await deleteProductService(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    window.dispatchEvent(new Event('products-updated'))
  }, [])

  const findPromotions = useCallback<ProductsContextValue['findPromotions']>(async (id) => {
    return await findPromotionsByProductId(id)
  }, [])

  useEffect(() => {
    loadProducts()

    const handleProductsUpdated = () => {
      loadProducts(true)
    }

    const handleCategoriesUpdated = () => {
      loadProducts(true)
    }

    window.addEventListener('products-updated', handleProductsUpdated)
    window.addEventListener('categories-updated', handleCategoriesUpdated)

    return () => {
      window.removeEventListener('products-updated', handleProductsUpdated)
      window.removeEventListener('categories-updated', handleCategoriesUpdated)
    }
  }, [loadProducts])

  const contextValue = useMemo(() => ({
    products,
    loading,
    reload: async () => loadProducts(true),
    addProduct,
    editProduct,
    toggleProductStatus,
    deleteProduct,
    findPromotions
  }), [products, loading, loadProducts, addProduct, editProduct, toggleProductStatus, deleteProduct, findPromotions])

  return (
    <ProductsContext.Provider value={contextValue}>
      {children}
    </ProductsContext.Provider>
  )
}

export default ProductsProvider

export function useProductsContext(): ProductsContextValue {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProductsContext must be used within ProductsProvider')
  }
  return context
}
