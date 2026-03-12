import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Car, MapPin, Wallet, Wrench, Share2, Settings, Trash2,
  Plus, X, BarChart2, ChevronRight, Users,
} from 'lucide-react';
import { vehiclesApi, statsApi } from '../services/api';
import PageHeader    from '../components/ui/PageHeader';
import Modal         from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import VehicleForm   from '../components/forms/VehicleForm';
import StatCard      from '../components/ui/StatCard';
import {
  formatKm, formatCurrency, formatDate, FUEL_LABELS,
  EXPENSE_COLORS, EXPENSE_LABELS, MONTH_NAMES,
} from '../utils/formatters';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear]             = useState(currentYear);
  const [showEdit, setShowEdit]     = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare]   = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePerm, setSharePerm]   = useState('view');
  const [shareError, setShareError] = useState('');

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.get(id).then(r => r.data),
  });
  const { data: stats } = useQuery({
    queryKey: ['stats', id, year],
    queryFn: () => statsApi.vehicle(id, year).then(r => r.data),
    enabled: !!id,
  });
  const { data: shares = [] } = useQuery({
    queryKey: ['shares', id],
    queryFn: () => vehiclesApi.getShares(id).then(r => r.data),
    enabled: !!vehicle?.isOwner,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => vehiclesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['vehicle', id]); qc.invalidateQueries(['vehicles']); setShowEdit(false); },
  });
  const deleteMutation = useMutation({
    mutationFn: () => vehiclesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries(['vehicles']); navigate('/vehicles'); },
  });
  const addShareMutation = useMutation({
    mutationFn: () => vehiclesApi.addShare(id, { email: shareEmail, permission: sharePerm }),
    onSuccess: () => { qc.invalidateQueries(['shares', id]); setShareEmail(''); setShareError(''); },
    onError: (err) => setShareError(err.response?.data?.error || 'Erreur'),
  });
  const removeShareMutation = useMutation({
    mutationFn: (shareId) => vehiclesApi.removeShare(id, shareId),
    onSuccess: () => qc.invalidateQueries(['shares', id]),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!vehicle) return <div className="text-center py-20 text-gray-400">Véhicule introuvable</div>;

  const expensesPieData = stats?.expensesByCategory?.filter(e => e.total > 0).map(e => ({
    name: EXPENSE_LABELS[e.category] || e.category,
    value: parseFloat(e.total),
    color: EXPENSE_COLORS[e.category] || '#6b7280',
  })) || [];

  const monthlyData = MONTH_NAMES.map((name, i) => ({
    name,
    dépenses: stats?.monthlyExpenses?.[i]?.total || 0,
    km:       stats?.monthlyKm?.[i]?.total || 0,
  }));

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <PageHeader
        title={`${vehicle.brand} ${vehicle.model}`}
        subtitle={`${vehicle.registration} · ${vehicle.year} · ${FUEL_LABELS[vehicle.fuel_type]}`}
        back="/vehicles"
        actions={
          vehicle.isOwner && (
            <div className="flex items-center gap-2">
              <button className="btn-secondary" onClick={() => setShowShare(true)}>
                <Users className="w-4 h-4" />
                Partager
              </button>
              <button className="btn-secondary" onClick={() => setShowEdit(true)}>
                <Settings className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                onClick={() => setShowDelete(true)}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        }
      />

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: `/vehicles/${id}/trips`,       icon: MapPin,  label: 'Trajets',    color: 'text-blue-600 bg-blue-50' },
          { to: `/vehicles/${id}/expenses`,    icon: Wallet,  label: 'Dépenses',   color: 'text-amber-600 bg-amber-50' },
          { to: `/vehicles/${id}/maintenance`, icon: Wrench,  label: 'Entretien',  color: 'text-green-600 bg-green-50' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to}
            className="card flex flex-col items-center gap-2 py-5 hover:shadow-md transition-shadow cursor-pointer text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-900">{label}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        ))}
      </div>

      {/* Stats KPIs */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Statistiques</h2>
        <select
          value={year}
          onChange={e => setYear(+e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Km parcourus" value={formatKm(stats?.distances?.km_this_year)} icon={MapPin} color="blue" />
        <StatCard label="Dépenses totales" value={formatCurrency(stats?.totals?.total_expenses)} icon={Wallet} color="yellow" />
        <StatCard label="Coût / km" value={stats?.totals?.costPerKm ? `${stats.totals.costPerKm} €/km` : '—'} icon={BarChart2} color="purple" />
        <StatCard label="Conso. moy." value={stats?.totals?.avgConsumption ? `${stats.totals.avgConsumption} L/100` : '—'} icon={Car} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart mensuel */}
        <div className="card">
          <h3 className="font-medium text-gray-900 mb-4">Dépenses mensuelles ({year})</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v.toFixed(2)} €`} />
              <Bar dataKey="dépenses" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart dépenses par catégorie */}
        <div className="card">
          <h3 className="font-medium text-gray-900 mb-4">Dépenses par catégorie ({year})</h3>
          {expensesPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expensesPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {expensesPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${parseFloat(v).toFixed(2)} €`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              Aucune dépense pour {year}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifier le véhicule">
        <VehicleForm defaultValues={vehicle} onSubmit={updateMutation.mutate} loading={updateMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title="Supprimer le véhicule"
        message="Toutes les données (trajets, dépenses, entretiens) seront supprimées."
      />

      <Modal open={showShare} onClose={() => setShowShare(false)} title="Partager le véhicule" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email de l'utilisateur</label>
            <div className="flex gap-2">
              <input
                type="email"
                className="input-base flex-1"
                placeholder="ami@exemple.fr"
                value={shareEmail}
                onChange={e => setShareEmail(e.target.value)}
              />
              <select
                value={sharePerm}
                onChange={e => setSharePerm(e.target.value)}
                className="input-base w-28"
              >
                <option value="view">Lecture</option>
                <option value="edit">Édition</option>
              </select>
            </div>
            {shareError && <p className="text-xs text-red-500 mt-1">{shareError}</p>}
          </div>
          <button className="btn-primary w-full justify-center"
            onClick={() => addShareMutation.mutate()} disabled={!shareEmail || addShareMutation.isPending}>
            <Share2 className="w-4 h-4" />
            Partager
          </button>

          {shares.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Accès actuels</p>
              <div className="space-y-2">
                {shares.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                      <p className="text-xs text-gray-500">{s.email} · {s.permission === 'edit' ? 'Édition' : 'Lecture'}</p>
                    </div>
                    <button onClick={() => removeShareMutation.mutate(s.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
