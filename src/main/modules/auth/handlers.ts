import { ipcMain } from 'electron'
import { createAuthService } from './service'

export function registerAuthHandlers(service: ReturnType<typeof createAuthService>) {
    ipcMain.handle('auth:login', async (_, { username, password }) => {
        try {
            const user = service.login(username, password)
            return { success: true, user }
        } catch (error: any) {
            // Return error object instead of throwing to avoid noise in terminal
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle('auth:auto-login', async () => {
        try {
            return service.autoLoginDefault()
        } catch (error: any) {
            // If feature flag is on, this might throw, which is expected
            throw error
        }
    })

    ipcMain.handle('auth:get-config', async () => {
        return service.getFeatureConfig()
    })
}
