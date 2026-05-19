import { User } from './types';

export const USERS: User[] = [
  { id: 'admin1', username: 'LeadPilot Admin', email: 'leadpilot25@gmail.com', role: 'admin' },
  { id: 'client1', username: 'LeadPilot Admin1', email: 'leadpilot26.client@gmail.com', role: 'agent' }
];

export const COLORS = {
  primary: '#10B981', // Emerald
  done: '#6B6A5E',    // Olive
  bg: '#F3F4F6',      // Light gray (bg-gray-100)
  card: '#FFFFFF',
};

export const STATUS_COLORS = {
  TODAY: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/70',
    accent: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  OVERDUE: {
    border: 'border-rose-200',
    bg: 'bg-rose-50/70',
    accent: 'bg-rose-500',
    text: 'text-rose-700',
  },
  UPCOMING: {
    border: 'border-blue-200',
    bg: 'bg-blue-50/70',
    accent: 'bg-blue-500',
    text: 'text-blue-700',
  },
  DONE: {
    border: 'border-slate-200',
    bg: 'bg-slate-50/40',
    accent: 'bg-slate-400',
    text: 'text-slate-600',
  }
};

export const LEAD_SOURCES = [
  'Facebook',
  'Instagram',
  'Website',
  'Referral',
  'Walk-in',
  'Other'
];

export const PROPERTY_TYPES = [
  'Apartment',
  'Villa',
  'Plot/Land',
  'Commercial',
  'Rental',
  'Other'
];

export const PROPERTIES = [
  'Emerald Villas',
  'Sapphire Heights',
  'Ruby Gardens',
  'Diamond Plaza',
  'Ocean View Residency',
  'Urban Loft 101'
];
