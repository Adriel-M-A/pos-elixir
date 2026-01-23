import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import clsx from 'clsx'
import type { ReactNode } from 'react'

interface SummaryMetricCardProps {
  title: string
  value: ReactNode
  icon: LucideIcon
  accentColor?: string
  accentBg?: string
  trendContent?: ReactNode
}

export function SummaryMetricCard({
  title,
  value,
  icon: Icon,
  accentColor = 'text-primary',
  accentBg = 'bg-primary/10',
  trendContent
}: SummaryMetricCardProps) {
  return (
    <Card className="border-muted/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={clsx(
            'h-10 w-10 rounded-xl flex items-center justify-center shadow-inner shadow-black/5',
            accentBg
          )}
        >
          <Icon className={clsx('h-5 w-5', accentColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trendContent && <div className="mt-2">{trendContent}</div>}
      </CardContent>
    </Card>
  )
}
