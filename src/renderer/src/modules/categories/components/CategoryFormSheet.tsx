import { useState, useEffect } from 'react'
import { Layers } from 'lucide-react'
import useCategories from '../hooks/useCategories'
import type { Category } from '@types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SheetLayout } from '@/components/ui/sheet-layout'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface CategoryFormSheetProps {
  category?: Category | null
  children?: React.ReactNode
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export function CategoryFormSheet({
  category,
  children,
  onOpenChange,
  open: externalOpen
}: CategoryFormSheetProps) {
  const [open, setOpen] = useState(false)
  const { addCategory, editCategory } = useCategories()

  const [name, setName] = useState('')
  const isEditing = !!category

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
    if (category) {
      // Editing mode - load category data
      setName(category.name)
      setOpen(true)
    } else {
      // Creation mode - reset form
      setName('')
    }
  }, [category, open])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const categoryData = {
        name
      }

      if (isEditing && category) {
        await editCategory(category.id, categoryData)
        toast.success('Categoría actualizada correctamente')
      } else {
        await addCategory(categoryData)
        toast.success('Categoría creada correctamente')
      }

      // Close sheet and clear editing state
      setOpen(false)
      onOpenChange?.(false)
    } catch (error) {
      console.error('Error al guardar la categoría:', error)
      toast.error('Error al guardar la categoría')
    }
  }

  // Header content
  const header = (
    <SheetHeader>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Layers className="h-4 w-4" />
        <span className="text-xs font-mono uppercase tracking-wider">
          {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
        </span>
      </div>
      <SheetTitle className="text-2xl font-bold mt-2">
        {isEditing ? 'Editar Categoría' : 'Crear Categoría'}
      </SheetTitle>
    </SheetHeader>
  )

  // Footer content
  const footer = (
    <Button type="submit" form="category-form" className="w-full">
      {isEditing ? 'Actualizar Categoría' : 'Guardar Categoría'}
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {children ? (
        <SheetTrigger asChild>{children}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button>Añadir Categoría</Button>
        </SheetTrigger>
      )}
      <SheetContent className="w-full sm:max-w-md p-0 bg-background border-l">
        <SheetLayout header={header} footer={footer}>
          <ScrollArea className="h-full">
            <form id="category-form" onSubmit={handleSave} className="p-6 space-y-6">
              {/* Nombre de la Categoría */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Nombre de la Categoría</Label>
                  <span className="text-xs text-muted-foreground">{name.length}/50 caracteres</span>
                </div>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Bebidas, Comida, Limpieza"
                  maxLength={50}
                  required
                />
              </div>
            </form>
          </ScrollArea>
        </SheetLayout>
      </SheetContent>
    </Sheet>
  )
}
