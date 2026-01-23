import { useEffect, useState } from 'react'
import { Trash2, Plus, Minus, ChevronDown, ChevronRight, ShoppingCart, Tag, Loader2, TicketPercent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSales } from '../hooks/useSales'
import { fetchPaymentMethods } from '../../payment-methods/services/payment-methods.service'
import { formatCurrency } from '../../../utils/currency'
import type { PaymentMethod } from '@types'
import { usePromotions } from '../../promtions'
import { usePromotionCalculator } from '../hooks/usePromotionCalculator'
import { CashPaymentDialog } from './CashPaymentDialog'
import { WeightSelectionDialog } from './WeightSelectionDialog'
import { Edit } from 'lucide-react'
import type { CartItem } from '../context/SalesContext'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { PERMISSIONS } from '@shared/types'

export function CartSummary() {
  const {
    cart,
    subtotal,
    total,
    appliedPromotions,
    paymentMethodId,
    updateQuantity,
    setItemQuantity,
    removeItem,
    upsertPromotion,
    removePromotion,
    setPaymentMethod,
    processSale,
    clearCart
  } = useSales()

  const { can } = useAuth()

  const { promotions, loading: promotionsLoading } = usePromotions()
  const { eligiblePromotions } = usePromotionCalculator(can(PERMISSIONS.POS_DISCOUNT) ? promotions : [])

  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [promoOpen, setPromoOpen] = useState(false)
  const [showCashDialog, setShowCashDialog] = useState(false)

  // Weight dialog state
  const [weightDialogOpen, setWeightDialogOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<CartItem | null>(null)

  // Sync applied promotions with eligible ones
  useEffect(() => {
    if (!appliedPromotions.length) return

    appliedPromotions.forEach((promo) => {
      const match = eligiblePromotions.find((entry) => entry.promotion.id === promo.promotionId)

      if (!match) {
        removePromotion(promo.promotionId)
        return
      }

      if (Math.abs(match.discountAmount - promo.discountAmount) > 0.01) {
        upsertPromotion({
          promotionId: match.promotion.id,
          promotionName: match.promotion.name,
          discountAmount: match.discountAmount
        })
      }
    })
  }, [eligiblePromotions, appliedPromotions, removePromotion, upsertPromotion])

  // Load payment methods
  useEffect(() => {
    fetchPaymentMethods().then((data) => {
      const activeMethods = data.filter((m) => (m as any).is_active === 1 || m.isActive)

      const priorityOrder: Record<string, number> = {
        Transferencia: 1,
        Efectivo: 2,
        Tarjeta: 3
      }

      const sorted = [...activeMethods].sort((a, b) => {
        const aPriority = priorityOrder[a.name] ?? Number.MAX_SAFE_INTEGER
        const bPriority = priorityOrder[b.name] ?? Number.MAX_SAFE_INTEGER
        if (aPriority === bPriority) return a.name.localeCompare(b.name)
        return aPriority - bPriority
      })

      setMethods(sorted)

      if (!paymentMethodId && sorted.length > 0) {
        setPaymentMethod(sorted[0].id)
      }
    })
  }, [paymentMethodId, setPaymentMethod])

  const handleProcessSale = () => {
    const selectedMethod = methods.find((m) => m.id === paymentMethodId)
    // Check if selected method is Cash (Efectivo)
    if (selectedMethod?.name === 'Efectivo') {
      setShowCashDialog(true)
    } else {
      processSale()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-l shadow-xl z-20 w-96 max-w-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Tu Pedido</h2>
            <p className="text-xs text-muted-foreground">{cart.length} productos</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearCart}
          disabled={cart.length === 0}
          title="Limpiar carrito"
          className="hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Items List */}
      <ScrollArea className="flex-1 bg-background/50">
        <div className="p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 text-muted-foreground opacity-60">
              <ShoppingCart className="h-12 w-12" />
              <p className="text-sm">El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="flex flex-col p-3 bg-card rounded-md border shadow-sm group gap-2">

                  {/* Row 1: Name and Unit Price */}
                  <div className="flex justify-between items-start w-full">
                    <p className="font-medium text-sm leading-tight text-primary/90 line-clamp-2">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatCurrency(item.unitPrice)}
                    </p>
                  </div>

                  {/* Row 2: Controls, Subtotal, Delete */}
                  <div className="flex items-center justify-between w-full">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-0.5 bg-secondary/30 rounded-md border h-7">
                      {item.productType === 'WEIGHT' ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-full px-2 rounded-md hover:bg-background text-xs font-medium gap-1"
                            onClick={() => {
                              setItemToEdit(item)
                              setWeightDialogOpen(true)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                            <span className="tabular-nums">{(item.quantity * 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} g</span>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-l-md hover:bg-background"
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-bold tabular-nums border-x h-full flex items-center justify-center bg-background/50">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-r-md hover:bg-background"
                            onClick={() => updateQuantity(item.productId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Subtotal */}
                      <span className="font-bold text-sm">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-1"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer / Checkout */}
      <div className="bg-card border-t p-4 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {/* Subtotal & Discount rows */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {/* Active Promotions List */}
          {appliedPromotions.length > 0 && (
            <div className="space-y-1 pt-1">
              {appliedPromotions.map((promo) => (
                <div key={promo.promotionId} className="flex justify-between text-green-600 text-xs font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {promo.promotionName}
                  </span>
                  <span>-{formatCurrency(promo.discountAmount)}</span>
                </div>
              ))}
            </div>
          )}

          <Separator className="my-2" />

          <div className="flex justify-between items-end">
            <span className="font-bold text-lg">Total</span>
            <span className="font-black text-2xl text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Method & Promotions Accordion */}
        <div className="space-y-3 pt-2">
          {/* Promotion Accordion */}
          {can(PERMISSIONS.POS_DISCOUNT) && (
            <div className="border rounded-lg bg-background overflow-hidden transition-all duration-200 ease-in-out">
              <button
                onClick={() => setPromoOpen(!promoOpen)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-md ${eligiblePromotions.length > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Tag className="h-4 w-4" />
                  </div>
                  <span>Promociones</span>
                  {eligiblePromotions.length > 0 && (
                    <Badge className="h-5 px-1.5 text-[10px] ml-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm animate-in zoom-in spin-in-3">
                      {eligiblePromotions.length}
                    </Badge>
                  )}
                </div>
                {promotionsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : promoOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {promoOpen && !promotionsLoading && (
                <div className="p-3 pt-0 border-t bg-muted/30">
                  {eligiblePromotions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-muted-foreground gap-2">
                      <TicketPercent className="h-8 w-8 opacity-20" />
                      <p className="text-xs">No hay promociones disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-3">
                      {eligiblePromotions.map(({ promotion, discountAmount }) => {
                        const isSelected = appliedPromotions.some((p) => p.promotionId === promotion.id)
                        return (
                          <div
                            key={promotion.id}
                            className={`
                              relative flex items-center gap-2 p-2 rounded-md border text-left transition-all cursor-pointer group min-h-[40px]
                              ${isSelected
                                ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                                : 'bg-card hover:bg-background hover:border-primary/50 border-border'}
                            `}
                            onClick={() => {
                              if (isSelected) removePromotion(promotion.id)
                              else
                                upsertPromotion({
                                  promotionId: promotion.id,
                                  promotionName: promotion.name,
                                  discountAmount
                                })
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              className={`shrink-0 transition-colors ${isSelected ? 'data-[state=checked]:bg-primary data-[state=checked]:border-primary' : ''}`}
                            />

                            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                              <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {promotion.name}
                              </span>
                              <Badge variant="secondary" className="shrink-0 h-5 px-1.5 text-[10px] font-mono whitespace-nowrap bg-background border group-hover:border-primary/30 transition-colors">
                                -{formatCurrency(discountAmount)}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Method Select (Tabs) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
              Método de Pago
            </label>
            <Tabs
              value={paymentMethodId ? String(paymentMethodId) : ''}
              onValueChange={(val) => setPaymentMethod(Number(val))}
              className="w-full"
            >
              <TabsList className="w-full h-10 grid" style={{ gridTemplateColumns: `repeat(${methods.length}, minmax(0, 1fr))` }}>
                {methods.map((m) => (
                  <TabsTrigger
                    key={m.id}
                    value={String(m.id)}
                    className="h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {m.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full text-lg font-bold shadow-lg hover:shadow-xl transition-all"
          onClick={handleProcessSale}
          disabled={cart.length === 0 || !paymentMethodId}
        >
          Cobrar {formatCurrency(total)}
        </Button>
      </div>

      <CashPaymentDialog
        open={showCashDialog}
        onOpenChange={setShowCashDialog}
        totalAmount={total}
        onConfirm={processSale}
      />

      <WeightSelectionDialog
        open={weightDialogOpen}
        onOpenChange={setWeightDialogOpen}
        productName={itemToEdit?.productName || ''}
        productPrice={itemToEdit?.unitPrice || 0}
        initialWeight={itemToEdit ? itemToEdit.quantity * 1000 : 0}
        onConfirm={(weightInGrams) => {
          if (itemToEdit) {
            setItemQuantity(itemToEdit.productId, weightInGrams / 1000)
            setItemToEdit(null)
          }
        }}
      />
    </div>
  )
}
