import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, MapPin, Trash2, Pencil, ArrowRight, ArrowLeft, Briefcase, User } from 'lucide-react';
import { tripsApi, vehiclesApi } from '../services/api';
import PageHeader    from '../components/ui/PageHeader';
import Modal         from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState    from '../components/ui/EmptyState';
import { formatDate, formatKm } from '../utils/formatters';

function TripForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues || {
      date: new Date().toISOString().split('T')[0],
      distance: '', departure: '', arrival: '', trip_type: 'personnel', notes: '',
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Distance (km) *</label>
          <input type="number" step="0.1" min="0.1" className="input-base"
            {...register('distance', { required: true, min: 0.1 })} />
          {errors.distance && <p className="text-xs text-red-500 mt-1">Distance invalide</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Départ</label>
          <input className="input-base" placeholder="Paris" {...register('departure')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Arrivée</label>
          <input className="input-base" placeholder="Lyon" {...register('arrival')} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de trajet</label>
        <div className="flex gap-3">
          {[['personnel','Personnel',User],['professionnel','Professionnel',Briefcase]].map(([v,l,Icon]) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer flex-1">
              <input type="radio" value={v} {...register('trip_type')} className="accent-primary-600" />
              <Icon className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{l}</span>
            </label>
          ))}
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

export default function TripsPage() {
  const { vehicleId } = useParams();
  const qc = useQueryClient();
  const [showAdd, setShowAdd]     = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [page, setPage]           = useState(1);

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => vehiclesApi.get(vehicleId).then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['trips', vehicleId, page],
    queryFn: () => tripsApi.list(vehicleId, { page, limit: 20 }).then(r => r.data),
  });

  const invalidate = () => qc.invalidateQueries(['trips', vehicleId]);

  const createMutation = useMutation({
    mutationFn: (d) => tripsApi.create(vehicleId, d),
    onSuccess: () => { invalidate(); setShowAdd(false); },
  });
  const updateMutation = useMutation({
    mutationFn: (d) => tripsApi.update(vehicleId, editItem.id, d),
    onSuccess: () => { invalidate(); setEditItem(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => tripsApi.remove(vehicleId, id),
    onSuccess: () => { invalidate(); setDeleteItem(null); },
  });

  const canEdit = vehicle?.canEdit || vehicle?.isOwner;
  const trips   = data?.data || [];
  const total   = data?.total || 0;
  const pages   = Math.ceil(total / 20);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <PageHeader
        title="Trajets"
        subtitle={vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.registration}` : ''}
        back={`/vehicles/${vehicleId}`}
        actions={canEdit && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <EmptyState icon={MapPin} title="Aucun trajet" description="Enregistrez votre premier trajet pour commencer le suivi."
          action={canEdit && <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />Ajouter un trajet</button>}
        />
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Date','Trajet','Distance','Type',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trips.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      {t.departure || t.arrival ? (
                        <div className="flex items-center gap-1 text-gray-600">
                          <span>{t.departure || '—'}</span>
                          <ArrowRight className="w-3 h-3 flex-shrink-0" />
                          <span>{t.arrival || '—'}</span>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{formatKm(t.distance)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${t.trip_type === 'professionnel' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {t.trip_type === 'professionnel' ? 'Pro' : 'Perso'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setEditItem(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteItem(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Ajouter un trajet">
        <TripForm onSubmit={createMutation.mutate} loading={createMutation.isPending} />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Modifier le trajet">
        {editItem && <TripForm defaultValues={{ ...editItem, date: editItem.date?.split('T')[0] }} onSubmit={updateMutation.mutate} loading={updateMutation.isPending} />}
      </Modal>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteMutation.mutate(deleteItem?.id)} loading={deleteMutation.isPending}
        title="Supprimer le trajet" message="Confirmer la suppression de ce trajet ?" />
    </div>
  );
}
