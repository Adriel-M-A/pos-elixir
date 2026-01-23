import { useState, useMemo } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { formatCurrency } from '../../../utils/currency'
import { DataTable } from '@/components/DataTable'
import { TopProduct } from '@shared/types/report'
import { Button } from '@/components/ui/button'
import { Package, Scale } from 'lucide-react'

interface TopProductsTableProps {
    products: TopProduct[]
}

export function TopProductsTable({ products }: TopProductsTableProps) {
    const [viewMode, setViewMode] = useState<'UNIT' | 'WEIGHT'>('UNIT')

    const filteredAndSortedProducts = useMemo(() => {
        return products
            .filter((p) => {
                const type = p.productType || 'UNIT'
                return type === viewMode
            })
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, 10)
    }, [products, viewMode])

    const columns = [
        { key: 'productName', label: 'Producto' },
        {
            key: 'totalQuantity',
            label: viewMode === 'WEIGHT' ? 'Peso Total' : 'Unidades Vendidas',
            className: 'text-right'
        },
        { key: 'revenue', label: 'Recaudado', className: 'text-right' }
    ]

    const toggleButtons = (
        <div className="flex bg-muted/50 p-1 rounded-lg border">
            <Button
                variant={viewMode === 'UNIT' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs gap-1.5"
                onClick={() => setViewMode('UNIT')}
                title="Ver por Unidades"
            >
                <Package className="h-3.5 w-3.5" />
                Unidades
            </Button>
            <Button
                variant={viewMode === 'WEIGHT' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs gap-1.5"
                onClick={() => setViewMode('WEIGHT')}
                title="Ver por Peso"
            >
                <Scale className="h-3.5 w-3.5" />
                Peso
            </Button>
        </div>
    )

    return (
        <DataTable
            title="Top 10 Productos"
            action={toggleButtons}
            columns={columns}
            data={filteredAndSortedProducts}
            className="h-full border-none shadow-sm"
            emptyMessage={`No hay productos por ${viewMode === 'UNIT' ? 'unidad' : 'peso'} vendidos.`}
            pageSize={10}
            hidePagination={true}
            renderRow={(product: TopProduct, index) => (
                <TableRow key={product.productId}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${index < 3 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                {index + 1}
                            </span>
                            <span className="truncate max-w-[180px]" title={product.productName}>
                                {product.productName}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                        {viewMode === 'WEIGHT'
                            ? `${product.totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })} kg`
                            : product.totalQuantity}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(product.totalRevenue)}
                    </TableCell>
                </TableRow>
            )}
        />
    )
}
