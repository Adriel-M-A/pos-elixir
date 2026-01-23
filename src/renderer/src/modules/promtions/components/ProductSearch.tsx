import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Product } from '@types'

interface ProductSearchProps {
  products: Product[]
  selectedProductId?: string
  onSelectProduct: (productId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ProductSearch({
  products,
  selectedProductId,
  onSelectProduct,
  placeholder = 'Buscar producto...',
  disabled = false
}: ProductSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter active products first (memoized)
  const activeProducts = useMemo(() => {
    return products.filter((p) => {
      const isActive = Number(p.isActive) === 1 || p.isActive === true
      return isActive
    })
  }, [products])

  // Then filter by search term (for the list)
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return activeProducts
    const lowerSearch = searchTerm.toLowerCase()
    return activeProducts.filter((p) => p.name.toLowerCase().includes(lowerSearch))
  }, [activeProducts, searchTerm])

  const selectedProduct = products.find((p) => p.id.toString() === selectedProductId?.toString())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedProduct ? (
            <span className={cn('truncate', !selectedProduct.isActive && 'text-destructive')}>
              {selectedProduct.name}
              {!selectedProduct.isActive && ' (Inactivo)'}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* 
        We use shouldFilter={false} on Command because we handle filtering manually 
      */}
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar producto..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <CommandEmpty>No se encontraron productos.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredProducts.map((product) => {
                  const isSelected = selectedProductId?.toString() === product.id.toString()
                  return (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={() => {
                        onSelectProduct(product.id.toString())
                        setOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                      <span className="truncate">{product.name}</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        ${Number(product.price).toFixed(2)}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
