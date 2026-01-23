import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SheetLayout } from '@/components/ui/sheet-layout'
import { formatCurrency } from '../../../utils/currency'
import type { SaleWithDetails } from '@types'
import { Calendar, CreditCard, Receipt, Package, Tag, User, Globe, Store } from 'lucide-react'

interface SaleDetailsSheetProps {
  sale: SaleWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  showUser?: boolean
}

export function SaleDetailsSheet({ sale, open, onOpenChange, showUser = false }: SaleDetailsSheetProps) {
  if (!sale) return null

  // Calcular cantidad total de items para mostrar en el header
  const totalItems = sale.items.reduce((acc, item) => {
    // Si es por peso, cuenta como 1 item, si es por unidad, suma la cantidad
    const isWeight = (item as any).productType === 'WEIGHT'
    return acc + (isWeight ? 1 : item.quantity)
  }, 0)

  // Aseguramos arrays por si vienen undefined
  const items = sale.items || []
  const promotions = sale.promotions || []

  // Header content
  const header = (
    <SheetHeader>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Receipt className="h-4 w-4" />
        <span className="text-xs font-mono uppercase tracking-wider">Ticket de Venta</span>
      </div>
      <SheetTitle className="text-3xl font-bold font-mono mt-2">
        #{sale.id.toString().padStart(6, '0')}
      </SheetTitle>
      <SheetDescription className="flex items-center gap-2 text-sm mt-1">
        <Calendar className="h-3.5 w-3.5" />
        {new Date(sale.createdAt).toLocaleString('es-AR', {
          hour12: false
        })}
      </SheetDescription>
    </SheetHeader>
  )

  // Footer content
  const footer = (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCurrency(sale.items.reduce((acc, item) => acc + item.subtotal, 0))}</span>
        </div>

        {sale.discountTotal > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
            <span>Ahorro Total</span>
            <span>-{formatCurrency(sale.discountTotal)}</span>
          </div>
        )}
      </div>

      <Separator className="bg-border/60" />

      <div className="flex justify-between items-center pt-1">
        <span className="text-base font-bold text-foreground">Total Pagado</span>
        <span className="text-2xl font-bold text-primary tracking-tight">
          {formatCurrency(sale.finalTotal)}
        </span>
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 bg-background border-l">
        <SheetLayout header={header} footer={footer}>
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Datos Generales (Single Row) */}
              <div className="flex flex-col rounded-lg bg-card border shadow-sm overflow-hidden text-sm">
                <div className="p-4 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium uppercase flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Método de Pago
                  </span>
                  <span className="font-semibold text-foreground">
                    {sale.paymentMethodName || 'No especificado'}
                  </span>
                </div>

                {showUser && sale.createdBy && (
                  <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-medium uppercase flex items-center gap-1">
                      <User className="h-3 w-3" /> Atendió
                    </span>
                    <span className="font-semibold text-foreground">
                      {sale.createdBy}
                    </span>
                  </div>
                )}

                {/* Source/Origen */}
                <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-medium uppercase flex items-center gap-1">
                    {sale.source === 'ONLINE' ? <Globe className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                    Origen
                  </span>
                  <span className="font-semibold text-foreground">
                    {sale.source === 'ONLINE' ? 'PedidosYa' : 'Local'}
                  </span>
                </div>
              </div>

              {/* Lista de Productos */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 pb-2 border-b">
                  <Package className="h-4 w-4 text-primary" />
                  Detalle de Productos ({totalItems})
                </h3>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start text-sm group">
                      <div className="flex gap-3">
                        <div className="h-6 min-w-6 px-1 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 border">
                          {(item as any).productType === 'WEIGHT' ? '1' : item.quantity}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium leading-tight text-foreground">
                            {item.productName}
                            {(item as any).productType === 'WEIGHT' && (
                              <span className="text-xs font-normal text-muted-foreground ml-1">
                                ({(item.quantity * 1000).toLocaleString()} g)
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {formatCurrency(item.unitPrice)} {(item as any).productType === 'WEIGHT' ? '/ kg' : 'unitario'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 border-b border-dashed mx-3 mb-1 border-muted-foreground/30 self-end"></div>
                      <span className="font-medium text-foreground whitespace-nowrap mt-1">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promociones (Si existen) */}
              {promotions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Tag className="h-4 w-4" /> Descuentos Aplicados
                  </h3>
                  <div className="space-y-2 bg-green-50 dark:bg-green-900/10 p-3 rounded-md border border-green-100 dark:border-green-900/20">
                    {promotions.map((promo, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm text-green-700 dark:text-green-400"
                      >
                        <span className="font-medium">{promo.promotionName}</span>
                        <span>-{formatCurrency(promo.discountAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetLayout>
      </SheetContent>
    </Sheet >
  )
}
