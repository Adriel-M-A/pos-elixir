import { app, shell, BrowserWindow, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/estadisticas.ico?asset'

import { initDB, getDB } from './modules/core/database'
import { runMigrations } from './modules/core/migrations'
import { initModules } from './modules/core/modules'
import { setupWindowIPC } from './modules/core/window.ipc'
import fs from 'fs'

// Logging helpers
const logPath = join(app.getPath('userData'), 'startup.log')

function logToFile(message: string) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}\n`
  try {
    fs.appendFileSync(logPath, logMessage)
  } catch (err) {
    console.error('Failed to write to log file:', err)
  }
}



function createWindow(): void {

  try {
    const mainWindow = new BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      autoHideMenuBar: true,
      frame: false,
      resizable: false, // Start non-resizable (Login state)
      icon, // Set icon for all platforms (Windows uses .ico)
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true
      }
    })

    mainWindow.on('ready-to-show', () => {
      mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      const url = details.url
      // Check if it is a standard web protocol
      const isExternalWeb = url.startsWith('http:') || url.startsWith('https:')
      // Check if it is the local dev server
      const isDevServer = process.env['ELECTRON_RENDERER_URL'] && url.startsWith(process.env['ELECTRON_RENDERER_URL'])

      // Only open in external browser if it is a web URL and NOT our dev server
      if (isExternalWeb && !isDevServer) {
        shell.openExternal(url)
      }
      return { action: 'deny' }
    })



    initDB()
    const db = getDB()


    runMigrations(db)


    initModules(db)


    setupWindowIPC(mainWindow)

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {

      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      const loadPath = join(__dirname, '../renderer/index.html')

      mainWindow.loadFile(loadPath)
    }
  } catch (error) {
    logToFile(`CRITICAL ERROR during window creation/initialization: ${error}`)
    dialog.showErrorBox('Error de Inicio', `Ocurrió un error crítico al iniciar: ${error}`)
    app.quit()
  }
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {

    electronApp.setAppUserModelId('com.electron')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    try {
      createWindow()
    } catch (e) {
      logToFile(`Error calling createWindow: ${e}`)
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('uncaughtException', (error) => {
  logToFile(`UNCAUGHT EXCEPTION: ${error.stack || error}`)
  dialog.showErrorBox('Error Inesperado', `Ocurrió un error inesperado: ${error.message}`)
})

process.on('unhandledRejection', (reason: any) => {
  const errorString = reason?.toString() || ''

  // Ignorar error de base de datos cerrada (común durante restauración de backup)
  if (errorString.includes('The database connection is not open')) {
    logToFile(`Ignored expected error during shutdown/restore: ${reason}`)
    return
  }

  logToFile(`UNHANDLED REJECTION: ${reason}`)
  dialog.showErrorBox('Error de Promesa', `Promesa rechazada sin control: ${reason}`)
})

