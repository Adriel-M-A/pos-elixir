import { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

interface CanProps {
    I: string
    children: ReactNode
    fallback?: ReactNode
}

export function Can({ I, children, fallback = null }: CanProps) {
    const { can } = useAuth()

    if (can(I)) {
        return <>{children}</>
    }

    return <>{fallback}</>
}
