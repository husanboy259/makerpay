'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AlertTriangle, Webhook } from 'lucide-react';
import { formatDate, formatAmount, providerLabel } from '@/lib/utils';

const MOCK_ERRORS: any[] = [
  { id: 'e1', merchantId: 'TechShop UZ',  amount: 150000, status: 'failed',  errorMessage: 'Insufficient funds',       providerName: 'tspay',   createdAt: '2026-04-20T08:00:00Z' },
  { id: 'e2', merchantId: 'Delivery Co',  amount: 320000, status: 'failed',  errorMessage: 'Card expired',             providerName: 'paynest', createdAt: '2026-04-19T17:00:00Z' },
  { id: 'e3', merchantId: 'Fashion Store',amount: 75000,  status: 'failed',  errorMessage: 'Provider timeout',         providerName: 'tulovpay',createdAt: '2026-04-19T14:00:00Z' },
  { id: 'e4', merchantId: 'FoodChain UZ', amount: 210000, status: 'failed',  errorMessage: 'Invalid card number',      providerName: 'mirpay',  createdAt: '2026-04-18T12:00:00Z' },
];
const MOCK_WEBHOOK: any[] = [
  { id: 'w1', merchantId: 'TechShop UZ',  url: 'https://techshop.uz/webhook', status: 500, error: 'Connection refused', createdAt: '2026-04-20T09:00:00Z', retries: 3 },
  { id: 'w2', merchantId: 'Delivery Co',  url: 'https://delivery.uz/hook',    status: 404, error: 'Not found',          createdAt: '2026-04-19T16:00:00Z', retries: 5 },
];

export default function AdminErrorsPage() {
  const { data: errRaw }  = useQuery({ queryKey: ['admin-errors'],         queryFn: () => adminApi.getErrors({ limit: 20 }),        retry: false });
  const { data: webhRaw } = useQuery({ queryKey: ['admin-webhook-errors'], queryFn: () => adminApi.getWebhookErrors({ limit: 10 }), retry: false });
  const errors:   any[] = (errRaw  as any)?.data || (Array.isArray(errRaw)  ? (errRaw  as any[]) : MOCK_ERRORS);
  const webhooks: any[] = (webhRaw as any)?.data || (Array.isArray(webhRaw) ? (webhRaw as any[]) : MOCK_WEBHOOK);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Xatolik loglari</h1>
        <p className="text-sm text-gray-500 mt-0.5">Muvaffaqiyatsiz to&apos;lovlar va webhook xatolari</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
          <div><div className="text-2xl font-bold text-white">{errors.length}</div><div className="text-sm text-gray-500">To&apos;lov xatolari</div></div>
        </div>
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center"><Webhook className="w-5 h-5 text-orange-400" /></div>
          <div><div className="text-2xl font-bold text-white">{webhooks.length}</div><div className="text-sm text-gray-500">Webhook xatolari</div></div>
        </div>
      </div>
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-bold text-white">Muvaffaqiyatsiz to&apos;lovlar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10">{['Merchant', 'Provayder', 'Summa', 'Xato', 'Sana'].map(h => <th key={h} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">{h}</th>)}</tr></thead>
            <tbody>
              {errors.map(e => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-white font-medium text-sm">{e.merchantId}</td>
                  <td className="py-3 px-4"><span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{providerLabel(e.providerName)}</span></td>
                  <td className="py-3 px-4 text-white font-semibold">{formatAmount(e.amount)}</td>
                  <td className="py-3 px-4 text-red-400 text-xs">{e.errorMessage}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <Webhook className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-bold text-white">Webhook xatolari</h2>
        </div>
        <div className="divide-y divide-white/5">
          {webhooks.map(w => (
            <div key={w.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="text-white font-medium text-sm">{w.merchantId}</div>
                <div className="text-gray-500 text-xs font-mono mt-0.5">{w.url}</div>
                <div className="text-red-400 text-xs mt-0.5">{w.error}</div>
              </div>
              <div className="text-right">
                <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-mono">HTTP {w.status}</span>
                <div className="text-gray-500 text-xs mt-1">{w.retries} urinish · {formatDate(w.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
