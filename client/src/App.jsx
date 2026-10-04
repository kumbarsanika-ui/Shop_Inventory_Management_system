import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppShell from './layouts/AppShell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';

function Guard({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role?.toLowerCase())) return <Navigate to="/products" replace />;
  return children;
}

function ProtectedPage({ children, roles }) {
  return <Guard roles={roles}><AppShell>{children}</AppShell></Guard>;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<ProtectedPage roles={['admin', 'manager']}><DashboardPage /></ProtectedPage>} />
    <Route path="/products" element={<ProtectedPage><ProductsPage /></ProtectedPage>} />
    <Route path="/categories" element={<ProtectedPage><CatalogPage resource="categories" /></ProtectedPage>} />
    <Route path="/suppliers" element={<ProtectedPage><CatalogPage resource="suppliers" /></ProtectedPage>} />
    <Route path="/inventory" element={<ProtectedPage><InventoryPage /></ProtectedPage>} />
    <Route path="/team" element={<ProtectedPage roles={['admin']}><TeamPage /></ProtectedPage>} />
    <Route path="/reports" element={<ProtectedPage roles={['admin', 'manager']}><ReportsPage /></ProtectedPage>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
