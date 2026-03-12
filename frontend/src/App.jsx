import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage     from './pages/auth/LoginPage';
import RegisterPage  from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage  from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import TripsPage        from './pages/TripsPage';
import ExpensesPage     from './pages/ExpensesPage';
import MaintenancePage  from './pages/MaintenancePage';
import ProfilePage      from './pages/ProfilePage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Chargement…</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    {/* Auth */}
    <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

    {/* App (protégée) */}
    <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
      <Route index                           element={<DashboardPage />} />
      <Route path="vehicles"                 element={<VehiclesPage />} />
      <Route path="vehicles/:id"             element={<VehicleDetailPage />} />
      <Route path="vehicles/:vehicleId/trips"       element={<TripsPage />} />
      <Route path="vehicles/:vehicleId/expenses"    element={<ExpensesPage />} />
      <Route path="vehicles/:vehicleId/maintenance" element={<MaintenancePage />} />
      <Route path="profile"                  element={<ProfilePage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
