import { ipcMain } from 'electron'
import { createReportService } from './service'

export function registerReportHandlers(service: ReturnType<typeof createReportService>) {
  // ========================
  // REPORTES DE VENTAS
  // ========================

  ipcMain.handle('reports:daily', async (_, start, end) => {
    try {
      return await service.getDailyReport(start, end)
    } catch (error) {
      console.error('Error in reports:daily:', error)
      throw error
    }
  })

  ipcMain.handle('reports:sale-detail', async (_, saleId) => {
    try {
      return await service.getSaleDetail(saleId)
    } catch (error) {
      console.error('Error in reports:sale-detail:', error)
      throw error
    }
  })

  // ========================
  // PRODUCTOS MÁS VENDIDOS
  // ========================

  // Para POS
  ipcMain.handle('reports:top-products', async () => {
    try {
      return await service.getTopProducts()
    } catch (error) {
      console.error('Error in reports:top-products:', error)
      throw error
    }
  })

  // Para reportes con fechas
  ipcMain.handle('reports:top-products-by-date', async (_, start, end) => {
    try {
      return await service.getTopProductsByDateRange(start, end)
    } catch (error) {
      console.error('Error in reports:top-products-by-date:', error)
      throw error
    }
  })

  ipcMain.handle('reports:low-stock', async () => {
    try {
      return await service.getLowStockProducts()
    } catch (error) {
      console.error('Error in reports:low-stock:', error)
      throw error
    }
  })
}
