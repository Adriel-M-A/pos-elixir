import { useState, useEffect, useRef } from 'react'
import { Package, Check, ChevronsUpDown, Scale } from 'lucide-react'
import useProducts from '../hooks/useProducts'
import useCategories from '../../categories/hooks/useCategories'
import { useReports } from '../../reports/context/ReportsContext'
import type { Product } from '@types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SheetLayout } from '@/components/ui/sheet-layout'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

interface ProductFormSheetProps {
  product?: Product | null
  children?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export function ProductFormSheet({
  product,
  children,
  onOpenChange,
  open: externalOpen
}: ProductFormSheetProps) {
  const [open, setOpen] = useState(false)
  const { addProduct, editProduct } = useProducts()
  const { categories } = useCategories()
  const { invalidateReports } = useReports()

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [priceDelivery, setPriceDelivery] = useState('')
  const [isStockControlled, setIsStockControlled] = useState(false)
  const [stock, setStock] = useState('')
  const [minStock, setMinStock] = useState('')
  const [productType, setProductType] = useState<'UNIT' | 'WEIGHT'>('UNIT')
  const [openCategory, setOpenCategory] = useState(false)
  const [activeStockInput, setActiveStockInput] = useState<'stock' | 'minStock' | null>(null) // Track focused input
  const [keepOpen, setKeepOpen] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!product

  const handleStockAdjustment = (amount: number) => {
    if (activeStockInput === 'stock') {
      const current = Number(stock) || 0
      const newValue = Math.max(0, current + amount) // Prevent negative
      setStock(newValue.toString())
    } else if (activeStockInput === 'minStock') {
      const current = Number(minStock) || 0
      const newValue = Math.max(0, current + amount) // Prevent negative
      setMinStock(newValue.toString())
    }
  }

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
    if (product) {
      // Editing mode - load product data
      setName(product.name)
      setCategoryId(product.categoryId?.toString() || '')
      setPrice(product.price.toString())
      setPriceDelivery(product.priceDelivery?.toString() || '')
      setIsStockControlled(product.isStockControlled || false)
      setStock(product.stock.toString())
      setMinStock(product.minStock?.toString() || '0')
      setProductType(product.productType || 'UNIT')
      setOpen(true)
    } else {
      // Creation mode - reset form
      setName('')
      setCategoryId('')
      setPrice('')
      setPriceDelivery('')
      setIsStockControlled(false)
      setStock('')
      setMinStock('')
      setProductType('UNIT')
    }
  }, [product, open])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const productData = {
        name,
        categoryId: Number(categoryId) || null,
        price: Number(price),
        priceDelivery: priceDelivery ? Number(priceDelivery) : null,
        isStockControlled: productType === 'WEIGHT' ? false : isStockControlled,
        stock: isStockControlled && productType === 'UNIT' ? Number(stock) : 0,
        minStock: isStockControlled && productType === 'UNIT' ? Number(minStock) : 0,
        productType
      }

      if (isEditing && product) {
        await editProduct(product.id, productData)
        toast.success('Producto actualizado correctamente')
      } else {
        await addProduct(productData)
        toast.success('Producto creado correctamente')
      }

      // Invalidate reports to refresh low stock alerts
      invalidateReports()

      if (keepOpen && !isEditing) {
        // Reset specific fields for next entry but keep context (Category, Type)
        setName('')
        setPrice('')
        setPriceDelivery('')
        setStock('')
        setMinStock('') // Reset minStock as requested
        // NOTE: We keep categoryId, isStockControlled, minStock, productType for rapid entry context

        // Refocus name input
        setTimeout(() => {
          nameInputRef.current?.focus()
        }, 100)
      } else {
        // Close sheet and clear editing state
        setOpen(false)
        onOpenChange?.(false)
      }
    } catch (error) {
      console.error('Error al guardar el producto:', error)
      toast.error('Error al guardar el producto')
    }
  }

  // Header content
  const header = (
    <SheetHeader>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Package className="h-4 w-4" />
        <span className="text-xs font-mono uppercase tracking-wider">
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </span>
      </div>
      <SheetTitle className="text-2xl font-bold mt-2">
        {isEditing ? 'Editar Producto' : 'Crear Producto'}
      </SheetTitle>
    </SheetHeader>
  )

  // Footer content
  const footer = (
    <div className="flex flex-col gap-4 w-full">
      {!isEditing && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="keep-open"
            checked={keepOpen}
            onCheckedChange={(c) => setKeepOpen(c as boolean)}
          />
          <label
            htmlFor="keep-open"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
          >
            Seguir creando (mantener formulario)
          </label>
        </div>
      )}
      <Button type="submit" form="product-form" className="w-full">
        {isEditing ? 'Actualizar Producto' : 'Guardar Producto'}
      </Button>
    </div>
  )

  const activeCategories = categories.filter((cat) => {
    return (
      cat.isActive === true ||
      (typeof cat.isActive === 'number' && cat.isActive === 1) ||
      (typeof cat.isActive === 'string' && cat.isActive === '1')
    )
  })

  // Helper to get selected category name
  const getSelectedCategoryName = () => {
    if (!categoryId) return 'Sin categoría'
    return categories.find((cat) => cat.id.toString() === categoryId.toString())?.name || 'Selecciona una categoría...'
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {children ? (
        <SheetTrigger asChild>{children}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button>Añadir Producto</Button>
        </SheetTrigger>
      )}
      <SheetContent className="w-full sm:max-w-md p-0 bg-background border-l">
        <SheetLayout header={header} footer={footer}>
          <ScrollArea className="h-full">
            <form id="product-form" onSubmit={handleSave} className="p-6 space-y-6">
              {/* Nombre del Producto */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <span className="text-xs text-muted-foreground">
                    {name.length}/100 caracteres
                  </span>
                </div>
                <Input
                  id="name"
                  ref={nameInputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Paquete de Papas"
                  maxLength={100}
                  className="h-10"
                  required
                />
              </div>

              {/* Tipo de Producto */}
              <div className="space-y-3">
                <Label>Tipo de Producto</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      if (!isEditing) {
                        setProductType('UNIT')
                        // Restore stock control capability if switching back to unit,
                        // but maybe keep it off by default unless it was already on?
                        // Let's just keep current state but allow it.
                      }
                    }}
                    className={`border rounded-md p-3 flex flex-col items-center justify-center gap-1.5 transition-all
                      ${productType === 'UNIT' ? 'border-primary bg-primary/5' : 'bg-card'}
                      ${isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
                    `}
                  >
                    <div
                      className={`p-1.5 rounded-full ${productType === 'UNIT'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-sm font-medium ${productType === 'UNIT' ? 'text-primary' : 'text-foreground'
                          }`}
                      >
                        Por Unidad
                      </p>
                      <p className="text-[10px] text-muted-foreground">Venta individual</p>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      if (!isEditing) {
                        setProductType('WEIGHT')
                        setIsStockControlled(false) // Force disable stock control
                      }
                    }}
                    className={`border rounded-md p-3 flex flex-col items-center justify-center gap-1.5 transition-all
                      ${productType === 'WEIGHT' ? 'border-primary bg-primary/5' : 'bg-card'}
                      ${isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
                    `}
                  >
                    <div
                      className={`p-1.5 rounded-full ${productType === 'WEIGHT'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      <Scale className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-sm font-medium ${productType === 'WEIGHT' ? 'text-primary' : 'text-foreground'
                          }`}
                      >
                        Por Peso
                      </p>
                      <p className="text-[10px] text-muted-foreground">Venta a granel</p>
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    El tipo de producto no se puede cambiar una vez creado.
                  </p>
                )}
              </div>

              {/* Categoría (Combobox) */}
              <div className="space-y-2">
                <Label className="flex items-center">Categoría</Label>
                <Popover open={openCategory} onOpenChange={setOpenCategory}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCategory}
                      className="w-full justify-between font-normal"
                    >
                      {getSelectedCategoryName()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  {/* Added bg-popover to fix transparency issue */}
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover border shadow-md" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar categoría..." />
                      <CommandList>
                        <CommandEmpty>No se encontró la categoría.</CommandEmpty>
                        <CommandGroup>
                          {/* Option for No Category */}
                          <CommandItem
                            value="sin categoría" // Lowercase for search match
                            onSelect={() => {
                              setCategoryId('')
                              setOpenCategory(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                categoryId === ''
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            Sin categoría
                          </CommandItem>

                          {activeCategories.map((cat) => (
                            <CommandItem
                              key={cat.id}
                              value={cat.name}
                              onSelect={() => {
                                setCategoryId(cat.id.toString())
                                setOpenCategory(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  categoryId.toString() === cat.id.toString()
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {cat.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Precio */}
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-1">
                  Precio
                  {productType === 'WEIGHT' ? (
                    <span className="text-muted-foreground font-normal text-xs">(por kg)</span>
                  ) : (
                    <span className="text-muted-foreground font-normal text-xs">(por unidad)</span>
                  )}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999999.99"
                  value={price}
                  onChange={(e) => {
                    const value = e.target.value
                    // Prevent negative numbers
                    if (value === '' || parseFloat(value) >= 0) {
                      setPrice(value)
                    }
                  }}
                  placeholder="0.00"
                  className="h-10"
                  required
                />
              </div>

              {/* Precio Delivery */}
              <div className="space-y-2">
                <Label htmlFor="priceDelivery" className="flex items-center gap-1">
                  Precio PedidosYa <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
                </Label>
                <Input
                  id="priceDelivery"
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999999.99"
                  value={priceDelivery}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || parseFloat(value) >= 0) {
                      setPriceDelivery(value)
                    }
                  }}
                  placeholder="Vacio para usar precio base"
                  className="h-10"
                />
              </div>

              {/* Control de Stock */}
              {productType === 'UNIT' && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isStockControlled"
                      checked={isStockControlled}
                      onCheckedChange={(checked) => setIsStockControlled(checked as boolean)}
                    />
                    <Label
                      htmlFor="isStockControlled"
                      className="cursor-pointer"
                    >
                      Controlar Stock
                    </Label>
                  </div>

                  {isStockControlled && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="stock"
                            className={activeStockInput === 'stock' ? 'text-primary' : ''}
                          >
                            Cantidad Actual
                          </Label>
                          <Input
                            id="stock"
                            type="number"
                            min="0"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            onFocus={() => setActiveStockInput('stock')}
                            placeholder="0"
                            className={`h-10 ${activeStockInput === 'stock' ? 'border-primary ring-1 ring-primary/20' : ''}`}
                            required={isStockControlled}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="minStock"
                            className={activeStockInput === 'minStock' ? 'text-primary' : ''}
                          >
                            Stock Mínimo
                          </Label>
                          <Input
                            id="minStock"
                            type="number"
                            min="0"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                            onFocus={() => setActiveStockInput('minStock')}
                            placeholder="0"
                            className={`h-10 ${activeStockInput === 'minStock' ? 'border-primary ring-1 ring-primary/20' : ''}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Ajustar {activeStockInput === 'stock' ? 'Cantidad Actual' : activeStockInput === 'minStock' ? 'Stock Mínimo' : 'Stock'}
                        </Label>
                        <div className="flex flex-col gap-2">
                          {/* Increment Buttons */}
                          <div className="flex gap-2 flex-wrap">
                            {[1, 5, 10, 25, 50, 100].map((amount) => (
                              <Button
                                key={`+${amount}`}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 min-w-12 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleStockAdjustment(amount)}
                                disabled={!activeStockInput}
                              >
                                +{amount}
                              </Button>
                            ))}
                          </div>
                          {/* Decrement Buttons */}
                          <div className="flex gap-2 flex-wrap">
                            {[1, 5, 10, 25, 50, 100].map((amount) => (
                              <Button
                                key={`-${amount}`}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 min-w-12 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleStockAdjustment(-amount)}
                                disabled={!activeStockInput}
                              >
                                -{amount}
                              </Button>
                            ))}
                          </div>
                        </div>
                        {!activeStockInput && (
                          <p className="text-[10px] text-amber-500">
                            * Selecciona un campo de stock para usar los botones de ajuste
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </ScrollArea>
        </SheetLayout>
      </SheetContent>
    </Sheet>
  )
}
