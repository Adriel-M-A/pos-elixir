import { ProductCatalog } from '../components/ProductCatalog'
import { CartSummary } from '../components/CartSummary'

export default function PosPage() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 min-w-0 min-h-0">
        <ProductCatalog />
      </div>
      <div className="flex-none w-90 xl:w-95 min-w-[20rem] border-l bg-card">
        <CartSummary />
      </div>
    </div>
  )
}
