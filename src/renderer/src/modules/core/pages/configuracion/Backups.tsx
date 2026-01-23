import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/DataTable'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
// Si no existe Select, usaremos un select nativo por ahora para evitar errores, o verificar en el siguiente paso
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  ShieldCheck,
  AlertTriangle,
  Save,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  FolderOpen
} from 'lucide-react'
import { toast } from 'sonner'

export default function Backups() {
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState({
    backupPath: '',
    autoBackup: false,
    backupInterval: 1
  })

  const fetchBackups = async () => {
    try {
      const res = await (window as any).api.invoke('backup:list')
      if (res.success) {
        setBackups(res.backups)
        setConfig(prev => ({ ...prev, backupPath: res.path, ...res.config }))
      }
    } catch (error) {
      console.error("Error fetching backups", error)
    }
  }

  const updateConfig = async (newValues: any) => {
    try {
      const newConfig = await (window as any).api.invoke('backup:set-config', newValues)
      setConfig(newConfig)
      if (newValues.backupPath) fetchBackups()
      toast.success('Configuración guardada')
    } catch (error) {
      toast.error('Error guardando configuración')
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await (window as any).api.invoke('backup:create', 'manual')
      if (res.success) {
        toast.success('Respaldo creado correctamente')
        fetchBackups()
      } else {
        console.error('Backup failed:', res)
        toast.error('Error al crear respaldo')
      }
    } catch (e) {
      console.error('Backup Error Catch:', e)
      toast.error('Error de conexión o backend')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (filename: string) => {
    toast.info('Iniciando restauración...')
    try {
      const res = await (window as any).api.invoke('backup:restore', filename)
      if (!res.success) {
        toast.error(res.message || 'Error al restaurar')
      }
    } catch (e) {
      // App reinicia
    }
  }

  const handleDelete = async (filename: string) => {
    try {
      const res = await (window as any).api.invoke('backup:delete', filename)
      if (res.success) {
        toast.success('Archivo eliminado')
        fetchBackups()
      } else {
        toast.error(res.message || 'Error al eliminar')
      }
    } catch (e) {
      console.error('Delete error:', e)
      toast.error('Error eliminando archivo')
    }
  }

  const handleExport = async (filename: string) => {
    const res = await (window as any).api.invoke('backup:export', filename)
    if (res.success) toast.success(`Exportado a: ${res.path}`)
  }

  const handleImport = async () => {
    const res = await (window as any).api.invoke('backup:import')
    if (res.success) {
      toast.success('Respaldo importado y copiado al directorio local')
      fetchBackups()
    }
  }

  const handleSelectFolder = async () => {
    const newPath = await (window as any).api.invoke('backup:select-folder')
    if (newPath) {
      updateConfig({ backupPath: newPath })
    }
  }

  const handleOpenFolder = () => {
    (window as any).api.invoke('backup:open-folder')
  }

  const columns = [
    {
      key: 'name',
      label: 'Nombre de Archivo',
      className: 'pl-6 font-medium font-mono text-xs text-muted-foreground w-[240px]'
    },
    {
      key: 'path',
      label: 'Ubicación',
      className: 'text-xs text-muted-foreground hidden md:table-cell truncate max-w-[200px]'
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      className: ''
    },
    {
      key: 'size',
      label: 'Tamaño',
      className: ''
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right pr-6'
    }
  ]

  const data = backups.map(b => ({
    name: b.name,
    path: b.path,
    createdAt: new Date(b.createdAt).toLocaleString(),
    size: (b.size / 1024 / 1024).toFixed(2) + ' MB',
    actions: (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Exportar" onClick={() => handleExport(b.name)}>
          <Download className="h-4 w-4 text-blue-500" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/20">
              <RotateCcw className="h-4 w-4 text-orange-600" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Restaurar Sistema?</AlertDialogTitle>
              <AlertDialogDescription>
                Se volverá al estado del <b>{new Date(b.createdAt).toLocaleString()}</b>.<br />
                La aplicación se <b>reiniciará automáticamente</b>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleRestore(b.name)} className="bg-orange-600">
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar Respaldo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el archivo <b>{b.name}</b> permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(b.name)} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }))

  const lastBackup = backups.length > 0 ? new Date(backups[0].createdAt) : null
  const isHealthy = lastBackup
    ? new Date().getTime() - lastBackup.getTime() < (config.backupInterval + 1) * 24 * 60 * 60 * 1000
    : false

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b pb-4 items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Copias de Seguridad</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm">Gestión de respaldos y restauración.</p>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-1 text-sm font-medium">
              {isHealthy ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-orange-600" />}
              <span className={isHealthy ? 'text-green-700' : 'text-orange-700'}>
                {isHealthy ? 'Sistema Protegido' : 'Riesgo (Sin copias recientes)'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" /> Importar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={loading}>
                <Save className="mr-2 h-4 w-4" /> Nuevo Respaldo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Crear Nuevo Respaldo</AlertDialogTitle>
                <AlertDialogDescription>
                  {backups.length >= 10
                    ? <span className="text-orange-600 font-bold block mb-2">⚠ ¡Atención! Se ha alcanzado el límite de 10 copias.</span>
                    : null
                  }
                  {backups.length >= 10
                    ? "Al crear este nuevo respaldo, se eliminará automáticamente la copia más antigua para mantener el límite. ¿Desea continuar?"
                    : "¿Está seguro de que desea crear un nuevo respaldo manual ahora?"
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreate}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* DASHBOARD - CONFIGURACION ONLY */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-3 border-b mb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Configuración
              <span className="text-xs font-normal text-muted-foreground">
                Peso Total: {(backups.reduce((acc, b) => acc + b.size, 0) / 1024 / 1024).toFixed(2)} MB
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">

              {/* Auto Backup Toggle */}
              <div className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-backup" className="font-semibold cursor-pointer">Backup Automático</Label>
                  <Checkbox id="auto-backup" checked={config.autoBackup} onCheckedChange={(c) => updateConfig({ autoBackup: !!c })} />
                </div>
                <p className="text-xs text-muted-foreground leading-tight">
                  Crea un respaldo automáticamente al iniciar la aplicación.
                </p>
              </div>

              {/* Interval Select */}
              <div className="space-y-2">
                <Label className="font-semibold">Frecuencia</Label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={config.backupInterval}
                  onChange={(e) => updateConfig({ backupInterval: Number(e.target.value) })}
                  disabled={!config.autoBackup}
                >
                  <option value="1">Diario (1 día)</option>
                  <option value="5">Cada 5 días</option>
                  <option value="10">Cada 10 días</option>
                  <option value="15">Quincenal (15 días)</option>
                  <option value="30">Mensual (30 días)</option>
                  <option value="90">Trimestral (90 días)</option>
                </select>
              </div>

              {/* Path Selector */}
              <div className="space-y-2">
                <Label className="font-semibold">Ubicación</Label>
                <div className="flex gap-2">
                  <div
                    className="flex-1 text-xs border rounded px-2 py-2 truncate bg-muted cursor-pointer hover:bg-muted/80 flex items-center h-10"
                    onClick={handleOpenFolder}
                    title={config.backupPath}
                  >
                    {config.backupPath || 'Seleccionar ruta...'}
                  </div>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={handleSelectFolder}>
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <DataTable
        title="Historial de Respaldos Local"
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No hay respaldos en esta ubicación."
        action={<Badge variant="secondary">{backups.length} Archivos</Badge>}
      />
    </div>
  )
}
