import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (date, fmt = 'dd/MM/yyyy') => {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, fmt, { locale: fr }) : '—';
};

export const formatDateLong = (date) => formatDate(date, 'dd MMMM yyyy');

export const formatCurrency = (amount, currency = 'EUR') => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (n, decimals = 0) => {
  if (n == null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(n);
};

export const formatKm = (km) => {
  if (km == null) return '—';
  return `${formatNumber(km)} km`;
};

export const FUEL_LABELS = {
  essence:             'Essence',
  diesel:              'Diesel',
  electrique:          'Électrique',
  hybride:             'Hybride',
  hybride_rechargeable:'Hybride rechargeable',
  gpl:                 'GPL',
};

export const EXPENSE_LABELS = {
  carburant:  'Carburant',
  entretien:  'Entretien',
  reparation: 'Réparation',
  assurance:  'Assurance',
  peage:      'Péage',
  parking:    'Parking',
  autre:      'Autre',
};

export const EXPENSE_COLORS = {
  carburant:  '#3b82f6',
  entretien:  '#10b981',
  reparation: '#f59e0b',
  assurance:  '#8b5cf6',
  peage:      '#06b6d4',
  parking:    '#f97316',
  autre:      '#6b7280',
};

export const MAINTENANCE_LABELS = {
  vidange:            'Vidange',
  pneus:              'Pneus',
  controle_technique: 'Contrôle technique',
  freins:             'Freins',
  distribution:       'Distribution',
  batterie:           'Batterie',
  filtres:            'Filtres',
  autre:              'Autre',
};

export const MONTH_NAMES = [
  'Jan','Fév','Mar','Avr','Mai','Juin',
  'Juil','Août','Sep','Oct','Nov','Déc',
];
