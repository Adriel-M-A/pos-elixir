import { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    description?: string
    actionButton?: ReactNode
}

export function PageHeader({ title, description, actionButton }: PageHeaderProps) {
    return (
        <div className="flex justify-between items-center shrink-0">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            {actionButton}
        </div>
    )
}
