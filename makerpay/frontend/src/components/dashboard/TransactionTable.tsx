'use client';
import { formatAmount, formatDate, statusBadgeClass, statusLabel, providerLabel } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface Payment {
  id: string;
  externalOrderId?: string;
  amount: number;
  currency: string;
  status: string;
  providerName: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  paidAt?: string;
}

interface Props {
  payments: Payment[];
  loading?: boolean;
  showMerchant?: boolean;
  onRowClick?: (payment: Payment) => void;
}

export function TransactionTable({ payments, loading, onRowClick }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!payments?.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-8 h-8 text-gray-300" />
        </div>
        <p className="font-medium text-gray-500">Tranzaksiyalar yo&apos;q</p>
        <p className="text-sm mt-1">Hali hech qanday to&apos;lov amalga oshirilmagan</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID / Buyurtma</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mijoz</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Provayder</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Summa</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sana</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr
              key={p.id}
              className="table-row cursor-pointer"
              onClick={() => onRowClick?.(p)}
            >
              <td className="py-3.5 px-4">
                <div className="font-mono text-xs text-gray-500">{p.id.slice(0, 8)}...</div>
                {p.externalOrderId && (
                  <div className="text-xs text-gray-400 mt-0.5">#{p.externalOrderId}</div>
                )}
              </td>
              <td className="py-3.5 px-4">
                <div className="font-medium text-gray-800">{p.customerName || '—'}</div>
                {p.customerPhone && <div className="text-xs text-gray-400">{p.customerPhone}</div>}
              </td>
              <td className="py-3.5 px-4">
                <span className="badge badge-blue">{providerLabel(p.providerName)}</span>
              </td>
              <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                {formatAmount(p.amount, p.currency)}
              </td>
              <td className="py-3.5 px-4">
                <span className={statusBadgeClass(p.status)}>{statusLabel(p.status)}</span>
              </td>
              <td className="py-3.5 px-4 text-gray-500 text-xs">
                {formatDate(p.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
