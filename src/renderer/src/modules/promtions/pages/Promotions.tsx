import { useState } from 'react'
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut'
import usePromotions from '../hooks/usePromotions'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Search, Tag, Edit, Plus, Check, ChevronsUpDown, Activity } from 'lucide-react'
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
import { PromotionFormSheet } from '../components/PromotionFormSheet'
import { DataTable } from '../../../components/DataTable'
import { formatCurrency } from '../../../utils/currency'
import { cn } from '@/lib/utils'

export default function Promotions() {
  const { promotions, loading, togglePromotionStatus, deletePromotion } =
    usePromotions()
  const { can } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [openStatus, setOpenStatus] = useState(false)
  const [openType, setOpenType] = useState(false)
  const [promotionToDelete, setPromotionToDelete] = useState<number | null>(null)
  const [editingPromotion, setEditingPromotion] = useState<number | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  if (!can(PERMISSIONS.PROMOTIONS_VIEW)) {
    return <PermissionGuard message="No tienes permisos para ver las promociones." />
  }

  const handleCloseEdit = () => {
    setEditingPromotion(null)
  }

  useKeyboardShortcut(
    'n',
    () => {
      if (can(PERMISSIONS.PROMOTIONS_CREATE)) {
        setIsCreateOpen(true)
      }
    },
    { ctrlKey: true }
  )

  const filtered = promotions.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && p.isActive) ||
      (selectedStatus === 'inactive' && !p.isActive)

    const matchesType = selectedType === 'all' || p.discountType === selectedType

    return matchesSearch && matchesStatus && matchesType
  })

  // Dynamically define columns based on permissions
  const columns: { key: string; label: string; className?: string }[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'type', label: 'Tipo' },
    { key: 'discount', label: 'Valor Descuento' },
    { key: 'status', label: 'Estado' }
  ]

  if (can(PERMISSIONS.PROMOTIONS_EDIT) || can(PERMISSIONS.PROMOTIONS_DELETE)) {
    columns.push({ key: 'actions', label: 'Acciones', className: 'text-right' })
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-hidden">
      <PageHeader
        title="Promociones"
        description="Gestiona descuentos y ofertas especiales."
        actionButton={
          can(PERMISSIONS.PROMOTIONS_CREATE) ? (
            <PromotionFormSheet
              promotion={editingPromotion ? promotions.find((p) => p.id === editingPromotion) : null}
              open={isCreateOpen}
              onOpenChange={(open) => {
                setIsCreateOpen(open)
                if (!open) handleCloseEdit()
              }}
            >
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Promoción
              </Button>
            </PromotionFormSheet>
          ) : undefined
        }
      />

      <div className="shrink-0 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar promoción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-card"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Type Filter */}
            <Popover open={openType} onOpenChange={setOpenType}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openType}
                  className="w-full sm:w-[200px] justify-between bg-card h-10"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 shrink-0 opacity-50" />
                    <span>
                      {selectedType === 'all'
                        ? 'Todos los tipos'
                        : selectedType === 'PERCENTAGE'
                          ? 'Porcentaje'
                          : 'Monto Fijo'}
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
                        value="PERCENTAGE"
                        onSelect={() => {
                          setSelectedType('PERCENTAGE')
                          setOpenType(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedType === 'PERCENTAGE' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Porcentaje
                      </CommandItem>
                      <CommandItem
                        value="FIXED"
                        onSelect={() => {
                          setSelectedType('FIXED')
                          setOpenType(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedType === 'FIXED' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        Monto Fijo
                      </CommandItem>
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
        </div>

        {/* Active Filters Display inside space-y */}
        {(selectedStatus !== 'all' || selectedType !== 'all' || searchTerm) && (
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
            {selectedType !== 'all' && (
              <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                <Tag className="h-3.5 w-3.5 opacity-70" />
                <span className="ml-1">Tipo: <span className="font-medium">{selectedType === 'PERCENTAGE' ? 'Porcentaje' : 'Monto Fijo'}</span></span>
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
            {(searchTerm || selectedStatus !== 'all' || selectedType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
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
          data={filtered}
          loading={loading}
          emptyMessage="No hay promociones registradas."
        >
          {filtered.map((promo) => (
            <TableRow key={promo.id}>
              <TableCell className="font-medium">{promo.name}</TableCell>
              <TableCell>
                <Badge>{promo.discountType === 'PERCENTAGE' ? 'Porcentaje' : 'Monto Fijo'}</Badge>
              </TableCell>
              <TableCell className="font-semibold text-primary">
                {promo.discountType === 'PERCENTAGE'
                  ? `${promo.discountValue}%`
                  : formatCurrency(promo.discountValue)}
              </TableCell>
              <TableCell>
                {can(PERMISSIONS.PROMOTIONS_STATUS) ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePromotionStatus(promo.id, !promo.isActive)
                    }}
                    className={`text-sm font-medium ${promo.isActive ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {promo.isActive ? 'Activa' : 'Inactiva'}
                  </button>
                ) : (
                  <span className={`text-sm font-medium ${promo.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {promo.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                )}
              </TableCell>

              {(can(PERMISSIONS.PROMOTIONS_EDIT) || can(PERMISSIONS.PROMOTIONS_DELETE)) && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {can(PERMISSIONS.PROMOTIONS_EDIT) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingPromotion(promo.id)
                        }}
                        title="Editar promoción"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                    )}

                    {can(PERMISSIONS.PROMOTIONS_DELETE) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPromotionToDelete(promo.id)
                        }}
                        title="Eliminar promoción"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </DataTable>
        <DeleteConfirmDialog
          open={!!promotionToDelete}
          onOpenChange={(open) => !open && setPromotionToDelete(null)}
          onConfirm={async () => {
            if (promotionToDelete) {
              await deletePromotion(promotionToDelete)
              setPromotionToDelete(null)
            }
          }}
          title="¿Estás seguro de eliminar esta promoción?"
          description="Esta acción no se puede deshacer. La promoción será eliminada permanentemente."
        // Promtions page deletion logic doesn't explicitly have an 'isDeleting' loading state available in the hook?
        // Wait, hook returns 'deletePromotion' but does it expose a loading state?
        // Hook usage: const { ... deletePromotion } = usePromotions()
        // It doesn't seem to expose 'isDeleting'. I should handle it locally or ignore for now.
        // I will ignore 'isDeleting' prop (defaults to false) OR adding local state, but deletePromotion is async.
        // The original code waited for it.
        // I can wrap the onConfirm.
        />
      </div>
    </div>
  )
}
