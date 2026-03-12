import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({ title, subtitle, back, actions }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(back)}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
