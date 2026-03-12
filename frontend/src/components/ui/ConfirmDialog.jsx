import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
        </div>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3 w-full">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button
            className={`flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'En cours…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
