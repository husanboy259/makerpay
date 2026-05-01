'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { formatAmount, formatDate, statusBadgeClass, statusLabel, providerLabel } from '@/lib/utils';
import { Search, X, Download, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

/* ── Export helpers ──────────────────────────────────── */
function exportCSV(payments: any[]) {
  const headers = ['ID', 'Buyurtma ID', 'Summa', 'Valyuta', 'Status', 'Provayder', 'Mijoz', 'Telefon', 'Email', 'Sana'];
  const rows = payments.map(p => [
    p.id, p.externalOrderId || '', p.amount, p.currency || 'UZS',
    p.status, p.providerName, p.customerName || '', p.customerPhone || '',
    p.customerEmail || '', formatDate(p.createdAt),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `tranzaksiyalar-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(payments: any[]) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.text('Tranzaksiyalar hisoboti', 14, 15);
  doc.setFontSize(10);
  doc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}   Jami: ${payments.length} ta`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [['ID', 'Buyurtma ID', 'Summa', 'Status', 'Provayder', 'Mijoz', 'Sana']],
    body: payments.map(p => [
      p.id.slice(0, 8) + '...',
      p.externalOrderId || '—',
      formatAmount(p.amount, p.currency),
      p.status,
      p.providerName,
      p.customerName || '—',
      formatDate(p.createdAt),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [20, 20, 20], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`tranzaksiyalar-${Date.now()}.pdf`);
}

/* ── Status badge ────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  completed:  'bg-green-500/10 text-green-400 border border-green-500/20',
  pending:    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  failed:     'bg-red-500/10 text-red-400 border border-red-500/20',
  cancelled:  'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  refunded:   'bg-purple-500/10 text-purple-400 border border-purple-500/20',
};

export default function TransactionsPage() {
  const [filters, setFilters] = useState({ status: '', providerName: '', search: '', page: 1 });
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentsApi.getAll(filters),
  });

  // Fetch all for export (no pagination)
  const handleExport = async (type: 'csv' | 'pdf') => {
    setExporting(type);
    try {
      const res: any = await paymentsApi.getAll({ ...filters, limit: 1000, page: 1 });
      const all = res?.data || [];
      if (type === 'csv') exportCSV(all);
      else await exportPDF(all);
    } finally {
      setExporting(null);
    }
  };

  const payments = (data as any)?.data || [];
  const meta     = (data as any)?.meta || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tranzaksiyalar</h1>
          <p className="text-sm text-gray-500 mt-1">Barcha to&apos;lovlar tarixi</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('csv')} disabled={!!exporting}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50">
            {exporting === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            CSV
          </button>
          <button onClick={() => handleExport('pdf')} disabled={!!exporting}
            className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50">
            {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            PDF yuklab olish
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input placeholder="ID, mijoz ismi..."
              className="bg-transparent text-sm outline-none flex-1 text-white placeholder-gray-600"
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })} />
          </div>
          <select
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
            <option value="">Barcha statuslar</option>
            <option value="completed">Yakunlandi</option>
            <option value="pending">Kutilmoqda</option>
            <option value="processing">Jarayonda</option>
            <option value="failed">Xato</option>
            <option value="refunded">Qaytarildi</option>
            <option value="cancelled">Bekor</option>
          </select>
          <select
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
            value={filters.providerName}
            onChange={e => setFilters({ ...filters, providerName: e.target.value, page: 1 })}>
            <option value="">Barcha provayderlar</option>
            <option value="tspay">TSPay</option>
            <option value="qulaypay">QulayPay</option>
            <option value="mirpay">MirPay</option>
            <option value="paynest">Paynest</option>
          </select>
          {(filters.status || filters.providerName || filters.search) && (
            <button onClick={() => setFilters({ status: '', providerName: '', search: '', page: 1 })}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">{meta.total || 0} ta tranzaksiya</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['ID', 'Buyurtma ID', 'Summa', 'Status', 'Provayder', 'Mijoz', 'Sana'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" />
                </td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-600 text-sm">Tranzaksiya topilmadi</td></tr>
              ) : payments.map((p: any) => (
                <tr key={p.id} onClick={() => setSelectedPayment(p)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{p.id.slice(0,8)}…</td>
                  <td className="px-5 py-3.5 text-gray-300 text-xs">{p.externalOrderId || '—'}</td>
                  <td className="px-5 py-3.5 font-semibold text-white">{formatAmount(p.amount, p.currency)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status] || 'bg-gray-500/10 text-gray-400'}`}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs capitalize">{p.providerName}</td>
                  <td className="px-5 py-3.5 text-gray-300">{p.customerName || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} / {meta.total}
            </p>
            <div className="flex gap-2">
              <button disabled={meta.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-xs text-gray-400">{meta.page} / {meta.totalPages}</span>
              <button disabled={meta.page >= meta.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment detail modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h3 className="text-base font-bold text-white">To&apos;lov tafsiloti</h3>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-0">
              {[
                ['ID',          selectedPayment.id],
                ['Buyurtma ID', selectedPayment.externalOrderId || '—'],
                ['Summa',       formatAmount(selectedPayment.amount, selectedPayment.currency)],
                ['Status',      '__status__'],
                ['Provayder',   selectedPayment.providerName],
                ['Mijoz',       selectedPayment.customerName || '—'],
                ['Telefon',     selectedPayment.customerPhone || '—'],
                ['Email',       selectedPayment.customerEmail || '—'],
                ['Sana',        formatDate(selectedPayment.createdAt)],
                ["To'langan",   selectedPayment.paidAt ? formatDate(selectedPayment.paidAt) : '—'],
                ['Xato',        selectedPayment.errorMessage || '—'],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  {value === '__status__' ? (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[selectedPayment.status] || ''}`}>
                      {statusLabel(selectedPayment.status)}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-white text-right max-w-xs break-all">{value}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end">
              <button
                onClick={async () => {
                  const { default: jsPDF } = await import('jspdf');
                  const doc = new jsPDF();
                  doc.setFontSize(14); doc.text("To'lov tafsiloti", 14, 15);
                  doc.setFontSize(10);
                  const lines = [
                    ['ID', selectedPayment.id],
                    ['Buyurtma ID', selectedPayment.externalOrderId || '—'],
                    ['Summa', formatAmount(selectedPayment.amount, selectedPayment.currency)],
                    ['Status', selectedPayment.status],
                    ['Provayder', selectedPayment.providerName],
                    ['Mijoz', selectedPayment.customerName || '—'],
                    ['Telefon', selectedPayment.customerPhone || '—'],
                    ['Email', selectedPayment.customerEmail || '—'],
                    ['Sana', formatDate(selectedPayment.createdAt)],
                  ];
                  lines.forEach(([k, v], i) => {
                    doc.text(`${k}:`, 14, 30 + i * 10);
                    doc.text(String(v), 60, 30 + i * 10);
                  });
                  doc.save(`payment-${selectedPayment.id.slice(0,8)}.pdf`);
                }}
                className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all">
                <FileText className="w-4 h-4" /> PDF yuklab olish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
