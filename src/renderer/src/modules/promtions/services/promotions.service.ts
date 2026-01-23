import { ipcInvoke } from '../../../utils/ipc'
import type { Promotion } from '@types'

export function fetchPromotions(): Promise<Promotion[]> {
  return ipcInvoke<Promotion[]>('promotions:list')
}

export function getPromotion(id: number): Promise<Promotion> {
  return ipcInvoke<Promotion>('promotions:get', id)
}

export function createPromotion(
  data: Omit<Promotion, 'id' | 'createdAt' | 'isActive'> & {
    products: { productId: number; requiredQty: number }[]
  }
): Promise<Promotion> {
  return ipcInvoke<Promotion>('promotions:create', data)
}

export function updatePromotion(
  id: number,
  data: Partial<Omit<Promotion, 'id' | 'createdAt'>>
): Promise<void> {
  return ipcInvoke<void>('promotions:update', id, data)
}

export function togglePromotion(id: number, isActive: boolean): Promise<void> {
  return ipcInvoke<void>('promotions:toggle', id, { isActive })
}

export function deletePromotion(id: number): Promise<void> {
  return ipcInvoke<void>('promotions:delete', id)
}
