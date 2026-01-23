import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { formatCurrency } from '../../../utils/currency'
import type { PaymentMethodSummary } from '@types'

interface PaymentMethodsChartProps {
    data: (PaymentMethodSummary & { name: string })[]
}

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
    const paymentMethodColorPalette = [
        '#059669',
        '#0ea5e9',
        '#f97316',
        '#a855f7',
        '#f43f5e',
        '#14b8a6',
        '#facc15'
    ]

    const chartData = data.map((method, index) => ({
        name: method.name || `Método ${method.paymentMethodId}`,
        value: method.totalFinal,
        color: paymentMethodColorPalette[index % paymentMethodColorPalette.length]
    }))

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-lg">
                    Métodos de Pago
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 min-h-0">
                {chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No hay datos suficientes para graficar.
                    </div>
                ) : (
                    <div className="@container h-full">
                        <div className="flex flex-col @lg:flex-row h-full gap-2 items-center">
                            <div className="h-[160px] @lg:h-full w-full @lg:w-1/2 relative shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="55%"
                                            outerRadius="85%"
                                            paddingAngle={5}
                                            cornerRadius={4}
                                            stroke="none"
                                        >
                                            {chartData.map((entry) => (
                                                <Cell
                                                    key={entry.name}
                                                    fill={entry.color}
                                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatCurrency(value as number)}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-xs font-medium text-muted-foreground opacity-50">Total</span>
                                </div>
                            </div>

                            <div className="flex-1 pr-1 space-y-1 w-full @lg:w-1/2 flex flex-col justify-center">
                                {chartData.map((method) => (
                                    <div
                                        key={method.name}
                                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-3 w-3 rounded-full shadow-sm ring-2 ring-background shrink-0"
                                                style={{ backgroundColor: method.color }}
                                            />
                                            <span className="text-sm font-medium truncate">
                                                {method.name}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-sm font-bold">
                                                {formatCurrency(method.value)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
