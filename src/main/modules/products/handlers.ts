import { ipcMain } from 'electron'
import { createProductService } from './service'

export function registerProductHandlers(service: ReturnType<typeof createProductService>) {
  ipcMain.handle('products:create', async (_, data) => {
    try {
      return await service.create(data)
    } catch (error) {
      console.error('Error in products:create:', error)
      throw error
    }
  })

  ipcMain.handle('products:list', async () => {
    try {
      return await service.list()
    } catch (error) {
      console.error('Error in products:list:', error)
      throw error
    }
  })

  ipcMain.handle('products:update', async (_, id, data) => {
    try {
      return await service.update(id, data)
    } catch (error) {
      console.error('Error in products:update:', error)
      throw error
    }
  })

  ipcMain.handle('products:toggle', async (_, id, data) => {
    try {
      return await service.toggle(id, data)
    } catch (error) {
      console.error('Error in products:toggle:', error)
      throw error
    }
  })

  ipcMain.handle('products:delete', async (_, id) => {
    try {
      return await service.delete(id)
    } catch (error) {
      console.error('Error in products:delete:', error)
      throw error
    }
  })

  ipcMain.handle('products:find-promotions', async (_, id) => {
    try {
      return await service.findPromotionsByProductId(id)
    } catch (error) {
      console.error('Error in products:find-promotions:', error)
      throw error
    }
  })
}
