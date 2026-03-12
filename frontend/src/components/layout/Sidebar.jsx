import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, MapPin, Wallet, Wrench, User, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { to: '/vehicles', icon: Car,             label: 'Mes véhicules' },
  { to: '/profile',  icon: User,            label: 'Profil' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-white border-r border-gray-100 flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Carlog</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-700">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="flex items-center">
          {NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label === 'Tableau de bord' ? 'Dashboard' : label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
