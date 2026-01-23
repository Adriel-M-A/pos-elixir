import { useState } from 'react'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SheetLayout } from '@/components/ui/sheet-layout'
import { ScrollArea } from '@/components/ui/scroll-area'

export type DateFilterPreset = 'hoy' | 'ayer' | 'semana' | 'quincena' | 'mes' | 'rango'

interface DateRange {
    start: string
    end: string
}

interface ReportsFilterSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply: (range: DateRange, meta: { filterType: DateFilterPreset }) => void
    initialPreset?: DateFilterPreset
}

export function ReportsFilterSheet({
    open,
    onOpenChange,
    onApply,
    initialPreset = 'hoy'
}: ReportsFilterSheetProps) {
    const [filterType, setFilterType] = useState<DateFilterPreset>(initialPreset)
    const [customRange, setCustomRange] = useState<DateRange>(() => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`
        return {
            start: todayStr,
            end: todayStr
        }
    })

    // Calculation logic reused from DateFilterSection
    const calculateRange = (type: DateFilterPreset): DateRange => {
        const today = new Date()
        const formatDate = (date: Date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }

        let range: DateRange
        switch (type) {
            case 'ayer': {
                const yesterday = new Date(today)
                yesterday.setDate(today.getDate() - 1)
                range = { start: formatDate(yesterday), end: formatDate(yesterday) }
                break
            }
            case 'semana': {
                const start = new Date(today)
                start.setDate(today.getDate() - today.getDay())
                range = { start: formatDate(start), end: formatDate(today) }
                break
            }
            case 'quincena': {
                const start = new Date(today)
                start.setDate(today.getDate() - 15)
                range = { start: formatDate(start), end: formatDate(today) }
                break
            }
            case 'mes': {
                const start = new Date(today.getFullYear(), today.getMonth(), 1)
                range = { start: formatDate(start), end: formatDate(today) }
                break
            }
            case 'rango':
                range = customRange
                break
            case 'hoy':
            default:
                range = { start: formatDate(today), end: formatDate(today) }
                break
        }

        return range
    }

    const handleApply = () => {
        if (filterType === 'rango' && customRange.end < customRange.start) {
            toast.error('La fecha de fin no puede ser menor a la de inicio')
            return
        }
        const range = calculateRange(filterType)
        onApply(range, { filterType })
        onOpenChange(false)
    }

    const isCustom = filterType === 'rango'

    const header = (
        <SheetHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span className="text-xs font-mono uppercase tracking-wider">
                    Filtros de Reporte
                </span>
            </div>
            <SheetTitle className="text-2xl font-bold mt-2">
                Filtrar Resultados
            </SheetTitle>
        </SheetHeader>
    )

    const footer = (
        <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancelar
            </Button>
            <Button className="flex-1" onClick={handleApply}>
                Aplicar Filtros
            </Button>
        </div>
    )

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md p-0 bg-background border-l">
                <SheetLayout header={header} footer={footer}>
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-6">
                            {/* Date Filter Section */}
                            <div className="space-y-4">
                                <Label className="text-base font-medium">Período de Tiempo</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Hoy', value: 'hoy' },
                                        { label: 'Ayer', value: 'ayer' },
                                        { label: 'Esta Semana', value: 'semana' },
                                        { label: 'Últimos 15 días', value: 'quincena' },
                                        { label: 'Este Mes', value: 'mes' },
                                        { label: 'Personalizado', value: 'rango' }
                                    ].map((option) => (
                                        <Button
                                            key={option.value}
                                            variant={filterType === option.value ? 'default' : 'outline'}
                                            onClick={() => setFilterType(option.value as DateFilterPreset)}
                                            className={cn(
                                                'w-full justify-start',
                                                filterType === option.value && 'bg-primary text-primary-foreground'
                                            )}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </div>

                                {/* Custom Range Inputs */}
                                <div
                                    className={cn(
                                        'space-y-3 p-4 rounded-lg border bg-card transition-all duration-200',
                                        isCustom
                                            ? 'opacity-100'
                                            : 'opacity-50 pointer-events-none grayscale'
                                    )}
                                >
                                    <div className="grid gap-2">
                                        <Label>Desde</Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="date"
                                                disabled={!isCustom}
                                                value={customRange.start}
                                                onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Hasta</Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="date"
                                                disabled={!isCustom}
                                                min={customRange.start}
                                                value={customRange.end}
                                                onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </SheetLayout>
            </SheetContent>
        </Sheet>
    )
}
