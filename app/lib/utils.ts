import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const formatMonthYear = (month: number, year: number) => 
  `${year}-${String(month).padStart(2, '0')}`;

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    INACTIVE: 'bg-gray-100 text-gray-600 border border-gray-200',
    PENDING: 'bg-amber-100 text-amber-700 border border-amber-200',
    PAID: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    PARTIALLY_PAID: 'bg-blue-100 text-blue-700 border border-blue-200',
    SUBMITTED: 'bg-blue-100 text-blue-700 border border-blue-200',
    REJECTED: 'bg-red-100 text-red-700 border border-red-200',
    VACATED: 'bg-gray-100 text-gray-600 border border-gray-200',
    UPCOMING: 'bg-purple-100 text-purple-700 border border-purple-200',
    HOLDING: 'bg-amber-100 text-amber-700 border border-amber-200',
    PARTIALLY_REFUNDED: 'bg-blue-100 text-blue-700 border border-blue-200',
    REFUNDED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    AVAILABLE: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    OCCUPIED: 'bg-red-100 text-red-700 border border-red-200',
    SENT: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    FAILED: 'bg-red-100 text-red-700 border border-red-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200';
}
