import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Wrench, Trash2, Pencil, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { maintenanceApi, vehiclesApi } from '../services/api';
import PageHeader    from '../components/ui/PageHeader';
import Modal         from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState    from '../components/ui/EmptyState';
import { formatDate, formatCurrency, formatKm, MAINTENANCE_LABELS } from '../utils/formatters';

const TYPES = Object.entries(MAINTENANCE_LABELS);

function MaintenanceForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues || {
      date: new Date().toISOString().split('T')[0],
      type: 'vidange', description: '', mileage: '', cost: '',
      next_date: '', next_mileage: '', garage: '', notes: '',
    }
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
          <input type="date" className="input-base" {...register('date', { required: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
          <select className="input-base" {...register('type', { required: true })}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
        <input className="input-base" placeholder="Ex: Vidange + filtre huile"
          {...register('description', { required: true })} />
        {errors.description && <p className="text-xs text-red-500 mt-1">Requis</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kilométrage</label>
          <input type="number" min="0" className="input-base" {...register('mileage')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Coût (€)</label>
          <input type="number" step="0.01" min="0" className="input-base" {...register('cost')} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Garage / Prestataire</label>
        <input className="input-base" placeholder="Ex: Garage Dupont" {...register('garage')} />
      </div>

      <div className="bg-amber-50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-amber-800">Prochain entretien (optionnel)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-amber-700 mb-1">Date prévisionnelle</label>
            <input type="date" className="input-base" {...register('next_date')} />
          </div>
          <div>
            <label className="block text-xs text-amber-700 mb-1">Kilométrage prévu</label>
            <input type="number" min="0" className="input-base" {...register('next_mileage')} />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
        <textarea className="input-base resize-none" rows={2} {...register('notes')} />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

export default function MaintenancePage() {
  const { vehicleId } = useParams();
  const qc = useQueryClient();
  const [showAdd, setShowAdd]       = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [page, setPage]             = useState(1);

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => vehiclesApi.get(vehicleId).then(r => r.data),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', vehicleId, page],
    queryFn: () => maintenanceApi.list(vehicleId, { page, limit: 20 }).then(r => r.data),
  });

  const invalidate = () => qc.invalidateQueries(['maintenance', vehicleId]);

  const createMutation = useMutation({
    mutationFn: (d) => maintenanceApi.create(vehicleId, d),
    onSuccess: () => { invalidate(); setShowAdd(false); },
  });
  const updateMutation = useMutation({
    mutationFn: (d) => maintenanceApi.update(vehicleId, editItem.id, d),
    onSuccess: () => { invalidate(); setEditItem(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => maintenanceApi.remove(vehicleId, id),
    onSuccess: () => { invalidate(); setDeleteItem(null); },
  });

  const canEdit   = vehicle?.canEdit || vehicle?.isOwner;
  const items     = data?.data || [];
  const alerts    = data?.alerts || [];
  const total     = data?.total || 0;
  const pages     = Math.ceil(total / 20);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <PageHeader
        title="Entretien"
        subtitle={vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.registration}` : ''}
        back={`/vehicles/${vehicleId}`}
        actions={canEdit && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      />

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {MAINTENANCE_LABELS[a.type]} — {a.description}
                </p>
                {a.next_date && (
                  <p className="text-xs text-amber-700 mt-0.5">Prévu le {formatDate(a.next_date)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Wrench} title="Aucun entretien enregistré" description="Commencez l'historique d'entretien de votre véhicule."
          action={canEdit && <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />Ajouter</button>}
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map(m => (
              <div key={m.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge bg-green-50 text-green-700">{MAINTENANCE_LABELS[m.type]}</span>
                        <span className="text-sm font-medium text-gray-900">{m.description}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                        <span>{formatDate(m.date)}</span>
                        {m.mileage    && <span>{formatKm(m.mileage)}</span>}
                        {m.cost       && <span className="font-medium text-gray-700">{formatCurrency(m.cost)}</span>}
                        {m.garage     && <span>{m.garage}</span>}
                      </div>
                      {(m.next_date || m.next_mileage) && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-600">
                          <AlertTriangle className="w-3 h-3" />
                          Prochain : {m.next_date ? formatDate(m.next_date) : ''}
                          {m.next_mileage ? ` · ${formatKm(m.next_mileage)}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setEditItem(m)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteItem(m)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Page {page} / {pages}</span>
              <button className="btn-secondary" onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Ajouter un entretien" maxWidth="max-w-xl">
        <MaintenanceForm onSubmit={createMutation.mutate} loading={createMutation.isPending} />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Modifier l'entretien" maxWidth="max-w-xl">
        {editItem && <MaintenanceForm
          defaultValues={{ ...editItem, date: editItem.date?.split('T')[0], next_date: editItem.next_date?.split('T')[0] || '' }}
          onSubmit={updateMutation.mutate} loading={updateMutation.isPending} />}
      </Modal>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteMutation.mutate(deleteItem?.id)} loading={deleteMutation.isPending}
        title="Supprimer l'entretien" message="Confirmer la suppression de cet entretien ?" />
    </div>
  );
}
