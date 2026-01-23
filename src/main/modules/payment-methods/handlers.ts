import { ipcMain } from 'electron'
import { createPaymentMethodService } from './service'

export function registerPaymentMethodHandlers(service: ReturnType<typeof createPaymentMethodService>) {
  ipcMain.handle('payment-methods:create', async (_, data) => {
    try {
      return await service.create(data)
    } catch (error) {
      console.error('Error in payment-methods:create:', error)
      throw error
    }
  })

  ipcMain.handle('payment-methods:list', async () => {
    try {
      return await service.list()
    } catch (error) {
      console.error('Error in payment-methods:list:', error)
      throw error
    }
  })

  ipcMain.handle('payment-methods:update', async (_, id, data) => {
    try {
      return await service.update(id, data)
    } catch (error) {
      console.error('Error in payment-methods:update:', error)
      throw error
    }
  })

  ipcMain.handle('payment-methods:toggle', async (_, id, data) => {
    try {
      return await service.toggle(id, data)
    } catch (error) {
      console.error('Error in payment-methods:toggle:', error)
      throw error
    }
  })
}
