import { createContext, useContext, useState, ReactNode, useCallback, useRef, useMemo, useEffect } from 'react'
import {
    fetchDailyReport,
    DailyReportResponse,
    fetchTopProductsByDate,
    fetchLowStockProducts
} from '../services/reports.service'
import type { DateFilterPreset } from '../../../components/DateFilterSection'

interface ReportsContextType {
    data: DailyReportResponse | null
    topProducts: any[]
    lowStockProducts: any[]
    loading: boolean
    currentRange: { start: string; end: string } | null
    filterPreset: DateFilterPreset
    fetchReports: (
        range: { start: string; end: string },
        meta?: { filterType: DateFilterPreset }
    ) => Promise<void>
    invalidateReports: () => void
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined)

export function ReportsProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<DailyReportResponse | null>(null)
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [currentRange, setCurrentRange] = useState<{ start: string; end: string } | null>(null)
    const [filterPreset, setFilterPreset] = useState<DateFilterPreset>('hoy')

    // Ref para cache: guardamos qué fue lo último que cargamos exitosamente
    const cacheRef = useRef<{
        start: string
        end: string
        filterType?: DateFilterPreset
    } | null>(null)



    // Ctrl+N Shortcut (Moved here or keep in page? The previous useEffect was in page. Context shouldn't handle shortcuts usually. Leaving checks.)

    // Ref para acceder al estado actual dentro de fetchReports sin añadir dependencia
    const filterPresetRef = useRef(filterPreset)
    useEffect(() => {
        filterPresetRef.current = filterPreset
    }, [filterPreset])

    const fetchReports = useCallback(async (
        range: { start: string; end: string },
        meta?: { filterType: DateFilterPreset }
    ) => {
        const targetType = meta?.filterType || filterPresetRef.current

        // Check cache via ref
        if (
            cacheRef.current &&
            cacheRef.current.start === range.start &&
            cacheRef.current.end === range.end &&
            // Si hay cambio de filtro aunque sea el mismo rango, idealmente refrescamos o actualizamos preset
            (cacheRef.current.filterType === targetType)
        ) {
            return
        }

        setLoading(true)
        if (meta?.filterType) {
            setFilterPreset(meta.filterType)
        }

        try {
            const [reportResponse, topProductsResponse, lowStockResponse] = await Promise.all([
                fetchDailyReport(range.start, range.end),
                fetchTopProductsByDate(range.start, range.end),
                fetchLowStockProducts()
            ])

            setData(reportResponse)
            setTopProducts(topProductsResponse)
            setLowStockProducts(lowStockResponse)
            setCurrentRange(range)

            // Update cache
            cacheRef.current = {
                start: range.start,
                end: range.end,
                filterType: targetType
            }
        } catch (error) {
            console.error('Error al cargar reporte:', error)
            // Invalidamos cache en error
            cacheRef.current = null
        } finally {
            setLoading(false)
        }
    }, [])

    const invalidateReports = useCallback(() => {
        cacheRef.current = null
        setData(null)
    }, [])

    useEffect(() => {
        const handleProductsUpdated = () => {
            invalidateReports()
        }

        window.addEventListener('products-updated', handleProductsUpdated)
        return () => window.removeEventListener('products-updated', handleProductsUpdated)
    }, [invalidateReports])

    const contextValue = useMemo(() => ({
        data,
        topProducts,
        lowStockProducts,
        loading,
        currentRange,
        filterPreset,
        fetchReports,
        invalidateReports
    }), [data, topProducts, lowStockProducts, loading, currentRange, filterPreset, fetchReports, invalidateReports])

    return (
        <ReportsContext.Provider value={contextValue}>
            {children}
        </ReportsContext.Provider>
    )
}

export function useReports() {
    const context = useContext(ReportsContext)
    if (context === undefined) {
        throw new Error('useReports must be used within a ReportsProvider')
    }
    return context
}
