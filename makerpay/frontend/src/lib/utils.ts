import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: number, currency = 'UZS') {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, fmt = 'dd.MM.yyyy HH:mm') {
  return format(new Date(date), fmt);
}

export function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    completed: 'badge-green',
    active:    'badge-green',
    paid:      'badge-green',
    pending:   'badge-yellow',
    pending_verification: 'badge-yellow',
    processing: 'badge-blue',
    failed:    'badge-red',
    suspended: 'badge-red',
    rejected:  'badge-red',
    cancelled: 'badge-gray',
    inactive:  'badge-gray',
    refunded:  'badge-purple',
  };
  return map[status] || 'badge-gray';
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    completed:            'Yakunlandi',
    active:               'Faol',
    pending:              'Kutilmoqda',
    pending_verification: 'Tasdiq kutmoqda',
    processing:           'Jarayonda',
    failed:               'Xato',
    suspended:            'Bloklangan',
    rejected:             'Rad etilgan',
    cancelled:            'Bekor qilindi',
    inactive:             'Nofaol',
    refunded:             'Qaytarildi',
    error:                'Xato',
    delivered:            'Yuborildi',
  };
  return map[status] || status;
}

export function providerLabel(name: string) {
  const map: Record<string, string> = {
    tspay:    'TSPay',
    paynest:  'Paynest',
    tulovpay: 'TulovPay',
  };
  return map[name] || name;
}

export function providerColor(name: string) {
  const map: Record<string, string> = {
    tspay:    'bg-blue-500',
    paynest:  'bg-purple-500',
    tulovpay: 'bg-green-500',
  };
  return map[name] || 'bg-gray-500';
}

export function roleLabel(role: string) {
  const map: Record<string, string> = {
    admin:   'Administrator',
    manager: 'Menejer',
    support: 'Qo\'llab-quvvatlash',
    user:    'Merchant',
  };
  return map[role] || role;
}
