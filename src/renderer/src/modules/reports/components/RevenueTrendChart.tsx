import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import type { DailySaleRow } from '@types'
import { formatCurrency } from '../../../utils/currency'

interface RevenueTrendChartProps {
  sales: DailySaleRow[]
}

function buildHourlyTrend(sales: DailySaleRow[]) {
  const base = Array.from({ length: 24 }, (_, hour) => ({
    label: `${hour.toString().padStart(2, '0')}:00`,
    total: 0
  }))

  for (const sale of sales) {
    const createdAt = new Date(sale.createdAt)
    const hour = Number.isNaN(createdAt.getTime()) ? 0 : createdAt.getHours()
    base[hour].total += sale.finalTotal
  }

  return base.map((entry) => ({ ...entry, total: Number(entry.total.toFixed(2)) }))
}

export function RevenueTrendChart({ sales }: RevenueTrendChartProps) {
  const [startHour, setStartHour] = useState('8')
  const [endHour, setEndHour] = useState('24') // 24 represents 00:00 at the end of the day

  const trendData = useMemo(() => {
    if (!sales.length) {
      return []
    }

    const rawData = buildHourlyTrend(sales)

    // Process data to handle 00:00 as 24:00 (end of day)
    const processedData = rawData.map((item, index) => {
      // index 0 is 00:00. We want to treat it as hour 24 for sorting/filtering
      const effectiveHour = index === 0 ? 24 : index
      return {
        ...item,
        originalHour: index,
        effectiveHour,
        // Optional: Custom label for 24 if needed, but '00:00' is fine.
        // Maybe change label to 24:00 for sorting context? No, keep display label.
      }
    })

    // Sort by effective hour (1 to 24)
    processedData.sort((a, b) => a.effectiveHour - b.effectiveHour)

    // Filter by range
    const start = parseInt(startHour) || 0
    const end = parseInt(endHour) || 24

    return processedData.filter(item => {
      return item.effectiveHour >= start && item.effectiveHour <= end
    })
  }, [sales, startHour, endHour])

  const handleStartHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Allow empty for typing
    if (val === '') {
      setStartHour('')
      return
    }
    const num = parseInt(val)
    if (!isNaN(num) && num >= 1 && num <= 24) {
      setStartHour(val)
    }
  }

  const handleEndHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      setEndHour('')
      return
    }
    const num = parseInt(val)
    if (!isNaN(num) && num >= 1 && num <= 24) {
      setEndHour(val)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Tendencia horaria de ingresos
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Desde:</span>
            <Input
              type="number"
              min={1}
              max={24}
              value={startHour}
              onChange={handleStartHourChange}
              className="h-8 w-16 text-center px-1"
            />
            <span className="text-xs text-muted-foreground">h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Hasta:</span>
            <Input
              type="number"
              min={1}
              max={24}
              value={endHour}
              onChange={handleEndHourChange}
              className="h-8 w-16 text-center px-1"
            />
            <span className="text-xs text-muted-foreground">h</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pt-4">
        {trendData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No hay datos suficientes para graficar en este rango.
          </div>
        ) : (
          <div className="h-full w-full text-muted-foreground">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} aspect={undefined}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.25} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                />
                <YAxis
                  width={92}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value).replace('$', '$ ')}
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-popover p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Hora
                              </span>
                              <span className="font-bold text-foreground">
                                {label}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Ventas
                              </span>
                              <span className="font-bold text-foreground">
                                {formatCurrency(payload[0].value as number)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={{
                    stroke: 'hsl(var(--muted-foreground))',
                    strokeWidth: 1,
                    strokeDasharray: '4 4'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
