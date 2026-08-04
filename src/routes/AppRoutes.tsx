import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { HomePage } from '../pages/customer/HomePage';
import { CartPage } from '../pages/customer/CartPage';
import { IdentificationPage } from '../pages/auth/IdentificationPage';
import { AddressPage } from '../pages/customer/AddressPage';
import { PaymentPage } from '../pages/customer/PaymentPage';
import { ReviewPage } from '../pages/customer/ReviewPage';
import { SuccessPage } from '../pages/customer/SuccessPage';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { ProductsPage } from '../pages/admin/ProductsPage';
import { CategoriesPage } from '../pages/admin/CategoriesPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { OrdersPage } from '../pages/admin/OrdersPage';
import { RolesPage } from '../pages/admin/RolesPage';
import { CashierPage } from '../pages/admin/CashierPage';
import { DeliveryPage } from '../pages/admin/DeliveryPage';
import { PromotionsPage } from '../pages/admin/PromotionsPage';
import { EmployeesPage } from '../pages/admin/EmployeesPage';
import { CouriersPage } from '../pages/admin/CouriersPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/checkout/endereco" element={<AddressPage />} />
          <Route path="/identificacao" element={<IdentificationPage />} />
          <Route path="/checkout/pagamento" element={<PaymentPage />} />
          <Route path="/checkout/revisao" element={<ReviewPage />} />
          <Route path="/pedido/sucesso" element={<SuccessPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/pedidos" element={<OrdersPage />} />
            <Route path="/admin/caixa" element={<CashierPage />} />
            <Route path="/admin/entregas" element={<DeliveryPage />} />
            <Route path="/admin/produtos" element={<ProductsPage />} />
            <Route path="/admin/adicionais" element={<Navigate to="/admin/produtos" replace />} />
            <Route path="/admin/categorias" element={<CategoriesPage />} />
            <Route path="/admin/promocoes" element={<PromotionsPage />} />
            <Route path="/admin/funcionarios" element={<EmployeesPage />} />
            <Route path="/admin/entregadores" element={<CouriersPage />} />
            <Route path="/admin/cargos" element={<RolesPage />} />
            <Route path="/admin/configuracoes" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
