import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Wallet, Trash2, Pencil, ArrowRight, ArrowLeft, Fuel } from 'lucide-react';
import { expensesApi, vehiclesApi } from '../services/api';
import PageHeader    from '../components/ui/PageHeader';
import Modal         from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState    from '../components/ui/EmptyState';
import { formatDate, formatCurrency, EXPENSE_LABELS, EXPENSE_COLORS } from '../utils/formatters';

const CATEGORIES = Object.entries(EXPENSE_LABELS);

function ExpenseForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: defaultValues || {
      date: new Date().toISOString().split('T')[0],
      category: 'carburant', amount: '', mileage_at_expense: '', fuel_liters: '', notes: '',
    }
  });
  const category = watch('category');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
          <input type="date" className="input-base" {...register('date', { required: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie *</label>
          <select className="input-base" {...register('category', { required: true })}>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (€) *</label>
          <input type="number" step="0.01" min="0.01" className="input-base"
            {...register('amount', { required: true, min: 0.01 })} />
          {errors.amount && <p className="text-xs text-red-500 mt-1">Montant invalide</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kilométrage</label>
          <input type="number" min="0" className="input-base" placeholder="Optionnel"
            {...register('mileage_at_expense')} />
        </div>
      </div>

      {category === 'carburant' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Fuel className="inline w-4 h-4 mr-1" />Litres
          </label>
          <input type="number" step="0.001" min="0" className="input-base" placeholder="Ex: 42.5"
            {...register('fuel_liters')} />
        </div>
      )}

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

export default function ExpensesPage() {
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
    queryKey: ['expenses', vehicleId, page],
    queryFn: () => expensesApi.list(vehicleId, { page, limit: 20 }).then(r => r.data),
  });

  const invalidate = () => qc.invalidateQueries(['expenses', vehicleId]);

  const createMutation = useMutation({
    mutationFn: (d) => expensesApi.create(vehicleId, d),
    onSuccess: () => { invalidate(); qc.invalidateQueries(['stats', vehicleId]); setShowAdd(false); },
  });
  const updateMutation = useMutation({
    mutationFn: (d) => expensesApi.update(vehicleId, editItem.id, d),
    onSuccess: () => { invalidate(); qc.invalidateQueries(['stats', vehicleId]); setEditItem(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => expensesApi.remove(vehicleId, id),
    onSuccess: () => { invalidate(); qc.invalidateQueries(['stats', vehicleId]); setDeleteItem(null); },
  });

  const canEdit = vehicle?.canEdit || vehicle?.isOwner;
  const expenses = data?.data || [];
  const total    = data?.total || 0;
  const pages    = Math.ceil(total / 20);

  // Total sur la page actuelle
  const pageTotal = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <PageHeader
        title="Dépenses"
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
      ) : expenses.length === 0 ? (
        <EmptyState icon={Wallet} title="Aucune dépense" description="Commencez à enregistrer vos dépenses."
          action={canEdit && <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />Ajouter une dépense</button>}
        />
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Date','Catégorie','Montant','Kilométrage','Notes',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EXPENSE_COLORS[e.category] }} />
                        {EXPENSE_LABELS[e.category] || e.category}
                        {e.fuel_liters && <span className="text-xs text-gray-400">({e.fuel_liters} L)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{e.mileage_at_expense ? `${e.mileage_at_expense.toLocaleString('fr-FR')} km` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{e.notes || '—'}</td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setEditItem(e)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteItem(e)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-100">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-700">Total affiché</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(pageTotal)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
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

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Ajouter une dépense">
        <ExpenseForm onSubmit={createMutation.mutate} loading={createMutation.isPending} />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Modifier la dépense">
        {editItem && <ExpenseForm defaultValues={{ ...editItem, date: editItem.date?.split('T')[0] }} onSubmit={updateMutation.mutate} loading={updateMutation.isPending} />}
      </Modal>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)}
        onConfirm={() => deleteMutation.mutate(deleteItem?.id)} loading={deleteMutation.isPending}
        title="Supprimer la dépense" message="Confirmer la suppression de cette dépense ?" />
    </div>
  );
}
