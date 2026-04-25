'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { formatAmount, formatDate, statusBadgeClass, statusLabel, providerLabel } from '@/lib/utils';
import { Search, Filter, X, Download } from 'lucide-react';

export default function TransactionsPage() {
  const [filters, setFilters] = useState({ status: '', providerName: '', search: '', page: 1 });
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentsApi.getAll(filters),
  });

  const payments = (data as any)?.data || [];
  const meta = (data as any)?.meta || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tranzaksiyalar</h1>
          <p className="text-sm text-gray-500 mt-1">Barcha to&apos;lovlar tarixi</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card !p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="ID, mijoz ismi, telefon..."
              className="bg-transparent text-sm outline-none flex-1"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>

          <select
            className="input !w-auto"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">Barcha statuslar</option>
            <option value="completed">Yakunlandi</option>
            <option value="pending">Kutilmoqda</option>
            <option value="processing">Jarayonda</option>
            <option value="failed">Xato</option>
            <option value="refunded">Qaytarildi</option>
            <option value="cancelled">Bekor</option>
          </select>

          <select
            className="input !w-auto"
            value={filters.providerName}
            onChange={(e) => setFilters({ ...filters, providerName: e.target.value, page: 1 })}
          >
            <option value="">Barcha provayderlar</option>
            <option value="tspay">TSPay</option>
            <option value="paynest">Paynest</option>
            <option value="tulovpay">TulovPay</option>
          </select>

          {(filters.status || filters.providerName || filters.search) && (
            <button
              onClick={() => setFilters({ status: '', providerName: '', search: '', page: 1 })}
              className="btn-secondary !py-2 !px-3"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {meta.total || 0} ta tranzaksiya
          </h2>
        </div>
        <div className="p-5">
          <TransactionTable
            payments={payments}
            loading={isLoading}
            onRowClick={setSelectedPayment}
          />
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} / {meta.total}
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary !py-1.5 !px-3 text-xs"
                disabled={meta.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                ← Oldingi
              </button>
              <button
                className="btn-secondary !py-1.5 !px-3 text-xs"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Keyingi →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment detail modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold">To&apos;lov tafsiloti</h3>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['ID', selectedPayment.id],
                ['Buyurtma ID', selectedPayment.externalOrderId || '—'],
                ['Summa', formatAmount(selectedPayment.amount, selectedPayment.currency)],
                ['Status', null],
                ['Provayder', providerLabel(selectedPayment.providerName)],
                ['Mijoz', selectedPayment.customerName || '—'],
                ['Telefon', selectedPayment.customerPhone || '—'],
                ['Email', selectedPayment.customerEmail || '—'],
                ['Sana', formatDate(selectedPayment.createdAt)],
                ['To\'langan', selectedPayment.paidAt ? formatDate(selectedPayment.paidAt) : '—'],
                ['Xato', selectedPayment.errorMessage || '—'],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{label}</span>
                  {label === 'Status' ? (
                    <span className={statusBadgeClass(selectedPayment.status)}>{statusLabel(selectedPayment.status)}</span>
                  ) : (
                    <span className="text-sm font-medium text-gray-900 text-right max-w-xs break-all">{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
