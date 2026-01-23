export interface Product {
  id: number
  name: string
  categoryId: number | null
  price: number
  priceDelivery?: number | null
  stock: number
  isStockControlled: boolean
  minStock: number
  isActive: boolean
  createdAt: string
  productType: 'UNIT' | 'WEIGHT'
}
