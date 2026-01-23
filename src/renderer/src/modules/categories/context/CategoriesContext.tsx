import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import type { Category } from '@types'
import {
  fetchCategories,
  createCategory,
  updateCategory,
  toggleCategory,
  deleteCategory,
  countProductsInCategory
} from '../services/categories.service'

export interface CategoriesContextValue {
  categories: Category[]
  loading: boolean
  reload: () => Promise<void>
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'isActive'>) => Promise<void>
  editCategory: (id: number, data: Partial<Omit<Category, 'id' | 'createdAt'>>) => Promise<void>
  toggleCategoryStatus: (id: number, isActive: boolean) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  countProducts: (id: number) => Promise<number>
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const isLoadedRef = useRef(false)

  const loadCategories = useCallback(async (force = false) => {
    if (isLoadedRef.current && !force) return

    setLoading(true)
    try {
      const data = await fetchCategories()
      setCategories(data)
      isLoadedRef.current = true
    } finally {
      setLoading(false)
    }
  }, [])

  const addCategory = useCallback<CategoriesContextValue['addCategory']>(async (category) => {
    const created = await createCategory(category)
    setCategories((prev) => [...prev, created])
    window.dispatchEvent(new Event('categories-updated'))
  }, [])

  const editCategory = useCallback<CategoriesContextValue['editCategory']>(async (id, data) => {
    await updateCategory(id, data)
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
    window.dispatchEvent(new Event('categories-updated'))
  }, [])

  const toggleCategoryStatus = useCallback<CategoriesContextValue['toggleCategoryStatus']>(async (
    id,
    isActive
  ) => {
    await toggleCategory(id, isActive)
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, isActive } : c)))
    window.dispatchEvent(new Event('categories-updated'))
  }, [])

  const handleDeleteCategory = useCallback<CategoriesContextValue['deleteCategory']>(async (id) => {
    await deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    window.dispatchEvent(new Event('categories-updated'))
  }, [])

  const countProducts = useCallback<CategoriesContextValue['countProducts']>(async (id) => {
    return await countProductsInCategory(id)
  }, [])

  useEffect(() => {
    loadCategories()

    const handleCategoriesUpdated = () => {
      loadCategories(true)
    }

    window.addEventListener('categories-updated', handleCategoriesUpdated)
    return () => window.removeEventListener('categories-updated', handleCategoriesUpdated)
  }, [loadCategories])

  const contextValue = useMemo(() => ({
    categories,
    loading,
    reload: async () => loadCategories(true),
    addCategory,
    editCategory,
    toggleCategoryStatus,
    deleteCategory: handleDeleteCategory,
    countProducts
  }), [categories, loading, loadCategories, addCategory, editCategory, toggleCategoryStatus, handleDeleteCategory, countProducts])

  return (
    <CategoriesContext.Provider value={contextValue}>
      {children}
    </CategoriesContext.Provider>
  )
}

export default CategoriesProvider

export function useCategoriesContext(): CategoriesContextValue {
  const context = useContext(CategoriesContext)
  if (!context) {
    throw new Error('useCategoriesContext must be used within CategoriesProvider')
  }
  return context
}
