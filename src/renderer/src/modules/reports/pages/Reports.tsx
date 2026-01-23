import { useCallback, useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Filter, DollarSign, ShoppingBag, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '../../../utils/currency'
import type { ComparisonPeriod, PaymentMethodSummary } from '@types'
import { SummaryMetricCard } from '../components/SummaryMetricCard'
import { RevenueTrendChart } from '../components/RevenueTrendChart'
import { useReports } from '../context/ReportsContext'
import { ReportsLoading } from '../components/ReportsLoading'
import { PaymentMethodsChart } from '../components/PaymentMethodsChart'
import { TopProductsTable } from '../components/TopProductsTable'
import { LowStockTable } from '../components/LowStockTable'
import { ReportsFilterSheet, DateFilterPreset } from '../components/ReportsFilterSheet'

function sortPaymentMethods(methods: (PaymentMethodSummary & { name: string })[]) {
  return methods.slice().sort((a, b) => b.totalFinal - a.totalFinal)
}

export default function Reports() {
  const { data, topProducts, lowStockProducts, loading, fetchReports, filterPreset } = useReports()
  const comparison = data?.comparison
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handleFilterApply = useCallback(
    (
      range: { start: string; end: string },
      meta: { filterType: DateFilterPreset }
    ) => {
      fetchReports(range, meta)
    },
    [fetchReports]
  )

  // Initial load logic - Replicating DateFilterSection behavior
  useEffect(() => {
    // Only fetch if no data is present (initial load)
    if (!data && !loading) {
      const today = new Date()
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      const range = { start: formatDate(today), end: formatDate(today) }

      // Use 'hoy' as default preset
      fetchReports(range, { filterType: 'hoy' })
    }
  }, [data, loading, fetchReports])

  // Ctrl+N Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setIsFilterOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Cálculos basados estrictamente en tus interfaces
  const total = data?.summary?.totalFinal || 0 // Usa totalFinal de SalesSummary
  const count = data?.summary?.totalSales || 0 // Usa totalSales de SalesSummary
  const averageSale = count > 0 ? total / count : 0
  const paymentMethods = data ? sortPaymentMethods(data.byPaymentMethod) : []

  const periodLabelMap: Record<ComparisonPeriod, string> = {
    day: 'día anterior',
    week: 'semana anterior',
    fortnight: 'quincena anterior',
    month: 'mes anterior',
    custom: 'rango anterior'
  }

  const presetLabelMap: Record<DateFilterPreset, string> = {
    hoy: 'día anterior',
    ayer: 'día anterior',
    semana: 'semana anterior',
    quincena: 'quincena anterior',
    mes: 'mes anterior',
    rango: 'rango anterior'
  }

  // Cast or map filterPreset if needed, assuming useReports types are compatible or updated
  // If useReports expects the old DateFilterPreset, we might need to cast or align types.
  // Assuming ReportsContext uses the string literals which are identical.

  const comparisonLabel =
    presetLabelMap[filterPreset as DateFilterPreset] ??
    (comparison ? periodLabelMap[comparison.periodType] : 'período anterior')

  const renderTrendRow = (
    value?: number,
    options?: {
      formatter?: (abs: number, isPositive: boolean) => string
    }
  ) => {
    if (!comparison || value === undefined || value === null || Number.isNaN(value)) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Minus className="h-3.5 w-3.5" />
          <span>Sin comparación disponible</span>
        </div>
      )
    }

    if (value === 0) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Minus className="h-3.5 w-3.5" />
          <span>Sin cambios vs {comparisonLabel}</span>
        </div>
      )
    }

    const isPositive = value > 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const color = isPositive ? 'text-emerald-500' : 'text-rose-500'
    const absValue = Math.abs(value)
    const formatted = options?.formatter
      ? options.formatter(absValue, isPositive)
      : `${absValue.toFixed(1)}%`

    return (
      <div className={`flex items-center gap-2 text-xs font-semibold ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>
          {formatted} vs {comparisonLabel}
        </span>
      </div>
    )
  }

  const previousSales = comparison?.previousValues.totalSales ?? 0
  const absoluteSalesDelta = comparison ? count - previousSales : undefined

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-hidden">
      {/* Fila 1: Título, Subtítulo y Filtros */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h1>
          <p className="text-muted-foreground">
            Resumen del período {comparisonLabel}
          </p>
        </div>
        <Button onClick={() => setIsFilterOpen(true)} variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <ReportsFilterSheet
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        onApply={handleFilterApply}
        initialPreset={filterPreset as DateFilterPreset}
      />

      {/* Fila 2: Contenido Dinámico */}
      <ScrollArea className="flex-1 min-h-0 pb-6">
        {loading ? (
          <ReportsLoading />
        ) : !data ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic gap-2">
            <Filter className="h-10 w-10 opacity-20" />
            <p>Selecciona un rango de fechas para visualizar los datos.</p>
          </div>
        ) : (
          <div className="space-y-6 p-4">
            {/* Grid de Tarjetas de Resumen */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryMetricCard
                title="Total Recaudado"
                value={formatCurrency(total)}
                icon={DollarSign}
                accentColor="text-emerald-600"
                accentBg="bg-emerald-50 dark:bg-emerald-500/10"
                trendContent={
                  comparison ? (
                    <div className="text-xs">{renderTrendRow(comparison.deltas.totalFinal)}</div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Basado en total final de ventas
                    </p>
                  )
                }
              />

              <SummaryMetricCard
                title="Cantidad de Ventas"
                value={count}
                icon={ShoppingBag}
                accentColor="text-sky-600"
                accentBg="bg-sky-50 dark:bg-sky-500/10"
                trendContent={
                  comparison ? (
                    <div className="text-xs">
                      {renderTrendRow(absoluteSalesDelta, {
                        formatter: (abs, isPositive) =>
                          `${abs} ventas ${isPositive ? 'más' : 'menos'}`
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Total de pedidos realizados</p>
                  )
                }
              />

              <SummaryMetricCard
                title="Ticket Promedio"
                value={formatCurrency(averageSale)}
                icon={TrendingUp}
                accentColor="text-amber-600"
                accentBg="bg-amber-50 dark:bg-amber-500/10"
                trendContent={
                  comparison ? (
                    <div className="text-xs">
                      {renderTrendRow(comparison.deltas.averageTicket)}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Venta promedio por cliente</p>
                  )
                }
              />
            </div>

            {/* Fila 2: Gráficos (Tendencia y Métodos de Pago) */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 min-h-[350px] lg:h-[400px]">
                <RevenueTrendChart sales={data.sales} />
              </div>
              <div className="lg:col-span-1 min-h-[350px] lg:h-[400px]">
                <PaymentMethodsChart data={paymentMethods} />
              </div>
            </div>

            {/* Fila 3: Tablas (Bajo Stock y Top Productos) */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-[400px]">
                <LowStockTable products={lowStockProducts} />
              </div>
              <div className="h-[400px]">
                <TopProductsTable products={topProducts} />
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
