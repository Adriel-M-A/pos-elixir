import { Skeleton } from '@/components/ui/skeleton'

export function ReportsLoading() {
    return (
        <div className="space-y-6">
            {/* Loading Grid de Tarjetas */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-8 w-[150px]" />
                    <Skeleton className="h-3 w-[120px]" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-8 w-[150px]" />
                    <Skeleton className="h-3 w-[120px]" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-8 w-[150px]" />
                    <Skeleton className="h-3 w-[120px]" />
                </div>
            </div>

            {/* Loading Gráfico de tendencia */}
            <Skeleton className="h-[300px] w-full rounded-xl" />

            {/* Loading Grid Inferior */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-80 w-full rounded-xl" />
                <Skeleton className="h-80 w-full rounded-xl" />
            </div>
        </div>
    )
}
