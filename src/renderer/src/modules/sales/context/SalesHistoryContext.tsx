import { createContext, useContext, useState, ReactNode, useCallback, useRef, useMemo, useEffect } from 'react'
import { getSalesWithItems } from '../services/sales.service'
import type { SaleWithDetails } from '@types'
import { toast } from 'sonner'

export interface SalesHistoryContextType {
  sales: SaleWithDetails[]
  loading: boolean
  selectedDate: string
  fetchSales: (date: string) => Promise<void>
  invalidateSalesHistory: () => void
  setSales: (sales: SaleWithDetails[]) => void
}

const SalesHistoryContext = createContext<SalesHistoryContextType | undefined>(undefined)

export function SalesHistoryProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<SaleWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Use a ref to track the date for which we currently hold valid data
  // This avoids re-fetching if the user selects the same date again and we haven't invalidated.
  const loadedDateRef = useRef<string | null>(null)

  const fetchSales = useCallback(async (date: string) => {
    // Si ya tenemos data cargada para esta fecha, no hacemos nada.
    // Esto previene loops y fetchs innecesarios.
    if (loadedDateRef.current === date) {
      // Nos aseguramos de sincronizar el estado visual por si acaso, 
      // pero sin disparar network request.
      setSelectedDate(date)
      return
    }

    setLoading(true)
    setSelectedDate(date)
    try {
      const data = await getSalesWithItems(date, date)

      // Ya viene filtrado por fecha desde el backend
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      })
      setSales(sorted)
      // Marcar esta fecha como "cargada y válida"
      loadedDateRef.current = date
    } catch (error) {
      console.error('Error loading sales:', error)
      toast.error('Error al cargar historial de ventas')
      // Si falló, no marcamos como cargada para permitir reintento
      loadedDateRef.current = null
      setSales([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handleSalesUpdated = () => {
      // If we have a selected date, we should reload it.
      // invalidateSalesHistory() is not enough because it doesn't trigger fetch.
      // But we can just set loadedDateRef to null and call fetchSales(selectedDate) if selectedDate exists.
      loadedDateRef.current = null
      if (selectedDate) {
        fetchSales(selectedDate)
      }
    }
    window.addEventListener('sales-updated', handleSalesUpdated)
    return () => window.removeEventListener('sales-updated', handleSalesUpdated)
  }, [selectedDate, fetchSales])

  const invalidateSalesHistory = useCallback(() => {
    // Forzamos a que la próxima llamada a fetchSales(date) sí ejecute.
    loadedDateRef.current = null
  }, [])

  const setSalesWrapper = useCallback((newSales: SaleWithDetails[]) => {
    setSales(newSales)
  }, [])

  const contextValue = useMemo(() => ({
    sales,
    loading,
    selectedDate,
    fetchSales,
    invalidateSalesHistory,
    setSales: setSalesWrapper
  }), [sales, loading, selectedDate, fetchSales, invalidateSalesHistory, setSalesWrapper])

  return (
    <SalesHistoryContext.Provider value={contextValue}>
      {children}
    </SalesHistoryContext.Provider>
  )
}

export function useSalesHistory() {
  const context = useContext(SalesHistoryContext)
  if (context === undefined) {
    throw new Error('useSalesHistory must be used within a SalesHistoryProvider')
  }
  return context
}
