import { useState } from 'react'
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut'
import useCategories from '../hooks/useCategories'
import useProducts from '../../products/hooks/useProducts'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Search, Edit, Plus, Check, ChevronsUpDown, Activity, LayoutGrid } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { PERMISSIONS } from '@shared/types'
import { PageHeader } from '@/components/PageHeader'
import { PermissionGuard } from '@/components/PermissionGuard'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { CategoryFormSheet } from '../components/CategoryFormSheet'
import { DataTable } from '../../../components/DataTable'
import { cn } from '@/lib/utils'

function Categories() {
  const { categories, loading, toggleCategoryStatus, deleteCategory, countProducts } =
    useCategories()
  const { products } = useProducts()
  const { can } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [openStatus, setOpenStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const [affectedProductsCount, setAffectedProductsCount] = useState<number>(0)
  const [isCheckingDeps, setIsCheckingDeps] = useState(false)
  const [editingCategory, setEditingCategory] = useState<number | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleCloseEdit = () => {
    setEditingCategory(null)
  }

  if (!can(PERMISSIONS.CATEGORIES_VIEW)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <LayoutGrid className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold tracking-tight">Acceso Restringido</h3>
          <p className="text-sm text-muted-foreground">
            No tienes permisos para ver las categorías.
          </p>
        </div>
      </div>
    )
  }

  if (!can(PERMISSIONS.CATEGORIES_VIEW)) {
    return <PermissionGuard message="No tienes permisos para ver las categorías." /> // Keep the custom message request if needed, or use default
  }

  useKeyboardShortcut(
    'n',
    () => {
      if (can(PERMISSIONS.CATEGORIES_CREATE)) {
        setIsCreateOpen(true)
      }
    },
    { ctrlKey: true }
  )

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(id)
      await deleteCategory(id)
      toast.success('Categoría eliminada correctamente')
      setCategoryToDelete(null) // Reset selection
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Error al eliminar la categoría')
    } finally {
      setIsDeleting(null)
    }
  }

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && category.isActive) ||
      (selectedStatus === 'inactive' && !category.isActive)

    return matchesSearch && matchesStatus
  })

  // Dynamically define columns based on permissions
  const columns: { key: string; label: string; className?: string }[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'productCount', label: 'Productos' },
    { key: 'status', label: 'Estado' }
  ]

  if (can(PERMISSIONS.CATEGORIES_EDIT) || can(PERMISSIONS.CATEGORIES_DELETE)) {
    columns.push({ key: 'actions', label: 'Acciones', className: 'text-right' })
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-hidden">
      <PageHeader
        title="Categorías"
        description="Administra las categorías de productos."
        actionButton={
          can(PERMISSIONS.CATEGORIES_CREATE) ? (
            <CategoryFormSheet
              category={editingCategory ? categories.find((c) => c.id === editingCategory) : null}
              open={isCreateOpen}
              onOpenChange={(open) => {
                setIsCreateOpen(open)
                if (!open) handleCloseEdit()
              }}
            >
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Categoría
              </Button>
            </CategoryFormSheet>
          ) : undefined
        }
      />

      <div className="shrink-0 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-card"
            />
          </div>

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
                        ? 'Activas'
                        : 'Inactivas'}
                  </span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-popover" align="end">
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
                      Activas
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
                      Inactivas
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Display inside space-y */}
        {(selectedStatus !== 'all' || searchTerm) && (
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
            {selectedStatus !== 'all' && (
              <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                <div
                  className={`w-2 h-2 rounded-full mr-1 ${selectedStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}
                ></div>
                <span>Estado: <span className="font-medium">{selectedStatus === 'active' ? 'Activas' : 'Inactivas'}</span></span>
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
            {(searchTerm || selectedStatus !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedStatus('all')
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
          data={filteredCategories}
          loading={loading}
          emptyMessage="No se encontraron categorías."
        >
          {filteredCategories.map((category) => {
            const productCount = products.filter((p) => p.categoryId === category.id).length
            return (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  <Badge variant={productCount > 0 ? 'default' : 'secondary'}>{productCount}</Badge>
                </TableCell>
                <TableCell>
                  {can(PERMISSIONS.CATEGORIES_STATUS) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCategoryStatus(category.id, !category.isActive)
                      }}
                      disabled={isDeleting === category.id}
                      className={`text-sm font-medium ${category.isActive ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'} ${isDeleting === category.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {category.isActive ? 'Activa' : 'Inactiva'}
                    </button>
                  ) : (
                    <span className={`text-sm font-medium ${category.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {category.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  )}
                </TableCell>

                {(can(PERMISSIONS.CATEGORIES_EDIT) || can(PERMISSIONS.CATEGORIES_DELETE)) && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {can(PERMISSIONS.CATEGORIES_EDIT) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCategory(category.id)
                          }}
                          title="Editar categoría"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      )}

                      {can(PERMISSIONS.CATEGORIES_DELETE) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar categoría"
                          disabled={isDeleting === category.id || isCheckingDeps}
                          onClick={async (e) => {
                            e.stopPropagation()
                            setIsCheckingDeps(true)
                            try {
                              const count = await countProducts(category.id)
                              setAffectedProductsCount(count)
                              setCategoryToDelete(category.id)
                            } catch (e) {
                              console.error(e)
                              toast.error('Error al verificar productos')
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
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        onConfirm={() => categoryToDelete && handleDelete(categoryToDelete)}
        title="¿Estás seguro de eliminar esta categoría?"
        description={
          affectedProductsCount > 0
            ? `Esta categoría tiene ${affectedProductsCount} productos asociados. Al eliminarla, estos productos quedarán sin categoría.`
            : 'Esta acción no se puede deshacer. La categoría será eliminada permanentemente.'
        }
        isDeleting={!!isDeleting}
      />
    </div>
  )
}

export default Categories
