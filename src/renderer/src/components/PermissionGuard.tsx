import { ShieldAlert } from 'lucide-react'

interface PermissionGuardProps {
    message?: string
}

export function PermissionGuard({ message = 'No tienes permisos para acceder a esta sección.' }: PermissionGuardProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center animate-in fade-in duration-300">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <ShieldAlert className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight">Acceso Restringido</h3>
                <p className="text-sm text-muted-foreground">
                    {message}
                </p>
            </div>
        </div>
    )
}
