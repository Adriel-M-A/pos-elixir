import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ModuleLayoutProps {
    title: string
    subtitle?: string
    action?: React.ReactNode
    children: React.ReactNode
}

const ModuleLayout: React.FC<ModuleLayoutProps> = ({ title, subtitle, action, children }) => {
    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 space-y-6 overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                    {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
            <ScrollArea className="flex-1 bg-background rounded-lg border shadow-sm p-4">
                {children}
            </ScrollArea>
        </div>
    )
}

export default ModuleLayout
