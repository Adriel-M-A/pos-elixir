import { useState, useMemo } from 'react'
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut'
import useProducts from '../hooks/useProducts'
import useCategories from '../../categories/hooks/useCategories'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Search, Filter, Edit, Check, ChevronsUpDown, Activity, Plus, Package, Scale } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { PERMISSIONS } from '@shared/types'
import { PageHeader } from '@/components/PageHeader'
import { PermissionGuard } from '@/components/PermissionGuard'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { ProductFormSheet } from '../components/ProductFormSheet'
import { DataTable } from '../../../components/DataTable'
import { formatCurrency } from '../../../utils/currency'
import { cn } from '@/lib/utils'

function Products() {
  const {
    products,
    loading: productsLoading,
    toggleProductStatus,
    deleteProduct,
    findPromotions
  } = useProducts()
  const { categories, loading: categoriesLoading } = useCategories()
  const { can } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Popover open states
  const [openCategory, setOpenCategory] = useState(false)
  const [openStatus, setOpenStatus] = useState(false)
  const [openType, setOpenType] = useState(false)

  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const [impactedPromos, setImpactedPromos] = useState<string[]>([])
  const [isCheckingDeps, setIsCheckingDeps] = useState(false)
  const [editingProduct, setEditingProduct] = useState<number | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  if (!can(PERMISSIONS.PRODUCTS_VIEW)) {
    return <PermissionGuard message="No tienes permisos para ver el catálogo de productos." />
  }

  const handleCloseEdit = () => {
    setEditingProduct(null)
  }

  useKeyboardShortcut(
    'n',
    () => {
      if (can(PERMISSIONS.PRODUCTS_CREATE)) {
        setIsCreateOpen(true)
      }
    },
    { ctrlKey: true }
  )

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(id)
      await deleteProduct(id)
      toast.success('Producto eliminado correctamente')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Error al eliminar el producto')
    } finally {
      setIsDeleting(null)
      setProductToDelete(null)
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'none' && product.categoryId === null) ||
        (selectedCategory !== 'none' && product.categoryId === parseInt(selectedCategory))

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && product.isActive) ||
        (selectedStatus === 'inactive' && !product.isActive)

      const matchesType =
        selectedType === 'all' ||
        (selectedType === 'UNIT' && (!product.productType || product.productType === 'UNIT')) ||
        (selectedType === 'WEIGHT' && product.productType === 'WEIGHT')

      return matchesSearch && matchesCategory && matchesStatus && matchesType
    })
  }, [products, searchTerm, selectedCategory, selectedStatus, selectedType])

  // Define columns dynamically based on permissions
  const columns: { key: string; label: string; className?: string }[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'type', label: 'Tipo' },
    { key: 'category', label: 'Categoría' },
    { key: 'price', label: 'Precio' },
    { key: 'stock', label: 'Stock' },
    { key: 'status', label: 'Estado' }
  ]

  if (can(PERMISSIONS.PRODUCTS_EDIT) || can(PERMISSIONS.PRODUCTS_DELETE)) {
    columns.push({ key: 'actions', label: 'Acciones', className: 'text-right' })
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-hidden">
      <PageHeader
        title="Productos"
        description="Administra el catálogo de productos."
        actionButton={
          can(PERMISSIONS.PRODUCTS_CREATE) ? (
            <ProductFormSheet
              product={editingProduct ? products.find((p) => p.id === editingProduct) : null}
              open={isCreateOpen}
              onOpenChange={(open) => {
                setIsCreateOpen(open)
                if (!open) handleCloseEdit()
              }}
            >
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </ProductFormSheet>
          ) : undefined
        }
      />

      {/* Filters Section - Removed Container */}
      <div className="shrink-0 space-y-4">
        {/* ... Filters code remains same ... */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-card"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Filter */}
            <Popover open={openCategory} onOpenChange={setOpenCategory}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCategory}
                  className="w-full sm:w-[220px] justify-between bg-card h-10"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="h-4 w-4 shrink-0 opacity-50" />
                    <span className="truncate">
                      {selectedCategory === 'all'
                        ? 'Todas las categorías'
                        : selectedCategory === 'none'
                          ? 'Sin categoría'
                          : categories.find((c) => c.id.toString() === selectedCategory)?.name || 'Seleccionar categoría'}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0 bg-popover" align="end">
                <Command>
                  <CommandInput placeholder="Buscar categoría..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedCategory('all')
                          setOpenCategory(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedCategory === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Todas las categorías
                      </CommandItem>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setSelectedCategory('none')
                          setOpenCategory(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedCategory === 'none' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Sin categoría
                      </CommandItem>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.name}
                          onSelect={() => {
                            setSelectedCategory(category.id.toString())
                            setOpenCategory(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedCategory === category.id.toString() ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {category.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Popover open={openStatus} onOpenChange={setOpenStatus}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openStatus}
                  className="w-full sm:w-[200px] justify-between bg-card h-10"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 shrink-0 opacity-50" />
                    <span>
                      {selectedStatus === 'all'
                        ? 'Todos los estados'
                        : selectedStatus === 'active'
                          ? 'Activos'
                          : 'Inactivos'}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-0 bg-popover" align="end">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedStatus('all')
                          setOpenStatus(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedStatus === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Todos los estados
                      </CommandItem>
                      <CommandItem
                        value="active"
                        onSelect={() => {
                          setSelectedStatus('active')
                          setOpenStatus(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedStatus === 'active' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Activos
                      </CommandItem>
                      <CommandItem
                        value="inactive"
                        onSelect={() => {
                          setSelectedStatus('inactive')
                          setOpenStatus(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedStatus === 'inactive' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Inactivos
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {/* Type Filter */}
            <Popover open={openType} onOpenChange={setOpenType}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openType}
                  className="w-full sm:w-[180px] justify-between bg-card h-10"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 shrink-0 opacity-50" />
                    <span>
                      {selectedType === 'all'
                        ? 'Todos los tipos'
                        : selectedType === 'UNIT'
                          ? 'Unidad'
                          : 'Peso'}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-0 bg-popover" align="end">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setSelectedType('all')
                          setOpenType(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedType === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Todos los tipos
                      </CommandItem>
                      <CommandItem
                        value="unit"
                        onSelect={() => {
                          setSelectedType('UNIT')
                          setOpenType(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedType === 'UNIT' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Unidad
                      </CommandItem>
                      <CommandItem
                        value="weight"
                        onSelect={() => {
                          setSelectedType('WEIGHT')
                          setOpenType(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedType === 'WEIGHT' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Peso
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedType !== 'all' || searchTerm) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-muted-foreground mr-1">Filtros activos:</span>
            {searchTerm && (
              <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                <Search className="h-3.5 w-3.5 opacity-70" />
                <span className="ml-1">Buscando: <span className="font-medium">"{searchTerm}"</span></span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 hover:bg-muted-foreground/20 rounded-full"
                  onClick={() => setSearchTerm('')}
                >
                  <span className="sr-only">Quitar búsqueda</span>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                <Filter className="h-3.5 w-3.5 opacity-70" />
                <span className="ml-1">Categoría: <span className="font-medium">{selectedCategory === 'none'
                  ? 'Sin categoría'
                  : categories.find((c) => c.id === parseInt(selectedCategory))?.name}</span></span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 hover:bg-muted-foreground/20 rounded-full"
                  onClick={() => setSelectedCategory('all')}
                >
                  <span className="sr-only">Quitar filtro de categoría</span>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </Badge>
            )}
            {selectedStatus !== 'all' && (
              <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                <div
                  className={`w-2 h-2 rounded-full mr-1 ${selectedStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}
                ></div>
                <span>Estado: <span className="font-medium">{selectedStatus === 'active' ? 'Activos' : 'Inactivos'}</span></span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 hover:bg-muted-foreground/20 rounded-full"
                  onClick={() => setSelectedStatus('all')}
                >
                  <span className="sr-only">Quitar filtro de estado</span>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </Badge>
            )}
            {selectedType !== 'all' && (
              <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                {selectedType === 'UNIT' ? (
                  <Package className="h-3.5 w-3.5 opacity-70" />
                ) : (
                  <Scale className="h-3.5 w-3.5 opacity-70" />
                )}
                <span className="ml-1">Tipo: <span className="font-medium">{selectedType === 'UNIT' ? 'Unidad' : 'Peso'}</span></span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 hover:bg-muted-foreground/20 rounded-full"
                  onClick={() => setSelectedType('all')}
                >
                  <span className="sr-only">Quitar filtro de tipo</span>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </Badge>
            )}
            {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                  setSelectedStatus('all')
                  setSelectedType('all')
                }}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent underline decoration-dotted underline-offset-4"
              >
                Limpiar todo
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <DataTable
          className="h-full"
          columns={columns}
          data={filteredProducts}
          loading={productsLoading || categoriesLoading}
          emptyMessage="No hay productos registrados."
        >
          {filteredProducts.map((product) => {
            const category = categories.find((c) => c.id === product.categoryId)
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {product.productType === 'WEIGHT' ? (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <Scale className="h-3 w-3" />
                        Peso
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <Package className="h-3 w-3" />
                        Unidad
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge>{category ? category.name : 'Sin categoría'}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(product.price)}</TableCell>
                <TableCell>
                  {product.isStockControlled ? (
                    <span
                      className={cn(
                        'font-medium',
                        product.stock <= (product.minStock || 0) && 'text-red-500'
                      )}
                    >
                      {product.stock}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {can(PERMISSIONS.PRODUCTS_STATUS) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleProductStatus(product.id, !product.isActive)
                      }}
                      disabled={isDeleting === product.id}
                      className={`text-sm font-medium ${product.isActive ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'} ${isDeleting === product.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  ) : (
                    <span className={`text-sm font-medium ${product.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  )}
                </TableCell>

                {(can(PERMISSIONS.PRODUCTS_EDIT) || can(PERMISSIONS.PRODUCTS_DELETE)) && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {can(PERMISSIONS.PRODUCTS_EDIT) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingProduct(product.id)
                          }}
                          title="Editar producto"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      )}

                      {can(PERMISSIONS.PRODUCTS_DELETE) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar producto"
                          disabled={isCheckingDeps || isDeleting === product.id}
                          onClick={async (e) => {
                            e.stopPropagation()
                            setIsCheckingDeps(true)
                            try {
                              const promos = await findPromotions(product.id)
                              setImpactedPromos(promos)
                              setProductToDelete(product.id)
                            } catch (error) {
                              console.error(error)
                              toast.error('Error verificando dependencias')
                            } finally {
                              setIsCheckingDeps(false)
                            }
                          }}

                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </DataTable>
      </div>

      <DeleteConfirmDialog
        open={!!productToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setProductToDelete(null)
            setImpactedPromos([])
          }
        }}
        onConfirm={() => productToDelete && handleDelete(productToDelete)}
        title={impactedPromos.length > 0 ? "⚠️ ¡Advertencia Importante!" : "¿Estás seguro de eliminar este producto?"}
        description={
          impactedPromos.length > 0 ? (
            <div className="space-y-3">
              <p className="text-red-500 font-medium">
                Este producto es parte de las siguientes promociones:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                {impactedPromos.map((p, i) => (
                  <li key={i} className="text-foreground">{p}</li>
                ))}
              </ul>
              <p>
                Si eliminas este producto, <strong>estas promociones TAMBIÉN serán eliminadas permanentemente</strong>.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                ¿Deseas continuar y eliminar TODO?
              </p>
            </div>
          ) : "Esta acción no se puede deshacer. El producto será eliminado permanentemente."
        }
        isDeleting={!!isDeleting}
      />
    </div>
  )
}

export default Products
