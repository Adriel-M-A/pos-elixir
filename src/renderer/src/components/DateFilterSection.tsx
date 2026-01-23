import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronDown, Filter } from 'lucide-react'
import { cn } from '@/lib/utils' // Asumo que tienes esta utilidad, si no, usa template strings normales

interface DateRange {
  start: string
  end: string
}

export type DateFilterPreset = 'hoy' | 'ayer' | 'semana' | 'quincena' | 'mes' | 'rango'

interface DateFilterSectionProps {
  onFilterChange: (range: DateRange, meta?: { filterType: DateFilterPreset }) => void
}

export function DateFilterSection({ onFilterChange }: DateFilterSectionProps) {
  const [filterType, setFilterType] = useState<DateFilterPreset>('hoy')
  const [customRange, setCustomRange] = useState<DateRange>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

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

  useEffect(() => {
    const range = calculateRange(filterType)
    onFilterChange(range, { filterType })
  }, [filterType, customRange.start, customRange.end])

  const isCustom = filterType === 'rango'

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 p-1 bg-background sm:bg-transparent rounded-lg">
      {/* Selector de Presets */}
      <div className="relative group w-full sm:w-auto">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Filter className="h-4 w-4" />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as DateFilterPreset)}
          className={cn(
            'h-10 w-full sm:w-40 appearance-none rounded-md border border-input bg-card pl-9 pr-8 text-sm font-medium shadow-sm transition-colors',
            'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            'hover:bg-accent hover:text-accent-foreground cursor-pointer'
          )}
        >
          <option value="hoy">Hoy</option>
          <option value="ayer">Ayer</option>
          <option value="semana">Esta Semana</option>
          <option value="quincena">Últimos 15 días</option>
          <option value="mes">Este Mes</option>
          <option value="rango">Rango</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>

      <div
        className={cn(
          'flex items-center gap-2 rounded-md border border-input bg-card p-1 shadow-sm transition-all duration-200',
          isCustom
            ? 'opacity-100 ring-1 ring-primary/20'
            : 'opacity-60 grayscale pointer-events-none bg-muted/50 border-transparent'
        )}
      >
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
            <CalendarIcon className="h-3.5 w-3.5" />
          </div>

          <input
            type="date"
            disabled={!isCustom}
            value={isCustom ? customRange.start : calculateRange(filterType).start}
            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
            className={cn(
              'h-8 bg-transparent pl-9 pr-2 text-sm font-medium focus:outline-none cursor-pointer',
              'text-foreground',
              'dark:scheme-dark'
            )}
          />
        </div>

        <span className="text-muted-foreground text-xs font-medium px-1">a</span>

        <div className="relative">
          <input
            type="date"
            disabled={!isCustom}
            value={isCustom ? customRange.end : calculateRange(filterType).end}
            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
            className={cn(
              'h-8 bg-transparent pl-2 pr-2 text-sm font-medium focus:outline-none cursor-pointer',
              'text-foreground',
              'dark:scheme-dark'
            )}
          />
        </div>
      </div>
    </div>
  )
}
