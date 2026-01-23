import { useState, useEffect, useRef } from 'react'
import { Package } from 'lucide-react'
import useFlavors from '../hooks/useFlavors'
import type { Flavor } from '@shared/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SheetLayout } from '@/components/ui/sheet-layout'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

interface FlavorFormSheetProps {
    flavor?: Flavor | null
    children?: React.ReactNode
    onOpenChange?: (open: boolean) => void
    open?: boolean
}

export function FlavorFormSheet({
    flavor,
    children,
    onOpenChange,
    open: externalOpen
}: FlavorFormSheetProps) {
    const [open, setOpen] = useState(false)
    const { addFlavor, editFlavor } = useFlavors()

    const [name, setName] = useState('')
    const [stock, setStock] = useState('0')
    const [isActive, setIsActive] = useState(true)

    const [keepOpen, setKeepOpen] = useState(false)
    const nameInputRef = useRef<HTMLInputElement>(null)
    const isEditing = !!flavor

    const handleOpenChange = (open: boolean) => {
        setOpen(open)
        onOpenChange?.(open)
    }

    useEffect(() => {
        if (externalOpen !== undefined) {
            setOpen(externalOpen)
        }
    }, [externalOpen])

    useEffect(() => {
        if (open) {
            if (flavor) {
                setName(flavor.name)
                setStock(flavor.stock.toString())
                setIsActive(flavor.isActive)
            } else {
                setName('')
                setStock('0')
                setIsActive(true)
            }
        }
    }, [flavor, open])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const flavorData = {
                name,
                stock: parseInt(stock) || 0,
                isActive
            }

            if (isEditing && flavor) {
                await editFlavor(flavor.id, flavorData)
                toast.success('Sabor actualizado correctamente')
            } else {
                await addFlavor(flavorData)
                toast.success('Sabor creado correctamente')
            }

            if (keepOpen && !isEditing) {
                setName('')
                setStock('0')
                setTimeout(() => {
                    nameInputRef.current?.focus()
                }, 100)
            } else {
                setOpen(false)
                onOpenChange?.(false)
            }
        } catch (error) {
            console.error('Error al guardar el sabor:', error)
            toast.error('Error al guardar el sabor')
        }
    }

    const header = (
        <SheetHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span className="text-xs font-mono uppercase tracking-wider">
                    {isEditing ? 'Editar Sabor' : 'Nuevo Sabor'}
                </span>
            </div>
            <SheetTitle className="text-2xl font-bold mt-2">
                {isEditing ? 'Editar Sabor' : 'Crear Sabor'}
            </SheetTitle>
        </SheetHeader>
    )

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
                        Seguir creando
                    </label>
                </div>
            )}
            <Button type="submit" form="flavor-form" className="w-full">
                {isEditing ? 'Actualizar Sabor' : 'Guardar Sabor'}
            </Button>
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            {children ? (
                <SheetTrigger asChild>{children}</SheetTrigger>
            ) : (
                <SheetTrigger asChild>
                    <Button>Añadir Sabor</Button>
                </SheetTrigger>
            )}
            <SheetContent className="w-full sm:max-w-md p-0 bg-background border-l">
                <SheetLayout header={header} footer={footer}>
                    <ScrollArea className="h-full">
                        <form id="flavor-form" onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Sabor</Label>
                                <Input
                                    id="name"
                                    ref={nameInputRef}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Dulce de Leche"
                                    className="h-10"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stock">Stock Inicial (Baldes)</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    min="0"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    className="h-10"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isActive"
                                    checked={isActive}
                                    onCheckedChange={(c) => setIsActive(c as boolean)}
                                />
                                <Label htmlFor="isActive">Activo</Label>
                            </div>
                        </form>
                    </ScrollArea>
                </SheetLayout>
            </SheetContent>
        </Sheet>
    )
}
