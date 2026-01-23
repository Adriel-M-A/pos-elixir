import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '@shared/types'

interface RoleGuardProps {
    allowedRoles: Role[]
}

export const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Cargando...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect to dashboard if role is not allowed
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
