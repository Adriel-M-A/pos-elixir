import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'
import usePromotions from '../hooks/usePromotions'
import useProducts from '../../products/hooks/useProducts'
import type { Promotion } from '@types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SheetLayout } from '@/components/ui/sheet-layout'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ProductSearch } from './ProductSearch'
import { toast } from 'sonner'

interface PromotionFormSheetProps {
  promotion?: Promotion | null
  children?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export function PromotionFormSheet({
  promotion,
  children,
  onOpenChange,
  open: externalOpen
}: PromotionFormSheetProps) {
  const [open, setOpen] = useState(false)
  const { addPromotion, updatePromotion } = usePromotions()
  const { products } = useProducts()

  const [name, setName] = useState('')
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')
  const [requirements, setRequirements] = useState([{ productId: '', qty: '1' }])
  const isEditing = !!promotion

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    onOpenChange?.(open)
    if (!open) {
      // Clear editing state when closing
    }
  }

  useEffect(() => {
    if (externalOpen !== undefined) {
      setOpen(externalOpen)
    }
  }, [externalOpen])

  useEffect(() => {
    if (promotion) {
      // Editing mode - load promotion data
      setName(promotion.name)
      setDiscountType(promotion.discountType)
      setDiscountValue(promotion.discountValue.toString())
      if (promotion.products && promotion.products.length > 0) {
        setRequirements(
          promotion.products.map((p) => ({
            productId: p.productId.toString(),
            qty: p.requiredQty.toString()
          }))
        )
      }
      setOpen(true)
    } else {
      // Creation mode - reset form
      setName('')
      setDiscountType('PERCENTAGE')
      setDiscountValue('')
      setRequirements([{ productId: '', qty: '1' }])
    }
  }, [promotion, open])

  const addRequirement = () => {
    setRequirements((prev) => [...prev, { productId: '', qty: '1' }])
  }

  const updateRequirement = (index: number, field: 'productId' | 'qty', value: string) => {
    setRequirements((prev) =>
      prev.map((req, i) => {
        if (i === index) {
          return { ...req, [field]: value }
        }
        return req
      })
    )
  }

  const removeRequirement = (index: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payloadProducts = requirements
        .map((req) => ({
          productId: Number(req.productId),
          requiredQty: Number(req.qty) || 1
        }))
        .filter((req) => req.productId > 0 && req.requiredQty > 0)

      if (!payloadProducts.length) {
        toast.error('La promoción debe tener al menos un producto seleccionado')
        return
      }

      const promotionData = {
        name,
        discountType,
        discountValue: Number(discountValue),
        products: payloadProducts
      }

      if (isEditing && promotion) {
        await updatePromotion(promotion.id, promotionData)
        toast.success('Promoción actualizada correctamente')
      } else {
        await addPromotion(promotionData)
        toast.success('Promoción creada correctamente')
      }

      // Close sheet and clear editing state
      setOpen(false)
      onOpenChange?.(false)
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al guardar la promoción')
    }
  }

  // Header content
  const header = (
    <SheetHeader>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Tag className="h-4 w-4" />
        <span className="text-xs font-mono uppercase tracking-wider">
          {isEditing ? 'Editar Promoción' : 'Nueva Promoción'}
        </span>
      </div>
      <SheetTitle className="text-2xl font-bold mt-2">
        {isEditing ? 'Editar Promoción' : 'Crear Promoción'}
      </SheetTitle>
    </SheetHeader>
  )

  // Footer content
  const footer = (
    <Button type="submit" form="promotion-form" className="w-full">
      {isEditing ? 'Actualizar Promoción' : 'Guardar Promoción'}
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {children ? (
        <SheetTrigger asChild>{children}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button>Añadir Promoción</Button>
        </SheetTrigger>
      )}
      <SheetContent className="w-full sm:max-w-xl p-0 bg-background border-l">
        <SheetLayout header={header} footer={footer}>
          <ScrollArea className="h-full">
            <form id="promotion-form" onSubmit={handleSave} className="p-6 space-y-6">
              {/* Nombre de la Promoción */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Nombre de la Promoción</Label>
                  <span className="text-xs text-muted-foreground">
                    {name.length}/100 caracteres
                  </span>
                </div>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Combo Verano"
                  maxLength={100}
                  required
                />
              </div>

              {/* Tipo y Valor del Descuento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Tipo de Descuento</Label>
                  <select
                    id="discountType"
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={discountType}
                    onChange={(e) => {
                      setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')
                      setDiscountValue('') // Reset value when type changes
                    }}
                  >
                    <option value="PERCENTAGE">Porcentaje (%)</option>
                    <option value="FIXED">Monto Fijo ($)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Valor
                    {discountType === 'PERCENTAGE' && (
                      <span className="text-xs text-muted-foreground ml-2">(0% - 100%)</span>
                    )}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                    min="0"
                    max={discountType === 'PERCENTAGE' ? 100 : 999999999.99}
                    value={discountValue}
                    onChange={(e) => {
                      const value = e.target.value
                      const maxValue = discountType === 'PERCENTAGE' ? 100 : 999999999.99
                      // Prevent negative numbers and validate max
                      if (
                        value === '' ||
                        (parseFloat(value) >= 0 && parseFloat(value) <= maxValue)
                      ) {
                        setDiscountValue(value)
                      }
                    }}
                    placeholder={discountType === 'PERCENTAGE' ? '10' : '50.00'}
                    required
                  />
                </div>
              </div>

              {/* Condición de Activación */}
              <div className="space-y-4">
                <Label className="text-xs uppercase text-muted-foreground font-bold">
                  Condición de Activación
                </Label>
                <div className="space-y-3">
                  {requirements.map((req, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 items-end border rounded-lg p-3 bg-muted/30"
                    >
                      <div className="space-y-2">
                        <Label>Producto #{index + 1}</Label>
                        <ProductSearch
                          products={products}
                          selectedProductId={req.productId}
                          onSelectProduct={(productId) =>
                            updateRequirement(index, 'productId', productId)
                          }
                          placeholder="Buscar producto..."
                        />
                      </div>
                      <div className="space-y-2 w-32">
                        <Label>
                          {(() => {
                            const product = products.find(p => p.id.toString() === req.productId?.toString())
                            return product?.productType === 'WEIGHT' ? 'Cantidad (g)' : 'Cantidad'
                          })()}
                        </Label>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          value={req.qty}
                          onChange={(e) => updateRequirement(index, 'qty', e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRequirement(index)}
                          disabled={requirements.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={addRequirement}
                    disabled={!requirements[0].productId}
                  >
                    <Plus className="h-4 w-4" />
                    Añadir otro producto
                  </Button>
                </div>
              </div>
            </form>
          </ScrollArea>
        </SheetLayout>
      </SheetContent>
    </Sheet>
  )
}
