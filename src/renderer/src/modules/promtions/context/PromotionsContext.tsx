import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import type { Promotion } from '@types'
import {
  fetchPromotions,
  createPromotion,
  updatePromotion,
  togglePromotion,
  deletePromotion
} from '../services/promotions.service'

export interface PromotionsContextValue {
  promotions: Promotion[]
  loading: boolean
  reload: () => Promise<void>
  addPromotion: (data: any) => Promise<void>
  updatePromotion: (id: number, data: any) => Promise<void>
  togglePromotionStatus: (id: number, isActive: boolean) => Promise<void>
  deletePromotion: (id: number) => Promise<void>
}

const PromotionsContext = createContext<PromotionsContextValue | null>(null)

export function PromotionsProvider({ children }: { children: React.ReactNode }) {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(false)
  const isLoadedRef = useRef(false)

  const loadPromotions = useCallback(async (force = false) => {
    if (isLoadedRef.current && !force) return

    setLoading(true)
    try {
      const data = await fetchPromotions()
      setPromotions(data)
      isLoadedRef.current = true
    } finally {
      setLoading(false)
    }
  }, [])

  const addPromotion = useCallback(async (data: any) => {
    const created = await createPromotion(data)
    setPromotions((prev) => [...prev, created])
    window.dispatchEvent(new Event('promotions-updated'))
  }, [])

  const updatePromotionData = useCallback(async (id: number, data: any) => {
    await updatePromotion(id, data)
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
    window.dispatchEvent(new Event('promotions-updated'))
  }, [])

  const togglePromotionStatus = useCallback(async (id: number, isActive: boolean) => {
    await togglePromotion(id, isActive)
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, isActive } : p)))
    window.dispatchEvent(new Event('promotions-updated'))
  }, [])

  const handleDeletePromotion = useCallback(async (id: number) => {
    await deletePromotion(id)
    setPromotions((prev) => prev.filter((p) => p.id !== id))
    window.dispatchEvent(new Event('promotions-updated'))
  }, [])

  useEffect(() => {
    loadPromotions()

    const handleProductsUpdated = () => {
      loadPromotions(true)
    }
    const handlePromotionsUpdated = () => {
      loadPromotions(true)
    }

    window.addEventListener('products-updated', handleProductsUpdated)
    window.addEventListener('promotions-updated', handlePromotionsUpdated)
    return () => {
      window.removeEventListener('products-updated', handleProductsUpdated)
      window.removeEventListener('promotions-updated', handlePromotionsUpdated)
    }
  }, [loadPromotions])

  const contextValue = useMemo(() => ({
    promotions,
    loading,
    reload: async () => loadPromotions(true),
    addPromotion,
    updatePromotion: updatePromotionData,
    togglePromotionStatus,
    deletePromotion: handleDeletePromotion
  }), [promotions, loading, loadPromotions, addPromotion, updatePromotionData, togglePromotionStatus, handleDeletePromotion])

  return (
    <PromotionsContext.Provider value={contextValue}>
      {children}
    </PromotionsContext.Provider>
  )
}

export function usePromotionsContext() {
  const context = useContext(PromotionsContext)
  if (!context) throw new Error('usePromotionsContext must be used within PromotionsProvider')
  return context
}
