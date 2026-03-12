import { useForm } from 'react-hook-form';
import { FUEL_LABELS } from '../../utils/formatters';

const FUEL_TYPES = Object.entries(FUEL_LABELS);

export default function VehicleForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues || {
      brand: '', model: '', registration: '',
      year: new Date().getFullYear(), mileage: 0,
      fuel_type: 'essence', color: '', notes: '',
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Marque *</label>
          <input className="input-base" placeholder="Renault"
            {...register('brand', { required: 'Requis' })} />
          {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Modèle *</label>
          <input className="input-base" placeholder="Clio"
            {...register('model', { required: 'Requis' })} />
          {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Immatriculation *</label>
        <input className="input-base uppercase" placeholder="AB-123-CD"
          {...register('registration', { required: 'Requis' })} />
        {errors.registration && <p className="text-xs text-red-500 mt-1">{errors.registration.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Année *</label>
          <input type="number" className="input-base"
            {...register('year', { required: 'Requis', min: 1900, max: new Date().getFullYear() + 1 })} />
          {errors.year && <p className="text-xs text-red-500 mt-1">Année invalide</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kilométrage *</label>
          <input type="number" className="input-base" min="0"
            {...register('mileage', { required: 'Requis', min: 0 })} />
          {errors.mileage && <p className="text-xs text-red-500 mt-1">{errors.mileage.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Carburant *</label>
          <select className="input-base" {...register('fuel_type', { required: true })}>
            {FUEL_TYPES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur</label>
          <input className="input-base" placeholder="Blanc" {...register('color')} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
        <textarea className="input-base resize-none" rows={3} placeholder="Informations complémentaires…"
          {...register('notes')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
