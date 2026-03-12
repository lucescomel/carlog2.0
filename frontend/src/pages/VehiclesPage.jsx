import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Car, MapPin, Fuel, Settings, Trash2, Share2, ChevronRight } from 'lucide-react';
import { vehiclesApi } from '../services/api';
import Modal          from '../components/ui/Modal';
import ConfirmDialog  from '../components/ui/ConfirmDialog';
import EmptyState     from '../components/ui/EmptyState';
import VehicleForm    from '../components/forms/VehicleForm';
import PageHeader     from '../components/ui/PageHeader';
import { formatKm, FUEL_LABELS } from '../utils/formatters';

export default function VehiclesPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd]           = useState(false);
  const [editVehicle, setEditVehicle]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => { qc.invalidateQueries(['vehicles']); qc.invalidateQueries(['dashboard']); setShowAdd(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => vehiclesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['vehicles']); setEditVehicle(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: vehiclesApi.remove,
    onSuccess: () => { qc.invalidateQueries(['vehicles']); qc.invalidateQueries(['dashboard']); setDeleteTarget(null); },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <PageHeader
        title="Mes véhicules"
        subtitle={`${vehicles.length} véhicule${vehicles.length !== 1 ? 's' : ''} enregistré${vehicles.length !== 1 ? 's' : ''}`}
        actions={
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Aucun véhicule"
          description="Ajoutez votre premier véhicule pour commencer le suivi."
          action={
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              Ajouter un véhicule
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map(v => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onEdit={() => setEditVehicle(v)}
              onDelete={() => setDeleteTarget(v)}
            />
          ))}
        </div>
      )}

      {/* Modale ajout */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Ajouter un véhicule">
        <VehicleForm
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
        {createMutation.isError && (
          <p className="text-sm text-red-500 mt-2">{createMutation.error?.response?.data?.error}</p>
        )}
      </Modal>

      {/* Modale édition */}
      <Modal open={!!editVehicle} onClose={() => setEditVehicle(null)} title="Modifier le véhicule">
        {editVehicle && (
          <VehicleForm
            defaultValues={editVehicle}
            onSubmit={(data) => updateMutation.mutate({ id: editVehicle.id, data })}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Confirmation suppression */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Supprimer le véhicule"
        message={`Supprimer "${deleteTarget?.brand} ${deleteTarget?.model}" ? Toutes les données associées seront supprimées.`}
      />
    </div>
  );
}

function VehicleCard({ vehicle, onEdit, onDelete }) {
  return (
    <div className="card hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{vehicle.brand} {vehicle.model}</h3>
            <p className="text-xs text-gray-500">{vehicle.registration} · {vehicle.year}</p>
          </div>
        </div>
        {!vehicle.is_owner && (
          <span className="badge bg-blue-50 text-blue-600">
            <Share2 className="w-3 h-3 mr-1" />
            Partagé
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {formatKm(vehicle.mileage)}
        </div>
        <div className="flex items-center gap-1">
          <Fuel className="w-3.5 h-3.5" />
          {FUEL_LABELS[vehicle.fuel_type] || vehicle.fuel_type}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to={`/vehicles/${vehicle.id}`}
          className="btn-primary flex-1 justify-center text-xs"
        >
          Voir le détail
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
        {vehicle.is_owner && (
          <>
            <button
              onClick={onEdit}
              className="btn-secondary px-2.5 py-2"
              title="Modifier"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
