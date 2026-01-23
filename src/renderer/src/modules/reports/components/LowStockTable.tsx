import { TableCell, TableRow } from '@/components/ui/table'
import { DataTable } from '@/components/DataTable'

interface LowStockProduct {
    id: number
    name: string
    stock: number
    minStock: number
    price: number
}

interface LowStockTableProps {
    products: LowStockProduct[]
}

export function LowStockTable({ products }: LowStockTableProps) {
    const columns = [
        { key: 'name', label: 'Producto' },
        { key: 'stock', label: 'Stock Actual', className: 'text-right' },
        { key: 'minStock', label: 'Stock Mínimo', className: 'text-right' }
    ]

    const dummyAction = (
        <div className="flex p-1 invisible" aria-hidden="true">
            <div className="h-7 w-20"></div> {/* Match button height h-7 */}
        </div>
    )

    return (
        <DataTable
            title="Bajo Stock"
            action={dummyAction}
            columns={columns}
            data={products}
            className="h-full border-none shadow-sm"
            emptyMessage="No hay productos con stock bajo."
            renderRow={(product: LowStockProduct) => (
                <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell
                        className={`text-right font-bold ${product.stock <= product.minStock ? 'text-red-600' : 'text-yellow-600'
                            }`}
                    >
                        {product.stock}
                    </TableCell>
                    <TableCell className="text-right">{product.minStock}</TableCell>
                </TableRow>
            )}
        />
    )
}
