import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { User, AppConfig } from '@shared/types'

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (data: { username: string; password: string }) => Promise<void>
    logout: () => void
    can: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()
    const location = useLocation()

    // Efecto único al montar para verificar estado inicial
    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            // 1. Obtener configuración (usa window.api definido en preload)
            const config = await window.api.invoke<AppConfig>('auth:get-config')

            let currentUser: User | null = null

            if (!config.ENABLE_USER_MANAGEMENT) {
                // 2. Modo Básico: Auto-login
                // Usa el canal 'auth:auto-login' que definimos en el backend
                currentUser = await window.api.invoke<User>('auth:auto-login')
            } else {
                // 3. Modo Pro: Verificar almacenamiento de sesión
                const storedUser = sessionStorage.getItem('pos_user')
                if (storedUser) {
                    currentUser = JSON.parse(storedUser)
                }
            }

            if (currentUser) {
                setUser(currentUser)
                window.api.window.setAppSize()
                // Redirección blindada: Si estamos en login y ya tenemos usuario, vamos al dashboard
                if (location.pathname === '/login') {
                    navigate('/', { replace: true })
                }
            } else {
                window.api.window.setLoginSize()
            }
            // Si no hay usuario, protectedRoute se encargará de redirigir a /login

        } catch (error) {
            console.error('Error durante inicialización de Auth:', error)
            // Si falla algo crítico (ej: auto-login falla), aseguramos que no quede cargando infinitamente
            setUser(null)
            window.api.window.setLoginSize()
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (data: { username: string; password: string }) => {
        try {
            // Usa window.api.invoke
            const result = await window.api.invoke<{ success: boolean; user?: User; error?: string }>('auth:login', data)

            if (!result.success || !result.user) {
                throw new Error(result.error || 'Error desconocido')
            }

            const loggedUser = result.user

            setUser(loggedUser)
            sessionStorage.setItem('pos_user', JSON.stringify(loggedUser))

            window.api.window.setAppSize()

            // Navegación explícita tras login exitoso
            navigate('/', { replace: true })
        } catch (error: any) {
            // Relanzamos el error para que el formulario lo muestre
            // El error original viene del backend (main process)
            throw error
        }
    }

    const logout = () => {
        setUser(null)
        sessionStorage.removeItem('pos_user')
        window.api.window.setLoginSize()
        navigate('/login', { replace: true })
    }

    const can = (permission: string): boolean => {
        if (!user) return false
        if (user.role === 'ADMIN') return true

        // Ensure permissions array exists
        const userPermissions = user.permissions || []
        return userPermissions.includes(permission)
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, can }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
