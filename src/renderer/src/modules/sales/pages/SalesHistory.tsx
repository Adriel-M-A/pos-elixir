import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Eye, FileText, XCircle } from 'lucide-react'
import { cancelSale } from '../services/sales.service'
import { type SaleWithDetails, PERMISSIONS, type AppConfig } from '@shared/types'
import { DataTable } from '../../../components/DataTable'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { formatCurrency } from '../../../utils/currency'
import { SaleDetailsSheet } from '../components/SaleDetailsSheet'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useSalesHistory } from '../context/SalesHistoryContext'
import { useReports } from '../../reports/context/ReportsContext'
import { useAuth } from '@/modules/auth/context/AuthContext'

export default function SalesHistory() {
  const { can } = useAuth()
  const { sales, loading, fetchSales, selectedDate } = useSalesHistory()
  const { invalidateReports } = useReports()

  // Local state for date picker (controlled), initializing from context or defaulting to today (Local Time)
  const [selectedDateState, setSelectedDateState] = useState(() => {
    if (selectedDate) return selectedDate
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

  // Estado para el Sheet de detalle
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Estado para el dialog de cancelación
  const [saleToCancel, setSaleToCancel] = useState<SaleWithDetails | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  // Estado para feature flag
  const [showUserColumn, setShowUserColumn] = useState(false)

  if (!can(PERMISSIONS.SALES_VIEW)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold tracking-tight">Acceso Restringido</h3>
          <p className="text-sm text-muted-foreground">
            No tienes permisos para ver el historial de ventas.
          </p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchSales(selectedDateState)
    // Check feature flag
    window.api.invoke<AppConfig>('auth:get-config').then((config) => {
      setShowUserColumn(config.ENABLE_USER_MANAGEMENT)
    })
  }, [selectedDateState, fetchSales])

  const columns = [
    { key: 'id', label: 'Ticket' },
    { key: 'date', label: 'Fecha y Hora' },
    { key: 'source', label: 'Origen' },
    ...(showUserColumn ? [{ key: 'user', label: 'Usuario' }] : []),
    { key: 'items', label: 'Resumen' },
    { key: 'payment', label: 'Método de Pago' },
    { key: 'discount', label: 'Descuento', className: 'text-right' },
    { key: 'total', label: 'Total', className: 'text-right' }
  ]

  if (can(PERMISSIONS.SALES_CANCEL)) {
    columns.push({ key: 'actions', label: 'Acciones', className: 'text-right' })
  }

  const openDetails = (sale: SaleWithDetails) => {
    setSelectedSale(sale)
    setIsSheetOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!saleToCancel) return

    try {
      const success = await cancelSale(saleToCancel.id)
      if (success) {
        toast.success('Venta cancelada correctamente')
        // Dispatch events to trigger listeners
        window.dispatchEvent(new Event('sales-updated'))
        // Products context listens to this? No, I need to check.
        // SalesHistoryContext listens to sales-updated -> reloads sales.
        // ProductsContext listens to sales-updated? No. It listens to products-updated.
        // Does cancelSale trigger product updates? Yes (Stock).
        // So we should dispatch products-updated too.
        window.dispatchEvent(new Event('products-updated'))
        invalidateReports() // Reports listens to products-updated properly? Yes.
      } else {
        toast.error('No se pudo cancelar la venta')
      }
    } catch (error) {
      console.error('Error al cancelar venta:', error)
      toast.error('Error al cancelar la venta')
    } finally {
      setIsCancelDialogOpen(false)
      setSaleToCancel(null)
    }
  }



  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-hidden">
      {/* Header y Filtros */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center shrink-0 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Ventas</h1>
          <p className="text-muted-foreground">
            Consulta y audita todas las transacciones realizadas.
          </p>
        </div>

        {/* Selector de Fecha Simple */}
        <div className="flex items-center gap-2 bg-card border rounded-lg p-1 shadow-sm">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <input
              type="date"
              value={selectedDateState}
              onChange={(e) => setSelectedDateState(e.target.value)}
              className={cn(
                'h-10 bg-transparent pl-9 pr-3 text-sm font-medium focus:outline-none cursor-pointer',
                'text-foreground',
                'dark:scheme-dark'
              )}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Ventas (Usando DataTable genérica) */}
      <div className="flex-1 overflow-hidden min-h-0">
        <DataTable
          className="h-full"
          columns={columns}
          data={sales}
          loading={loading}
          emptyMessage="No se encontraron ventas para el rango seleccionado."
          renderRow={(sale) => (
            <TableRow key={sale.id} className="group hover:bg-muted/50 transition-colors">
              <TableCell className="font-mono text-xs text-muted-foreground">
                #{sale.id.toString().padStart(6, '0')}
              </TableCell>

              <TableCell className="font-medium">
                <span className="text-foreground">
                  {new Date(sale.createdAt).toLocaleDateString(undefined, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}{' '}
                  {new Date(sale.createdAt).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </span>
              </TableCell>

              <TableCell>
                <span className="text-sm text-foreground">
                  {sale.source === 'ONLINE' ? 'PedidosYa' : 'Local'}
                </span>
              </TableCell>

              {showUserColumn && (
                <TableCell>
                  <span className="text-sm text-foreground">
                    {sale.createdBy || '-'}
                  </span>
                </TableCell>
              )}

              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {sale.items.reduce((acc, item) => {
                      const isWeight = item.productType === 'WEIGHT'
                      return acc + (isWeight ? 1 : item.quantity)
                    }, 0)} productos
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <span className="text-sm text-muted-foreground truncate max-w-37">
                  {sale.paymentMethodName}
                </span>
              </TableCell>

              <TableCell className="text-right">
                {sale.discountTotal > 0 ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    -{formatCurrency(sale.discountTotal)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>

              <TableCell className="text-right font-bold text-base">
                {formatCurrency(sale.finalTotal)}
              </TableCell>



              <TableCell className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDetails(sale)}
                    title="Ver detalle del ticket"
                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {can(PERMISSIONS.SALES_CANCEL) && (
                    <>
                      {sale.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          title="Cancelar venta"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSaleToCancel(sale)
                            setIsCancelDialogOpen(true)
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="sr-only">Cancelar Venta</span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        />
      </div>

      {/* Componente Sheet para ver el detalle */}
      <SaleDetailsSheet sale={selectedSale} open={isSheetOpen} onOpenChange={setIsSheetOpen} showUser={showUserColumn} />

      {/* Dialog de confirmación de cancelación */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar Venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por cancelar la venta #{saleToCancel?.id.toString().padStart(6, '0')} por un
              total de{' '}
              <span className="font-bold text-foreground">
                {saleToCancel ? formatCurrency(saleToCancel.finalTotal) : ''}
              </span>
              . Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener venta</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, cancelar venta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
