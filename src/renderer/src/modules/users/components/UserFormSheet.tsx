import { useState, useEffect } from 'react'
import { User as UserIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { SheetLayout } from '@/components/ui/sheet-layout'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { createUser, updateUser } from '../services/users.service'
import { type User, PERMISSIONS } from '@shared/types'
import { Loader2 } from 'lucide-react'

// Schema validation
const userSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede superar los 50 caracteres'),
    username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(20, 'El usuario no puede superar los 20 caracteres'),
    role: z.enum(['ADMIN', 'CASHIER'] as const),
    password: z.string().optional(),
    permissions: z.array(z.string()).optional()
}).refine((_) => {
    // Password required for creation (no ID) logic handled in component submit
    return true
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormSheetProps {
    user?: User | null
    children?: React.ReactNode
    onOpenChange?: (open: boolean) => void
    open?: boolean
    onSuccess?: () => void
}

export function UserFormSheet({
    user,
    children,
    onOpenChange,
    open: externalOpen,
    onSuccess
}: UserFormSheetProps) {
    const [open, setOpen] = useState(false)
    const isEditing = !!user

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            username: '',
            role: 'CASHIER',
            password: '',
            permissions: []
        }
    })

    const role = form.watch('role')

    const DEFAULT_CASHIER_PERMISSIONS = [
        PERMISSIONS.POS_ACCESS, // Mandatory
        PERMISSIONS.POS_DISCOUNT,
        PERMISSIONS.SALES_VIEW,
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.CATEGORIES_VIEW,
        PERMISSIONS.PROMOTIONS_VIEW
    ]

    useEffect(() => {
        if (externalOpen !== undefined) {
            setOpen(externalOpen)
        }
    }, [externalOpen])

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name,
                username: user.username,
                role: user.role,
                password: '',
                permissions: user.permissions || []
            })
        } else {
            form.reset({
                name: '',
                username: '',
                role: 'CASHIER',
                password: '',
                permissions: DEFAULT_CASHIER_PERMISSIONS
            })
        }
    }, [user, open, form])

    useEffect(() => {
        if (!isEditing && role === 'CASHIER') {
            // Set default permissions for new Cashiers
            // Only set if permissions are empty to avoid overwriting custom changes if we add more logic later
            const currentPermissions = form.getValues('permissions') || []
            if (currentPermissions.length === 0) {
                form.setValue('permissions', DEFAULT_CASHIER_PERMISSIONS)
            }
        } else if (role === 'ADMIN') {
            // Admin doesn't need explicit permissions
            form.setValue('permissions', [])
        } else if (role === 'CASHIER') {
            // Existing or new cashier: Ensure POS_ACCESS is always present
            const currentPermissions = form.getValues('permissions') || []
            if (!currentPermissions.includes(PERMISSIONS.POS_ACCESS)) {

                // Add POS_ACCESS and ensure view permissions if needed (though togglePermission handles views)
                // We just force push it here
                const newPermissions = [...currentPermissions, PERMISSIONS.POS_ACCESS]

                // Also ensure PROMOTIONS_VIEW etc? For now just mandatory POS_ACCESS
                form.setValue('permissions', newPermissions)
            }
        }
    }, [role, isEditing, form])

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        onOpenChange?.(newOpen)
        if (!newOpen) {
            form.reset()
        }
    }

    const onSubmit = async (data: UserFormValues) => {
        try {
            if (!isEditing && !data.password) {
                form.setError('password', { message: 'La contraseña es requerida para nuevos usuarios' })
                return
            }

            // Prepare the payload compatible with CreateUserDto / UpdateUserDto
            const submissionData: Partial<User> & { password?: string } = {
                ...data,
                permissions: data.role === 'ADMIN' ? [] : data.permissions,
                is_active: true
            }

            if (isEditing && user) {
                const updateData = { ...submissionData }
                // Remove password if empty to avoid overwriting with empty string
                if (!updateData.password) {
                    delete updateData.password
                }

                await updateUser(user.id, updateData)
                toast.success('Usuario actualizado correctamente')
            } else {
                if (!submissionData.password) {
                    // Should be caught by validation, but just in case
                    throw new Error('Password required for new users')
                }
                const createData = submissionData as Partial<User> & { password?: string }
                await createUser(createData)
                toast.success('Usuario creado correctamente')
            }

            onSuccess?.()
            setOpen(false)
            onOpenChange?.(false)
        } catch (error: any) {
            console.error('Error saving user:', error)

            // Check for the specific error message from backend
            if (error.message && error.message.includes('USERNAME_EXISTS')) {
                form.setError('username', {
                    type: 'manual',
                    message: 'Este nombre de usuario ya está en uso'
                })
                return // Stop execution, don't show generic toast
            }

            toast.error('Error al guardar usuario')
        }
    }

    const togglePermission = (permission: string, checked: boolean) => {
        // Prevent disabling POS_ACCESS for Cashiers
        if (permission === PERMISSIONS.POS_ACCESS && role === 'CASHIER' && !checked) {
            return
        }

        const currentPermissions = form.getValues('permissions') || []

        if (checked) {
            let newPermissions = [...currentPermissions, permission]

            // Rule 1: Enabling any action (create, edit, etc) requires enables VIEW
            const [module] = permission.split(':')
            const viewPermission = `${module}:view`

            if (permission !== viewPermission && Object.values(PERMISSIONS).includes(viewPermission as any)) {
                if (!newPermissions.includes(viewPermission)) {
                    newPermissions.push(viewPermission)
                }
            }

            form.setValue('permissions', newPermissions, { shouldDirty: true })
        } else {
            let newPermissions = currentPermissions.filter(p => p !== permission)

            // Rule 2: Disabling VIEW disables all other actions for that module
            if (permission.endsWith(':view')) {
                const module = permission.split(':')[0]
                newPermissions = newPermissions.filter(p => !p.startsWith(`${module}:`))
            }

            form.setValue('permissions', newPermissions, { shouldDirty: true })
        }
    }

    const header = (
        <SheetHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span className="text-xs font-mono uppercase tracking-wider">
                    {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                </span>
            </div>
            <SheetTitle className="text-2xl font-bold mt-2">
                {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
            </SheetTitle>
        </SheetHeader>
    )

    const footer = (
        <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            className="w-full"
            disabled={form.formState.isSubmitting}
        >
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Actualizar Usuario' : 'Guardar Usuario'}
        </Button>
    )

    const permissionGroups = [
        {
            title: 'Ventas',
            permissions: [
                { id: PERMISSIONS.POS_ACCESS, label: 'Acceso al POS' },
                { id: PERMISSIONS.POS_DISCOUNT, label: 'Aplicar Descuentos' },
                { id: PERMISSIONS.SALES_VIEW, label: 'Ver Historial de Ventas' },
                { id: PERMISSIONS.SALES_CANCEL, label: 'Cancelar Ventas' }
            ]
        },
        {
            title: 'Productos',
            permissions: [
                { id: PERMISSIONS.PRODUCTS_VIEW, label: 'Ver Productos' },
                { id: PERMISSIONS.PRODUCTS_CREATE, label: 'Crear Productos' },
                { id: PERMISSIONS.PRODUCTS_EDIT, label: 'Editar Productos' },
                { id: PERMISSIONS.PRODUCTS_DELETE, label: 'Eliminar Productos' },
                { id: PERMISSIONS.PRODUCTS_STATUS, label: 'Cambiar Estado' }
            ]
        },
        {
            title: 'Categorías',
            permissions: [
                { id: PERMISSIONS.CATEGORIES_VIEW, label: 'Ver Categorías' },
                { id: PERMISSIONS.CATEGORIES_CREATE, label: 'Crear Categorías' },
                { id: PERMISSIONS.CATEGORIES_EDIT, label: 'Editar Categorías' },
                { id: PERMISSIONS.CATEGORIES_DELETE, label: 'Eliminar Categorías' },
                { id: PERMISSIONS.CATEGORIES_STATUS, label: 'Cambiar Estado' }
            ]
        },
        {
            title: 'Promociones',
            permissions: [
                { id: PERMISSIONS.PROMOTIONS_VIEW, label: 'Ver Promociones' },
                { id: PERMISSIONS.PROMOTIONS_CREATE, label: 'Crear Promociones' },
                { id: PERMISSIONS.PROMOTIONS_EDIT, label: 'Editar Promociones' },
                { id: PERMISSIONS.PROMOTIONS_DELETE, label: 'Eliminar Promociones' },
                { id: PERMISSIONS.PROMOTIONS_STATUS, label: 'Cambiar Estado' }
            ]
        },
        {
            title: 'Administración',
            permissions: [
                { id: PERMISSIONS.REPORTS_VIEW, label: 'Ver Reportes' },
                { id: PERMISSIONS.SETTINGS_MANAGE, label: 'Gestionar Configuración' },
                { id: PERMISSIONS.USERS_MANAGE, label: 'Gestionar Usuarios' }
            ]
        }
    ]

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            {children ? (
                <SheetTrigger asChild>{children}</SheetTrigger>
            ) : (
                <SheetTrigger asChild>
                    <Button>Nuevo Usuario</Button>
                </SheetTrigger>
            )}
            <SheetContent className="w-full sm:max-w-md p-0 bg-background border-l">
                <SheetLayout header={header} footer={footer}>
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-6">

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="name">Nombre Completo</Label>
                                    <span className="text-xs text-muted-foreground">{form.watch('name')?.length || 0}/50 caracteres</span>
                                </div>
                                <Input
                                    id="name"
                                    placeholder="Ej: Juan Pérez"
                                    maxLength={50}
                                    {...form.register('name')}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="username">Nombre de Usuario</Label>
                                    <span className="text-xs text-muted-foreground">{form.watch('username')?.length || 0}/20 caracteres</span>
                                </div>
                                <Input
                                    id="username"
                                    placeholder="Ej: jperez"
                                    maxLength={20}
                                    {...form.register('username')}
                                />
                                {form.formState.errors.username && (
                                    <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label>Rol del Usuario</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        onClick={() => form.setValue('role', 'ADMIN')}
                                        className={`cursor-pointer border rounded-md p-3 flex flex-col items-center justify-center gap-1.5 transition-all hover:border-primary/50 ${role === 'ADMIN' ? 'border-primary bg-primary/5' : 'bg-card'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-full ${role === 'ADMIN' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            <UserIcon className="h-4 w-4" />
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-sm font-medium ${role === 'ADMIN' ? 'text-primary' : 'text-foreground'}`}>Admin</p>
                                            <p className="text-[10px] text-muted-foreground">Acceso total</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => form.setValue('role', 'CASHIER')}
                                        className={`cursor-pointer border rounded-md p-3 flex flex-col items-center justify-center gap-1.5 transition-all hover:border-primary/50 ${role === 'CASHIER' ? 'border-primary bg-primary/5' : 'bg-card'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-full ${role === 'CASHIER' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            <UserIcon className="h-4 w-4" />
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-sm font-medium ${role === 'CASHIER' ? 'text-primary' : 'text-foreground'}`}>Vendedor</p>
                                            <p className="text-[10px] text-muted-foreground">Acceso limitado</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">
                                        {isEditing ? 'Contraseña (Dejar en blanco para mantener)' : 'Contraseña'}
                                    </Label>
                                    <span className="text-xs text-muted-foreground">{form.watch('password')?.length || 0}/50 caracteres</span>
                                </div>
                                <PasswordInput
                                    id="password"
                                    placeholder="••••"
                                    maxLength={50}
                                    {...form.register('password')}
                                />
                                {form.formState.errors.password && (
                                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                                )}
                            </div>

                            {/* Permissions Section */}
                            {role !== 'ADMIN' && (
                                <div className="space-y-4 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">Permisos</Label>
                                        <span className="text-xs text-muted-foreground">Específicos para este rol</span>
                                    </div>

                                    {permissionGroups.map((group) => (
                                        <div key={group.title} className="space-y-2">
                                            <h4 className="text-sm font-medium text-muted-foreground/80 bg-muted/30 px-2 py-1 rounded">
                                                {group.title}
                                            </h4>
                                            <div className="space-y-2 px-1">
                                                {group.permissions.map((perm) => (
                                                    <div key={perm.id} className="flex items-start space-x-2">
                                                        <Checkbox
                                                            id={perm.id}
                                                            checked={(form.watch('permissions') || []).includes(perm.id)}
                                                            onCheckedChange={(checked) => togglePermission(perm.id, !!checked)}
                                                            disabled={perm.id === PERMISSIONS.POS_ACCESS}
                                                        />
                                                        <Label
                                                            htmlFor={perm.id}
                                                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer pt-0.5"
                                                        >
                                                            {perm.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {role === 'ADMIN' && (
                                <div className="p-3 bg-blue-50/50 text-blue-900 rounded-md text-sm border border-blue-100">
                                    <p className="font-medium">Acceso Total</p>
                                    <p className="text-blue-700/80 text-xs mt-1">
                                        Los administradores tienen acceso irrestricto a todas las funciones del sistema por defecto.
                                    </p>
                                </div>
                            )}

                        </div>
                    </ScrollArea>
                </SheetLayout>
            </SheetContent>
        </Sheet>
    )
}
