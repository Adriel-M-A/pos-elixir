import { ipcInvoke } from '../../../utils/ipc'
import type { SaleWithDetails } from '@types'

export function createSale(data: {
  paymentMethodId: number
  items: Array<{ productId: number; unitPrice: number; quantity: number }>
  promotions?: Array<{ promotionId: number; promotionName: string; discountAmount: number }>
  userId?: number
  source?: 'LOCAL' | 'ONLINE'
}) {
  return ipcInvoke('sales:create', data)
}

export function getSalesWithItems(
  startDate?: string,
  endDate?: string
): Promise<SaleWithDetails[]> {
  return ipcInvoke('sales:getAllWithItems', { startDate, endDate })
}

export function cancelSale(id: number): Promise<boolean> {
  return ipcInvoke('sales:cancel', id)
}
