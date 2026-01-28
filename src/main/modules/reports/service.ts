import type { SalesComparison, SalesSummary, TopProduct } from '@types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: string) {
  // Asegurar interpretación consistente en la zona horaria local
  return new Date(`${value}T00:00:00`)
}

function getRangeInfo(start: string, end: string) {
  const startDate = parseDate(start)
  const endDate = parseDate(end)
  const diffDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1
  )

  let periodType: SalesComparison['periodType']
  let periodLabel: string

  if (diffDays === 1) {
    periodType = 'day'
    periodLabel = 'ayer'
  } else if (diffDays <= 7) {
    periodType = 'week'
    periodLabel = 'la semana pasada'
  } else if (diffDays <= 15) {
    periodType = 'fortnight'
    periodLabel = 'la quincena pasada'
  } else if (diffDays <= 31) {
    periodType = 'month'
    periodLabel = 'el mes pasado'
  } else {
    periodType = 'custom'
    periodLabel = 'el período anterior'
  }

  const shiftDays = diffDays
  const previousStartDate = new Date(startDate)
  previousStartDate.setDate(previousStartDate.getDate() - shiftDays)
  const previousEndDate = new Date(endDate)
  previousEndDate.setDate(previousEndDate.getDate() - shiftDays)

  return {
    periodType,
    periodLabel,
    previousRange: {
      start: formatDate(previousStartDate),
      end: formatDate(previousEndDate)
    }
  }
}

function safeSummary(summary?: SalesSummary): SalesSummary {
  return (
    summary ?? {
      totalSales: 0,
      totalAmount: 0,
      totalDiscount: 0,
      totalFinal: 0
    }
  )
}

function percentDelta(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }
  return ((current - previous) / previous) * 100
}

function buildComparison(
  current: SalesSummary,
  previous: SalesSummary,
  meta: ReturnType<typeof getRangeInfo>
): SalesComparison {
  const currentAverage = current.totalSales > 0 ? current.totalFinal / current.totalSales : 0
  const previousAverage = previous.totalSales > 0 ? previous.totalFinal / previous.totalSales : 0

  return {
    periodType: meta.periodType,
    periodLabel: meta.periodLabel,
    previousRange: meta.previousRange,
    previousValues: {
      totalFinal: previous.totalFinal,
      totalSales: previous.totalSales,
      averageTicket: previousAverage
    },
    deltas: {
      totalFinal: percentDelta(current.totalFinal, previous.totalFinal),
      totalSales: percentDelta(current.totalSales, previous.totalSales),
      averageTicket: percentDelta(currentAverage, previousAverage)
    }
  }
}

export function createReportService(repository: any) {
  return {
    // ========================
    // REPORTES DE VENTAS
    // ========================

    getDailyReport(start: string, end: string) {
      const sales = repository.getSalesByDateRange(start, end)
      const summary = safeSummary(repository.getSalesSummary(start, end))
      const byPaymentMethod = repository.getPaymentMethodSummary(start, end)

      const rangeInfo = getRangeInfo(start, end)
      const previousSummary = safeSummary(
        repository.getSalesSummary(rangeInfo.previousRange.start, rangeInfo.previousRange.end)
      )
      const comparison = buildComparison(summary, previousSummary, rangeInfo)

      return {
        sales,
        summary,
        byPaymentMethod,

        comparison
      }
    },

    getSaleDetail(saleId: number) {
      return repository.getSaleDetail(saleId)
    },

    // ========================
    // PRODUCTOS MÁS VENDIDOS
    // ========================

    // Para POS (histórico)
    getTopProducts(): TopProduct[] {
      return repository.getTopProducts()
    },

    // Para reportes (por rango de fechas)
    getTopProductsByDateRange(start: string, end: string): TopProduct[] {
      return repository.getTopProductsByDateRange(start, end)
    },

    getLowStockProducts() {
      return repository.getLowStockProducts()
    }
  }
}
