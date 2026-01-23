import { useState, useMemo } from 'react'
import useFlavors from '../hooks/useFlavors'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Search, Edit, Plus, Minus, ChevronsUpDown, Check, Activity, Package, ArrowDownAZ, ArrowUpAZ } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { FlavorFormSheet } from '../components/FlavorFormSheet'
import { DataTable } from '@/components/DataTable'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function Flavors() {
    const { flavors, loading, updateStock, removeFlavor, editFlavor } = useFlavors()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [selectedStock, setSelectedStock] = useState<string>('all')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    // Popover states
    const [openStatus, setOpenStatus] = useState(false)
    const [openStock, setOpenStock] = useState(false)

    const [editingFlavor, setEditingFlavor] = useState<number | null>(null)
    const [flavorToDelete, setFlavorToDelete] = useState<number | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const filteredFlavors = useMemo(() => {
        let result = flavors.filter((f) => {
            const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'active' && f.isActive) ||
                (selectedStatus === 'inactive' && !f.isActive)

            const matchesStock =
                selectedStock === 'all' ||
                (selectedStock === 'in_stock' && f.stock > 0) ||
                (selectedStock === 'out_of_stock' && f.stock === 0)

            return matchesSearch && matchesStatus && matchesStock
        })

        return result.sort((a, b) => {
            return sortOrder === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name)
        })
    }, [flavors, searchTerm, selectedStatus, selectedStock, sortOrder])

    const handleDelete = async (id: number) => {
        try {
            await removeFlavor(id)
            toast.success('Sabor eliminado')
        } catch (error) {
            toast.error('Error al eliminar')
        } finally {
            setFlavorToDelete(null)
        }
    }

    const columns = [
        { key: 'name', label: 'Nombre' },
        { key: 'stock', label: 'Stock (Baldes)', className: 'text-center' },
        { key: 'status', label: 'Estado' },
        { key: 'actions', label: 'Acciones', className: 'text-right' }
    ]

    const handleCloseEdit = () => {
        setEditingFlavor(null)
    }

    return (
        <div className="flex flex-col h-full p-6 gap-6 overflow-hidden">
            <PageHeader
                title="Sabores"
                description="Gestión de stock de baldes de helado."
                actionButton={
                    <FlavorFormSheet
                        open={isCreateOpen}
                        onOpenChange={(open) => {
                            setIsCreateOpen(open)
                            if (!open) handleCloseEdit()
                        }}
                    >
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nuevo Sabor
                        </Button>
                    </FlavorFormSheet>
                }
            />

            <div className="shrink-0 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar sabor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 bg-card"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Status Filter */}
                        <Popover open={openStatus} onOpenChange={setOpenStatus}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={openStatus} className="w-full sm:w-[200px] justify-between bg-card h-10">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 shrink-0 opacity-50" />
                                        <span>
                                            {selectedStatus === 'all' ? 'Todos los estados' : selectedStatus === 'active' ? 'Activos' : 'Inactivos'}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0 bg-popover" align="end">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                            <CommandItem value="all" onSelect={() => { setSelectedStatus('all'); setOpenStatus(false) }}>
                                                <Check className={cn('mr-2 h-4 w-4', selectedStatus === 'all' ? 'opacity-100' : 'opacity-0')} />
                                                Todos los estados
                                            </CommandItem>
                                            <CommandItem value="active" onSelect={() => { setSelectedStatus('active'); setOpenStatus(false) }}>
                                                <Check className={cn('mr-2 h-4 w-4', selectedStatus === 'active' ? 'opacity-100' : 'opacity-0')} />
                                                Activos
                                            </CommandItem>
                                            <CommandItem value="inactive" onSelect={() => { setSelectedStatus('inactive'); setOpenStatus(false) }}>
                                                <Check className={cn('mr-2 h-4 w-4', selectedStatus === 'inactive' ? 'opacity-100' : 'opacity-0')} />
                                                Inactivos
                                            </CommandItem>
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Stock Filter */}
                        <Popover open={openStock} onOpenChange={setOpenStock}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={openStock} className="w-full sm:w-[200px] justify-between bg-card h-10">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 shrink-0 opacity-50" />
                                        <span>
                                            {selectedStock === 'all' ? 'Todo el stock' : selectedStock === 'in_stock' ? 'Con Stock' : 'Sin Stock'}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0 bg-popover" align="end">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                            <CommandItem value="all" onSelect={() => { setSelectedStock('all'); setOpenStock(false) }}>
                                                <Check className={cn('mr-2 h-4 w-4', selectedStock === 'all' ? 'opacity-100' : 'opacity-0')} />
                                                Todo el stock
                                            </CommandItem>
                                            <CommandItem value="in_stock" onSelect={() => { setSelectedStock('in_stock'); setOpenStock(false) }}>
                                                <Check className={cn('mr-2 h-4 w-4', selectedStock === 'in_stock' ? 'opacity-100' : 'opacity-0')} />
                                                Con Stock
                                            </CommandItem>
                                            <CommandItem value="out_of_stock" onSelect={() => { setSelectedStock('out_of_stock'); setOpenStock(false) }}>
                                                <Check className={cn('mr-2 h-4 w-4', selectedStock === 'out_of_stock' ? 'opacity-100' : 'opacity-0')} />
                                                Sin Stock
                                            </CommandItem>
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Sort Button */}
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto px-3 bg-card"
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            title={sortOrder === 'asc' ? 'Orden A-Z' : 'Orden Z-A'}
                        >
                            {sortOrder === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* Active Filters */}
                {(selectedStatus !== 'all' || selectedStock !== 'all' || searchTerm) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-medium text-muted-foreground mr-1">Filtros activos:</span>

                        {searchTerm && (
                            <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                                <Search className="h-3.5 w-3.5 opacity-70" />
                                <span className="ml-1">Buscando: <span className="font-medium">"{searchTerm}"</span></span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 hover:bg-muted-foreground/20 rounded-full" onClick={() => setSearchTerm('')}>
                                    <span className="sr-only">Quitar búsqueda</span>
                                    <Minus className="h-3 w-3" />
                                </Button>
                            </Badge>
                        )}

                        {selectedStatus !== 'all' && (
                            <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                                <div className={`w-2 h-2 rounded-full mr-1 ${selectedStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span>Estado: <span className="font-medium">{selectedStatus === 'active' ? 'Activos' : 'Inactivos'}</span></span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 hover:bg-muted-foreground/20 rounded-full" onClick={() => setSelectedStatus('all')}>
                                    <span className="sr-only">Quitar filtro de estado</span>
                                    <Minus className="h-3 w-3" />
                                </Button>
                            </Badge>
                        )}

                        {selectedStock !== 'all' && (
                            <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                                <Package className="h-3.5 w-3.5 opacity-70" />
                                <span className="ml-1">Stock: <span className="font-medium">{selectedStock === 'in_stock' ? 'Con Stock' : 'Sin Stock'}</span></span>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 hover:bg-muted-foreground/20 rounded-full" onClick={() => setSelectedStock('all')}>
                                    <span className="sr-only">Quitar filtro de stock</span>
                                    <Minus className="h-3 w-3" />
                                </Button>
                            </Badge>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSearchTerm(''); setSelectedStatus('all'); setSelectedStock('all') }}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent underline decoration-dotted underline-offset-4"
                        >
                            Limpiar todo
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
                <DataTable
                    className="h-full"
                    columns={columns}
                    data={filteredFlavors}
                    loading={loading}
                    emptyMessage="No hay sabores registrados."
                >
                    {filteredFlavors.map((flavor) => (
                        <TableRow key={flavor.id}>
                            <TableCell className="font-medium text-base">{flavor.name}</TableCell>

                            <TableCell>
                                <div className="flex items-center justify-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:border-red-200"
                                        onClick={() => updateStock(flavor.id, Math.max(0, flavor.stock - 1))}
                                        disabled={flavor.stock <= 0}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>

                                    <span className={cn(
                                        "font-bold text-lg tabular-nums w-8 text-center",
                                        flavor.stock === 0 && "text-muted-foreground",
                                        flavor.stock > 0 && "text-foreground"
                                    )}>
                                        {flavor.stock}
                                    </span>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-green-500 hover:border-green-200"
                                        onClick={() => updateStock(flavor.id, flavor.stock + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </TableCell>

                            <TableCell>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        editFlavor(flavor.id, { isActive: !flavor.isActive })
                                    }}
                                    className={`text-sm font-medium ${flavor.isActive ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {flavor.isActive ? 'Activo' : 'Inactivo'}
                                </button>
                            </TableCell>

                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <FlavorFormSheet
                                        flavor={flavor}
                                        open={editingFlavor === flavor.id}
                                        onOpenChange={(open) => !open && setEditingFlavor(null)}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                            onClick={() => setEditingFlavor(flavor.id)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </FlavorFormSheet>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                        onClick={() => setFlavorToDelete(flavor.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </DataTable>
            </div>

            <DeleteConfirmDialog
                open={!!flavorToDelete}
                onOpenChange={(open) => !open && setFlavorToDelete(null)}
                onConfirm={() => flavorToDelete && handleDelete(flavorToDelete)}
                title="¿Eliminar sabor?"
                description="Esta acción no se puede deshacer."
            />
        </div>
    )
}
