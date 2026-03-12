import { useLocation, Link } from 'react-router-dom';
import { Bell, Car } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TITLES = {
  '/':            'Tableau de bord',
  '/vehicles':    'Mes véhicules',
  '/profile':     'Mon profil',
};

export default function Topbar() {
  const { pathname } = useLocation();
  const { user }     = useAuth();

  const title = TITLES[pathname] || 'Carlog';

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
          <Car className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900">Carlog</span>
      </div>

      {/* Desktop title */}
      <h1 className="hidden md:block text-lg font-semibold text-gray-900">{title}</h1>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center hover:bg-primary-200 transition-colors"
          title="Mon profil"
        >
          <span className="text-xs font-semibold text-primary-700">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </span>
        </Link>
      </div>
    </header>
  );
}
