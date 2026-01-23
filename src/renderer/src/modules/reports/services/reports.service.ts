import { ipcInvoke } from '../../../utils/ipc'
import type {
  DailySaleRow,
  SalesSummary,
  PaymentMethodSummary,
  TopProduct,
  Sale,
  SalesComparison
} from '@types'

export interface DailyReportResponse {
  sales: DailySaleRow[]
  summary: SalesSummary
  byPaymentMethod: (PaymentMethodSummary & { name: string })[]
  comparison: SalesComparison
}

export function fetchDailyReport(start: string, end: string): Promise<DailyReportResponse> {
  return ipcInvoke<DailyReportResponse>('reports:daily', start, end)
}

export function fetchSaleDetail(saleId: number): Promise<Sale> {
  return ipcInvoke<Sale>('reports:sale-detail', saleId)
}

export function fetchTopProducts(): Promise<TopProduct[]> {
  return ipcInvoke<TopProduct[]>('reports:top-products')
}

export function fetchTopProductsByDate(start: string, end: string): Promise<TopProduct[]> {
  return ipcInvoke<TopProduct[]>('reports:top-products-by-date', start, end)
}

export function fetchLowStockProducts(): Promise<
  {
    id: number
    name: string
    stock: number
    minStock: number
    price: number
  }[]
> {
  return ipcInvoke('reports:low-stock')
}
