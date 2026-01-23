import {
  Box,
  LayoutGrid,
  ShoppingCart,
  ChartPie,
  Tag,
  Receipt
} from 'lucide-react'
import { PERMISSIONS } from '@shared/types'

export const menuConfig = [
  {
    label: 'Punto de Venta',
    icon: ShoppingCart,
    path: '/pos',
    permission: PERMISSIONS.POS_ACCESS
  },
  {
    label: 'Productos',
    icon: Box,
    path: '/products',
    permission: PERMISSIONS.PRODUCTS_VIEW
  },
  {
    label: 'Categorias',
    icon: LayoutGrid,
    path: '/categories',
    permission: PERMISSIONS.CATEGORIES_VIEW
  },
  {
    label: 'Promociones',
    icon: Tag,
    path: '/promotions',
    permission: PERMISSIONS.PROMOTIONS_VIEW
  },
  {
    label: 'Historial de Ventas',
    icon: Receipt,
    path: '/sales',
    permission: PERMISSIONS.SALES_VIEW
  },
  {
    label: 'Reportes',
    icon: ChartPie,
    path: '/reports',
    permission: PERMISSIONS.REPORTS_VIEW
  },

]
