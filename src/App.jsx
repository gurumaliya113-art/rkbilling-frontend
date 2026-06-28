import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import BelowCostSales from './pages/BelowCostSales';
import AuditLogs from './pages/AuditLogs';
import LiveOwnerPanel from './pages/LiveOwnerPanel';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function Protected({ children, roles }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="products" element={<Products />} />
        <Route
          path="inventory"
          element={
            <Protected roles={['admin', 'manager']}>
              <Inventory />
            </Protected>
          }
        />
        <Route path="invoices" element={<Invoices />} />
        <Route path="customers" element={<Customers />} />
        <Route path="analytics" element={<Analytics />} />
        <Route
          path="reports"
          element={
            <Protected roles={['admin', 'manager']}>
              <Reports />
            </Protected>
          }
        />
        <Route
          path="below-cost"
          element={
            <Protected roles={['admin', 'manager']}>
              <BelowCostSales />
            </Protected>
          }
        />
        <Route
          path="audit"
          element={
            <Protected roles={['admin', 'manager']}>
              <AuditLogs />
            </Protected>
          }
        />
        <Route
          path="live"
          element={
            <Protected roles={['admin', 'manager']}>
              <LiveOwnerPanel />
            </Protected>
          }
        />
        <Route
          path="settings"
          element={
            <Protected roles={['admin', 'manager']}>
              <Settings />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
