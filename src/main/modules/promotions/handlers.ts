import { ipcMain } from 'electron'
import { createPromotionService } from './service'

export function registerPromotionHandlers(service: ReturnType<typeof createPromotionService>) {
  ipcMain.handle('promotions:create', async (_, data) => {
    try {
      return await service.create(data)
    } catch (error) {
      console.error('Error in promotions:create:', error)
      throw error
    }
  })

  ipcMain.handle('promotions:list', async () => {
    try {
      return await service.list()
    } catch (error) {
      console.error('Error in promotions:list:', error)
      throw error
    }
  })

  ipcMain.handle('promotions:get', async (_, id) => {
    try {
      return await service.get(id)
    } catch (error) {
      console.error('Error in promotions:get:', error)
      throw error
    }
  })

  ipcMain.handle('promotions:update', async (_, id, data) => {
    try {
      return await service.update(id, data)
    } catch (error) {
      console.error('Error in promotions:update:', error)
      throw error
    }
  })

  ipcMain.handle('promotions:toggle', async (_, id, data) => {
    try {
      return await service.toggle(id, data)
    } catch (error) {
      console.error('Error in promotions:toggle:', error)
      throw error
    }
  })

  ipcMain.handle('promotions:delete', async (_, id) => {
    try {
      return await service.delete(id)
    } catch (error) {
      console.error('Error in promotions:delete:', error)
      throw error
    }
  })
}
