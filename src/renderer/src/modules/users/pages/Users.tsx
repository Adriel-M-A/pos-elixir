import { useState, useEffect, useMemo } from 'react'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Search, Filter, Edit, Check, ChevronsUpDown, Activity, UserPlus } from 'lucide-react'
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TableCell, TableRow } from '@/components/ui/table'
import { type User, PERMISSIONS } from '@shared/types'
import { loadUsers, deleteUser, updateUser } from '../services/users.service'
import { UserFormSheet } from '../components/UserFormSheet'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { PageHeader } from '@/components/PageHeader'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'

export default function UsersPage() {
    const { can } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedRole, setSelectedRole] = useState<string>('all')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')

    // Popover states
    const [openRole, setOpenRole] = useState(false)
    const [openStatus, setOpenStatus] = useState(false)

    const [isDeleting, setIsDeleting] = useState(false)
    const [userToDelete, setUserToDelete] = useState<number | null>(null)
    const [isTogglingStatus, setIsTogglingStatus] = useState<number | null>(null)

    const fetchUsers = async () => {
        setIsLoading(true)
        try {
            const data = await loadUsers()
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Error al cargar usuarios')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()

        const handleUsersUpdated = () => fetchUsers()
        window.addEventListener('users-updated', handleUsersUpdated)
        return () => window.removeEventListener('users-updated', handleUsersUpdated)
    }, [])

    const handleDelete = async () => {
        if (!userToDelete) return

        try {
            setIsDeleting(true)
            await deleteUser(userToDelete)
            toast.success('Usuario eliminado')
            fetchUsers()
        } catch (error) {
            toast.error('Error al eliminar usuario')
        } finally {
            setIsDeleting(false)
            setUserToDelete(null)
        }
    }

    const handleStatusToggle = async (id: number, currentStatus: boolean) => {
        if (id === 1) return // Prevent disabling default admin

        try {
            setIsTogglingStatus(id)
            await updateUser(id, { is_active: !currentStatus })

            // Optimistic update
            setUsers(prev => prev.map(u =>
                u.id === id ? { ...u, is_active: !currentStatus } : u
            ))

            toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} correctamente`)
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error('Error al cambiar el estado')
            // Revert changes if needed by re-fetching
            fetchUsers()
        } finally {
            setIsTogglingStatus(null)
        }
    }

    const handleEdit = (user: User) => {
        setSelectedUser(user)
        setIsSheetOpen(true)
    }

    const handleCloseEdit = () => {
        setSelectedUser(null)
    }

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.username.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesRole = selectedRole === 'all' || user.role === selectedRole

            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'active' && user.is_active) ||
                (selectedStatus === 'inactive' && !user.is_active)

            return matchesSearch && matchesRole && matchesStatus
        })
    }, [users, searchTerm, selectedRole, selectedStatus])

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'default'
            case 'CASHIER': return 'secondary'
            default: return 'outline'
        }
    }

    const roleNames: Record<string, string> = {
        'ADMIN': 'Administrador',
        'CASHIER': 'Cajero'
    }

    return (
        <div className="flex flex-col h-full p-6 gap-6 overflow-hidden">
            <PageHeader
                title="Usuarios"
                description="Administra el acceso y permisos del sistema."
                actionButton={
                    can(PERMISSIONS.USERS_MANAGE) ? (
                        <UserFormSheet
                            onSuccess={fetchUsers}
                            open={isSheetOpen}
                            onOpenChange={(open) => {
                                setIsSheetOpen(open)
                                if (!open) handleCloseEdit()
                            }}
                            user={selectedUser}
                        >
                            <Button className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Nuevo Usuario
                            </Button>
                        </UserFormSheet>
                    ) : null
                }
            />

            {/* Filters Section */}
            <div className="shrink-0 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar usuario por nombre o usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10 bg-card"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Role Filter */}
                        <Popover open={openRole} onOpenChange={setOpenRole}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openRole}
                                    className="w-full sm:w-[200px] justify-between bg-card h-10"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Filter className="h-4 w-4 shrink-0 opacity-50" />
                                        <span className="truncate">
                                            {selectedRole === 'all'
                                                ? 'Todos los roles'
                                                : roleNames[selectedRole] || selectedRole}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0 bg-popover" align="end">
                                <Command>
                                    <CommandList>
                                        <CommandGroup>
                                            <CommandItem value="all" onSelect={() => { setSelectedRole('all'); setOpenRole(false) }}>
                                                <Check className={cn('mr-2 h-4 w-4', selectedRole === 'all' ? 'opacity-100' : 'opacity-0')} />
                                                Todos los roles
                                            </CommandItem>
                                            <CommandItem value="ADMIN" onSelect={() => { setSelectedRole('ADMIN'); setOpenRole(false) }}>
                                                <Check className={cn('mr-2 h-4 w-4', selectedRole === 'ADMIN' ? 'opacity-100' : 'opacity-0')} />
                                                Administrador
                                            </CommandItem>
                                            <CommandItem value="CASHIER" onSelect={() => { setSelectedRole('CASHIER'); setOpenRole(false) }}>
                                                <Check className={cn('mr-2 h-4 w-4', selectedRole === 'CASHIER' ? 'opacity-100' : 'opacity-0')} />
                                                Cajero
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
                    </div>
                </div>

                {/* Active Filters Badges */}
                {(selectedRole !== 'all' || selectedStatus !== 'all' || searchTerm) && (
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
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </Button>
                            </Badge>
                        )}
                        {selectedRole !== 'all' && (
                            <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                                <Filter className="h-3.5 w-3.5 opacity-70" />
                                <span className="ml-1">Rol: <span className="font-medium">{roleNames[selectedRole]}</span></span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 ml-1 hover:bg-muted-foreground/20 rounded-full"
                                    onClick={() => setSelectedRole('all')}
                                >
                                    <span className="sr-only">Quitar filtro de rol</span>
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </Button>
                            </Badge>
                        )}
                        {selectedStatus !== 'all' && (
                            <Badge variant="secondary" className="h-7 gap-1 pl-2.5 pr-1.5 text-sm font-normal">
                                <div className={`w-2 h-2 rounded-full mr-1 ${selectedStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span>Estado: <span className="font-medium">{selectedStatus === 'active' ? 'Activos' : 'Inactivos'}</span></span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 ml-1 hover:bg-muted-foreground/20 rounded-full"
                                    onClick={() => setSelectedStatus('all')}
                                >
                                    <span className="sr-only">Quitar filtro de estado</span>
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </Button>
                            </Badge>
                        )}
                        {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('')
                                    setSelectedRole('all')
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

            {/* Content & Table */}
            <div className="flex-1 overflow-hidden min-h-0">
                <DataTable
                    className="h-full"
                    columns={[
                        { key: 'name', label: 'Nombre' },
                        { key: 'username', label: 'Usuario' },
                        { key: 'role', label: 'Rol' },
                        { key: 'status', label: 'Estado' },
                        { key: 'actions', label: 'Acciones', className: 'text-right' }
                    ]}
                    data={filteredUsers}
                    loading={isLoading}
                    emptyMessage="No se encontraron usuarios."
                >
                    {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                                <Badge variant={getRoleBadgeVariant(user.role)}>{roleNames[user.role] || user.role}</Badge>
                            </TableCell>
                            <TableCell>
                                {can(PERMISSIONS.USERS_MANAGE) && user.id !== 1 ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleStatusToggle(user.id, user.is_active)
                                        }}
                                        disabled={isTogglingStatus === user.id}
                                        className={`text-sm font-medium ${user.is_active ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'} ${isTogglingStatus === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {user.is_active ? 'Activo' : 'Inactivo'}
                                    </button>
                                ) : (
                                    <div className={`flex items-center gap-2 ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                        <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-600' : 'bg-gray-400'}`} />
                                        <span className="text-sm font-medium">{user.is_active ? 'Activo' : 'Inactivo'}</span>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {can(PERMISSIONS.USERS_MANAGE) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEdit(user)
                                            }}
                                            title="Editar usuario"
                                        >
                                            <Edit className="h-4 w-4" />
                                            <span className="sr-only">Editar</span>
                                        </Button>
                                    )}

                                    {can(PERMISSIONS.USERS_MANAGE) && user.id !== 1 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                            title="Eliminar usuario"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setUserToDelete(user.id)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Eliminar</span>
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </DataTable>
            </div>

            <DeleteConfirmDialog
                open={!!userToDelete}
                onOpenChange={(open) => !open && setUserToDelete(null)}
                onConfirm={handleDelete}
                title={`¿Eliminar usuario ${users.find(u => u.id === userToDelete)?.username}?`}
                description={`Esta acción eliminará permanentemente al usuario "${users.find(u => u.id === userToDelete)?.name}".`}
                isDeleting={isDeleting}
            />
        </div>
    )
}
