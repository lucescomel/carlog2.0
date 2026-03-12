export default function StatCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    yellow: 'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan:   'bg-cyan-50 text-cyan-600',
  };

  return (
    <div className="card flex items-start gap-4">
      {Icon && (
        <div className={`p-2.5 rounded-xl ${colors[color]} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
