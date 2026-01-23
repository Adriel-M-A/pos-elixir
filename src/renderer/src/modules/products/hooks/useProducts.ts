import { useProductsContext } from '../context/ProductsContext'

function useProducts() {
  return useProductsContext()
}

export default useProducts
