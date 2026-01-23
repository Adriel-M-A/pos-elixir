import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { Flavor } from '@shared/types'
import {
    fetchFlavors,
    createFlavor,
    updateFlavor,
    updateFlavorStock,
    deleteFlavor as deleteFlavorService
} from '../services/flavors.service'

export interface FlavorsContextValue {
    flavors: Flavor[]
    loading: boolean
    reload: () => Promise<void>
    addFlavor: (data: Omit<Flavor, 'id'>) => Promise<boolean>
    editFlavor: (id: number, data: Partial<Omit<Flavor, 'id'>>) => Promise<boolean>
    updateStock: (id: number, stock: number) => Promise<void>
    removeFlavor: (id: number) => Promise<void>
}

const FlavorsContext = createContext<FlavorsContextValue | null>(null)

export function FlavorsProvider({ children }: { children: React.ReactNode }) {
    const [flavors, setFlavors] = useState<Flavor[]>([])
    const [loading, setLoading] = useState(false)

    const loadFlavors = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchFlavors()
            setFlavors(data)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadFlavors()
    }, [loadFlavors])

    const addFlavor = useCallback<FlavorsContextValue['addFlavor']>(async (data) => {
        try {
            await createFlavor(data)
            await loadFlavors()
            return true
        } catch (error) {
            console.error(error)
            return false
        }
    }, [loadFlavors])

    const editFlavor = useCallback<FlavorsContextValue['editFlavor']>(async (id, data) => {
        try {
            await updateFlavor(id, data)
            await loadFlavors()
            return true
        } catch (error) {
            console.error(error)
            return false
        }
    }, [loadFlavors])

    const updateStock = useCallback<FlavorsContextValue['updateStock']>(async (id, stock) => {
        await updateFlavorStock(id, stock)
        setFlavors(prev => prev.map(f => f.id === id ? { ...f, stock } : f))
    }, [])

    const removeFlavor = useCallback<FlavorsContextValue['removeFlavor']>(async (id) => {
        await deleteFlavorService(id)
        setFlavors(prev => prev.filter(f => f.id !== id))
    }, [])

    const contextValue = useMemo(() => ({
        flavors,
        loading,
        reload: loadFlavors,
        addFlavor,
        editFlavor,
        updateStock,
        removeFlavor
    }), [flavors, loading, loadFlavors, addFlavor, editFlavor, updateStock, removeFlavor])

    return (
        <FlavorsContext.Provider value={contextValue}>
            {children}
        </FlavorsContext.Provider>
    )
}

export function useFlavorsContext(): FlavorsContextValue {
    const context = useContext(FlavorsContext)
    if (!context) {
        throw new Error('useFlavorsContext must be used within FlavorsProvider')
    }
    return context
}
