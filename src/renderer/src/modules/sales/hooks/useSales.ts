import { useContext } from 'react'
import { SalesContext, SalesContextType } from '../context/SalesContext'

export const useSales = (): SalesContextType => {
  const context = useContext(SalesContext)
  if (!context) {
    throw new Error('useSales debe usarse dentro de un SalesProvider')
  }
  return context
}
