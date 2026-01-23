import { cn } from '@/lib/utils'

interface SheetLayoutProps {
  children: React.ReactNode
  header: React.ReactNode
  footer: React.ReactNode
  className?: string
}

export function SheetLayout({ children, header, footer, className }: SheetLayoutProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-6 border-b bg-card shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">{header}</div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Footer */}
      <div className="p-6 bg-card border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">{footer}</div>
    </div>
  )
}
