import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableRow, TableCell } from '@/components/ui/table'
import { useCategories } from '../../categories'
import { useSales } from '../hooks/useSales'
import useProducts from '../../products/hooks/useProducts'
import { formatCurrency } from '../../../utils/currency'
import { DataTable } from '../../../components/DataTable'
import { WeightSelectionDialog } from './WeightSelectionDialog'
import type { Product } from '@types'

export function ProductCatalog() {
  const { categories, loading: categoriesLoading } = useCategories()
  const { products, loading: productsLoading } = useProducts() // Use global context
  const { cart, addItem } = useSales()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // State for weight dialog
  const [weightDialogOpen, setWeightDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'others' && product.categoryId === null) ||
        (product.categoryId === Number(selectedCategory))

      // Solo productos activos
      const isActive = product.isActive

      // Verificar stock si está controlado
      const hasStock = !product.isStockControlled || product.stock > 0

      return matchesSearch && matchesCategory && isActive && hasStock
    })
  }, [products, searchTerm, selectedCategory])

  const getQuantityInCart = (productId: number) => {
    const item = cart.find((i) => i.productId === productId)
    return item ? item.quantity : 0
  }

  const handleProductClick = (product: Product) => {
    if (product.productType === 'WEIGHT') {
      setSelectedProduct(product)
      setWeightDialogOpen(true)
    } else {
      addItem(product)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="pt-5 px-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-lg bg-card"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList
            variant="underline"
            className="w-full justify-start h-auto flex flex-nowrap overflow-x-auto gap-8 bg-transparent p-0 scrollbar-hide"
          >
            <TabsTrigger
              value="all"
              variant="underline"
              className="text-base py-2 shrink-0 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:bg-primary after:transition-transform data-[state=active]:after:scale-x-100"
            >
              Todos
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={String(category.id)}
                variant="underline"
                className="text-base py-2 shrink-0 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:bg-primary after:transition-transform data-[state=active]:after:scale-x-100"
              >
                {category.name}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="others"
              variant="underline"
              className="text-base py-2 shrink-0 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:scale-x-0 after:bg-primary after:transition-transform data-[state=active]:after:scale-x-100"
            >
              Otros
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden p-5">
        <DataTable
          columns={[
            { key: 'name', label: 'Producto' },
            { key: 'category', label: 'Categoría' },
            { key: 'price', label: 'Precio Local' },
            { key: 'price_delivery', label: 'Precio PedidosYa' },
            { key: 'quantity', label: 'Cantidad', className: 'text-center' }
          ]}
          data={filteredProducts}
          loading={productsLoading || categoriesLoading}
          emptyMessage="No se encontraron productos."
          className="h-full border shadow-sm"
        >
          {filteredProducts.map((product) => {
            const category = categories.find((c) => c.id === product.categoryId)
            const qty = getQuantityInCart(product.id)
            const isWeight = product.productType === 'WEIGHT'

            return (
              <TableRow
                key={product.id}
                className="cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors select-none"
                onClick={() => handleProductClick(product)}
              >
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {category ? category.name : 'Otros'}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-lg">
                  {formatCurrency(product.price)} {isWeight ? '/ kg' : ''}
                </TableCell>
                <TableCell className="font-semibold text-lg text-muted-foreground">
                  {product.priceDelivery ? (
                    <>
                      {formatCurrency(product.priceDelivery)} {isWeight ? '/ kg' : ''}
                    </>
                  ) : (
                    <span className="text-sm font-normal">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {qty > 0 ? (
                    <Badge>
                      {isWeight ? `${(qty * 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} g` : qty}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </DataTable>
      </div>

      <WeightSelectionDialog
        open={weightDialogOpen}
        onOpenChange={setWeightDialogOpen}
        productName={selectedProduct?.name || ''}
        productPrice={selectedProduct?.price || 0}
        onConfirm={(weightInGrams) => {
          if (selectedProduct) {
            addItem(selectedProduct, weightInGrams / 1000)
          }
        }}
        initialWeight={selectedProduct && getQuantityInCart(selectedProduct.id) > 0 ? getQuantityInCart(selectedProduct.id) * 1000 : 0}
      />
    </div>
  )
}
