import { ipcMain } from 'electron'
import { createCategoryService } from './service'

export function registerCategoryHandlers(service: ReturnType<typeof createCategoryService>) {
  ipcMain.handle('categories:create', async (_, data) => {
    try {
      return await service.create(data)
    } catch (error) {
      console.error('Error in categories:create:', error)
      throw error
    }
  })

  ipcMain.handle('categories:list', async () => {
    try {
      return await service.list()
    } catch (error) {
      console.error('Error in categories:list:', error)
      throw error
    }
  })

  ipcMain.handle('categories:update', async (_, id, data) => {
    try {
      return await service.update(id, data)
    } catch (error) {
      console.error('Error in categories:update:', error)
      throw error
    }
  })

  ipcMain.handle('categories:toggle', async (_, id, data) => {
    try {
      return await service.toggle(id, data)
    } catch (error) {
      console.error('Error in categories:toggle:', error)
      throw error
    }
  })

  ipcMain.handle('categories:delete', async (_, id) => {
    try {
      return await service.delete(id)
    } catch (error) {
      console.error('Error in categories:delete:', error)
      throw error
    }
  })

  ipcMain.handle('categories:count-products', async (_, id) => {
    try {
      return service.countProducts(id)
    } catch (error) {
      console.error('Error in categories:count-products:', error)
      throw error
    }
  })
}
