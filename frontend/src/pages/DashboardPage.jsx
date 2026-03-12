import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Car, MapPin, Wallet, Wrench, TrendingUp, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { statsApi } from '../services/api';
import StatCard  from '../components/ui/StatCard';
import { formatCurrency, formatKm, formatDate, EXPENSE_LABELS, MAINTENANCE_LABELS } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => statsApi.dashboard().then(r => r.data),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {user?.first_name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Voici un résumé de l'activité ce mois-ci</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Véhicules"
          value={data?.vehicle_count ?? 0}
          icon={Car}
          color="blue"
        />
        <StatCard
          label="Km ce mois"
          value={formatKm(data?.month_km)}
          icon={MapPin}
          color="green"
        />
        <StatCard
          label="Dépenses ce mois"
          value={formatCurrency(data?.month_expenses)}
          icon={Wallet}
          color="yellow"
        />
        <StatCard
          label="Alertes entretien"
          value={data?.upcomingMaintenance?.length ?? 0}
          icon={Wrench}
          color={data?.upcomingMaintenance?.length > 0 ? 'red' : 'purple'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières dépenses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Dernières dépenses</h2>
            <Link to="/vehicles" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.recentExpenses?.length > 0 ? (
            <div className="space-y-3">
              {data.recentExpenses.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {EXPENSE_LABELS[e.category] || e.category}
                      </p>
                      <p className="text-xs text-gray-500">{e.brand} {e.model} · {formatDate(e.date)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 ml-2 flex-shrink-0">
                    {formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Aucune dépense enregistrée</p>
          )}
        </div>

        {/* Entretiens à venir */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Entretiens à venir</h2>
          </div>
          {data?.upcomingMaintenance?.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingMaintenance.map(m => (
                <div key={m.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {MAINTENANCE_LABELS[m.type] || m.type}
                    </p>
                    <p className="text-xs text-gray-500">{m.brand} {m.model} · {m.registration}</p>
                    {m.next_date && (
                      <p className="text-xs text-amber-600 font-medium mt-0.5">
                        Prévu le {formatDate(m.next_date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
                <Wrench className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-500">Aucun entretien à venir</p>
              <p className="text-xs text-gray-400 mt-0.5">Tout est à jour ✓</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions si pas de véhicules */}
      {data?.vehicle_count === 0 && (
        <div className="card border-dashed border-2 border-gray-200 bg-gray-50 flex flex-col items-center py-10">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
            <Car className="w-7 h-7 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Ajoutez votre premier véhicule</h3>
          <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">
            Commencez par enregistrer votre voiture pour suivre vos trajets et dépenses.
          </p>
          <Link to="/vehicles" className="btn-primary">
            <Plus className="w-4 h-4" />
            Ajouter un véhicule
          </Link>
        </div>
      )}
    </div>
  );
}
