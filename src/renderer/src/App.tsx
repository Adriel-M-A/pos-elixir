import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/sonner'

import TitleBar from './modules/core/layout/TitleBar'
import AppLayout from './modules/core/layout/AppLayout'
import Configuracion from './modules/core/pages/Configuracion'

import { UIProvider } from './modules/core/context/UIContext'

import Products from './modules/products'
import Categories from './modules/categories'
import Promotions from './modules/promtions'
import Pos from './modules/sales'
import SalesHistory from './modules/sales/pages/SalesHistory'
import Reports from './modules/reports'

import { ProductsProvider } from './modules/products'
import { CategoriesProvider } from './modules/categories'
import { PromotionsProvider } from './modules/promtions'
import { SalesProvider } from './modules/sales/context/SalesContext'
import { ReportsProvider } from './modules/reports/context/ReportsContext'
import { SalesHistoryProvider } from './modules/sales/context/SalesHistoryContext'
import { AuthProvider } from './modules/auth/context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleGuard } from './modules/auth/components/RoleGuard'
import Login from './modules/auth/pages/Login'
import UsersPage from './modules/users/pages/Users'

const RootRoutes = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden relative">
      <TitleBar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/pos" replace />} />
              <Route path="pos" element={<Pos />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/sales" element={<SalesHistory />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/configuracion" element={<Configuracion />} />

              <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>

              <Route
                path="*"
                element={<div className="text-red-500 p-4">Página no encontrada</div>}
              />
            </Route>
          </Route>
        </Routes>
      </div>
    </div>
  )
}

function App(): React.ReactElement {
  return (
    <UIProvider>
      <HashRouter>
        <AuthProvider>
          <ProductsProvider>
            <CategoriesProvider>
              <PromotionsProvider>
                <ReportsProvider>
                  <SalesHistoryProvider>
                    <SalesProvider>
                      <RootRoutes />
                    </SalesProvider>
                  </SalesHistoryProvider>
                </ReportsProvider>
              </PromotionsProvider>
            </CategoriesProvider>
          </ProductsProvider>
        </AuthProvider>
      </HashRouter>
      <Toaster position="bottom-center" />
    </UIProvider>
  )
}

export default App
