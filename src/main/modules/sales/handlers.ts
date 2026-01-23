import { ipcMain } from 'electron'
import { createSaleService } from './service'

export function registerSaleHandlers(service: ReturnType<typeof createSaleService>) {
  ipcMain.handle('sales:create', async (_, data) => {
    try {
      return await service.create(data)
    } catch (error) {
      console.error('Error in sales:create:', error)
      throw error
    }
  })

  ipcMain.handle('sales:getAllWithItems', async (_, { startDate, endDate }) => {
    try {
      return await service.findAllWithItems(startDate, endDate)
    } catch (error) {
      console.error('Error in sales:getAllWithItems:', error)
      throw error
    }
  })

  ipcMain.handle('sales:cancel', async (_, id) => {
    try {
      return await service.cancel(id)
    } catch (error) {
      console.error('Error in sales:cancel:', error)
      throw error
    }
  })
}
