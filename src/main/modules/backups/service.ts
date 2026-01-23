import type { Database } from 'better-sqlite3'
import { app, dialog, shell } from 'electron'
import { join } from 'path'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync, readFileSync, writeFileSync } from 'fs'

interface BackupConfig {
    backupPath: string
    autoBackup: boolean
    backupInterval: number // días
    lastAutoBackup: number | null // timestamp
}

export function createBackupService(db: Database) {
    const userDataPath = app.getPath('userData')
    const configPath = join(userDataPath, 'backup-config.json')

    // Default path: Documents/Backups or app data if documents not available
    const defaultBackupPath = join(app.getPath('documents'), 'Backups')

    // Cargar o crear configuración
    let config: BackupConfig = {
        backupPath: defaultBackupPath,
        autoBackup: false,
        backupInterval: 1, // 1 día por defecto
        lastAutoBackup: null
    }

    function loadConfig() {
        try {
            if (existsSync(configPath)) {
                const fileContent = readFileSync(configPath, 'utf-8')
                config = { ...config, ...JSON.parse(fileContent) }
            } else {
                saveConfig()
            }
        } catch (error) {
            console.error('Error cargando config de backups:', error)
        }
    }

    function saveConfig() {
        try {
            writeFileSync(configPath, JSON.stringify(config, null, 2))
        } catch (error) {
            console.error('Error guardando config de backups:', error)
        }
    }

    // Inicializar
    loadConfig()

    // Asegurar directorio actual (siempre debe terminar en Backups, si no, lo ajustamos)
    if (!config.backupPath.endsWith('Backups')) {
        config.backupPath = join(config.backupPath, 'Backups')
        saveConfig()
    }

    if (!existsSync(config.backupPath)) {
        try {
            mkdirSync(config.backupPath, { recursive: true })
        } catch (e) {
            console.error("No se pudo crear backup path, fallback a default", e)
            config.backupPath = defaultBackupPath
            saveConfig()
            if (!existsSync(config.backupPath)) mkdirSync(config.backupPath, { recursive: true })
        }
    }

    // Verificar Auto-Backup al iniciar
    if (config.autoBackup) {
        if (!app.isPackaged) {
        } else {
            const now = Date.now()
            const last = config.lastAutoBackup || 0
            const intervalMs = config.backupInterval * 24 * 60 * 60 * 1000

            if (now - last > intervalMs) {
                // Pequeño delay para no bloquear inicio critico
                setTimeout(() => {
                    service.create('auto').then(() => {
                        config.lastAutoBackup = Date.now()
                        saveConfig()
                    }).catch(err => console.error("Error en auto-backup:", err))
                }, 5000)
            }
        }
    }

    const service = {
        async create(type: 'manual' | 'auto') {
            try {
                if (!db.open) {
                    throw new Error("Database connection is closed")
                }


                if (!existsSync(config.backupPath)) {
                    mkdirSync(config.backupPath, { recursive: true })
                }

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
                const filename = `backup-${type}-${timestamp}.db`
                const destination = join(config.backupPath, filename)


                await db.backup(destination)


                // Cleanup old backups (keep last 10)
                const backups = service.list()
                if (backups.length > 10) {
                    const toDelete = backups.slice(10) // backups are sorted desc by date, so >10 are oldest
                    toDelete.forEach(b => {
                        try {
                            unlinkSync(b.path)
                        } catch (e) {
                            console.error('[Backup Debug] Failed to delete old backup:', e)
                        }
                    })
                }

                return { success: true, path: destination, filename }
            } catch (error) {
                console.error('[Backup Debug] FAILED:', error)
                throw error
            }
        },

        list() {
            try {
                if (!existsSync(config.backupPath)) return []

                const files = readdirSync(config.backupPath).filter(f => f.endsWith('.db'))

                return files.map(file => {
                    const stats = statSync(join(config.backupPath, file))
                    return {
                        name: file,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        path: join(config.backupPath, file)
                    }
                }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            } catch (error) {
                console.error('Error listando backups:', error)
                return []
            }
        },

        restore(filename: string) {
            const backupPath = join(config.backupPath, filename)
            if (!existsSync(backupPath)) {
                throw new Error('Archivo de respaldo no encontrado')
            }

            const dbPath = db.name

            // Hacemos copia de seguridad antes de restaurar por si acaso "pre-restore"
            const preRestorePath = join(config.backupPath, `pre-restore-${Date.now()}.db.bak`)
            try {
                db.backup(preRestorePath)
            } catch (e) { console.warn("No se pudo hacer backup pre-restore", e) }

            db.close()

            try {
                copyFileSync(backupPath, dbPath)
                if (app.isPackaged) {
                    app.relaunch()
                    app.exit(0)
                } else {
                    app.exit(0)
                }
                return { success: true }
            } catch (error) {
                console.error('Error restaurando backup:', error)
                throw error
            }
        },

        delete(filename: string) {
            const path = join(config.backupPath, filename)
            if (existsSync(path)) {
                try {
                    unlinkSync(path)
                    return { success: true }
                } catch (error: any) {
                    console.error('Error eliminando archivo:', error)
                    return { success: false, message: error.message }
                }
            }
            return { success: false, message: 'Archivo no encontrado' }
        },

        getConfig() {
            return config
        },

        setConfig(newConfig: Partial<BackupConfig>) {
            config = { ...config, ...newConfig }
            // Enforce "Backups" folder
            if (!config.backupPath.endsWith('Backups')) {
                config.backupPath = join(config.backupPath, 'Backups')
            }

            // Validar existencia de nuevo path
            if (!existsSync(config.backupPath)) {
                try {
                    mkdirSync(config.backupPath, { recursive: true })
                } catch (e) {
                    throw new Error("No se pudo crear el directorio especificado")
                }
            }
            saveConfig()
            return config
        },

        async selectFolder() {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory', 'createDirectory'],
                defaultPath: config.backupPath
            })

            if (!result.canceled && result.filePaths.length > 0) {
                let selectedPath = result.filePaths[0]
                // Force "Backups" subfolder logic
                if (!selectedPath.endsWith('Backups') && !selectedPath.endsWith('Backups\\') && !selectedPath.endsWith('Backups/')) {
                    selectedPath = join(selectedPath, 'Backups')
                }
                return selectedPath
            }
            return null
        },

        async export(filename: string) {
            const sourcePath = join(config.backupPath, filename)
            if (!existsSync(sourcePath)) throw new Error('Backup no encontrado')

            const { filePath } = await dialog.showSaveDialog({
                title: 'Exportar Backup',
                defaultPath: filename,
                filters: [{ name: 'SQLite Database', extensions: ['db'] }]
            })

            if (filePath) {
                copyFileSync(sourcePath, filePath)
                return { success: true, path: filePath }
            }
            return { success: false, message: 'Cancelado' }
        },

        async import() {
            const { filePaths } = await dialog.showOpenDialog({
                title: 'Importar Backup',
                properties: ['openFile'],
                filters: [{ name: 'SQLite Database', extensions: ['db'] }]
            })

            if (filePaths.length > 0) {
                const sourcePath = filePaths[0]
                const filename = `imported-${Date.now()}.db`
                const destPath = join(config.backupPath, filename)

                copyFileSync(sourcePath, destPath)
                return { success: true, filename }
            }
            return { success: false, message: 'Cancelado' }
        },

        openFolder() {
            if (existsSync(config.backupPath)) {
                shell.openPath(config.backupPath)
                return { success: true }
            }
            return { success: false }
        }
    }

    return service
}
