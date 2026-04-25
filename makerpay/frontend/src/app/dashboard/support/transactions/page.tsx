'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { CreditCard, Search, AlertTriangle } from 'lucide-react';
import { formatDate, formatAmount, statusLabel, providerLabel } from '@/lib/utils';

const MOCK: any[] = [
  { id: 'pay_001', externalOrderId: 'ORD-1001', amount: 150000, currency: 'UZS', status: 'completed', providerName: 'tspay',    merchantId: 'TechShop UZ',  customerName: 'Ali Valiyev',  createdAt: '2026-04-20T10:00:00Z' },
  { id: 'pay_002', externalOrderId: 'ORD-1002', amount: 320000, currency: 'UZS', status: 'pending',   providerName: 'paynest',  merchantId: 'Online Market',customerName: 'Sardor R.',    createdAt: '2026-04-20T09:30:00Z' },
  { id: 'pay_003', externalOrderId: 'ORD-1003', amount: 75000,  currency: 'UZS', status: 'failed',    providerName: 'tulovpay', merchantId: 'Delivery Co',  customerName: 'Bobur T.',     createdAt: '2026-04-20T09:00:00Z' },
  { id: 'pay_004', externalOrderId: 'ORD-1004', amount: 500000, currency: 'UZS', status: 'completed', providerName: 'mirpay',   merchantId: 'Fashion Store',customerName: 'Jasur K.',     createdAt: '2026-04-20T08:30:00Z' },
  { id: 'pay_005', externalOrderId: 'ORD-1005', amount: 210000, currency: 'UZS', status: 'failed',    providerName: 'qulaypay', merchantId: 'FoodChain UZ', customerName: 'Dilnoza Y.',   createdAt: '2026-04-20T08:00:00Z', errorMessage: 'Card declined' },
];

const sCls = (s: string) => s === 'completed' ? 'bg-green-500/10 text-green-400' : s === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400';

export default function SupportTransactionsPage() {
  const [status, setStatus] = useState('failed');
  const [search, setSearch] = useState('');

  const { data: raw } = useQuery({ queryKey: ['support-payments', status], queryFn: () => adminApi.getPayments({ status: status || undefined, limit: 50 }), retry: false });
  const payments: any[] = (raw as any)?.data || (Array.isArray(raw) ? (raw as any[]) : MOCK);
  const filtered = payments.filter(p => (!status || p.status === status) && (!search || p.externalOrderId?.includes(search) || p.customerName?.toLowerCase().includes(search.toLowerCase()) || p.merchantId?.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Xato to&apos;lovlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Muammoli tranzaksiyalar va mijoz shikoyatlari</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Jami xatolar", value: payments.filter(p => p.status === 'failed').length, c: 'text-red-400' }, { label: 'Kutmoqda', value: payments.filter(p => p.status === 'pending').length, c: 'text-yellow-400' }, { label: 'Muvaffaqiyatli', value: payments.filter(p => p.status === 'completed').length, c: 'text-green-400' }].map(({ label, value, c }) => (
          <div key={label} className="bg-[#111] border border-white/10 rounded-2xl p-4">
            <div className={`text-2xl font-bold ${c}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 flex-wrap">
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {[{ label: 'Barchasi', value: '' }, { label: 'Xato', value: 'failed' }, { label: 'Kutmoqda', value: 'pending' }, { label: 'Muvaffaqiyatli', value: 'completed' }].map(o => (
              <button key={o.value} onClick={() => setStatus(o.value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${status === o.value ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>{o.label}</button>
            ))}
          </div>
          <div className="flex-1 min-w-40 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-white/20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10">{['Buyurtma', 'Merchant', 'Mijoz', 'Provayder', 'Summa', 'Status', 'Xato', 'Sana'].map(h => <th key={h} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-gray-400 text-xs font-mono">#{p.externalOrderId}</td>
                  <td className="py-3 px-4 text-white text-xs">{p.merchantId}</td>
                  <td className="py-3 px-4 text-gray-300 text-xs">{p.customerName}</td>
                  <td className="py-3 px-4"><span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{providerLabel(p.providerName)}</span></td>
                  <td className="py-3 px-4 text-white font-semibold">{formatAmount(p.amount, p.currency)}</td>
                  <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sCls(p.status)}`}>{statusLabel(p.status)}</span></td>
                  <td className="py-3 px-4">{p.errorMessage ? <div className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400 shrink-0" /><span className="text-xs text-red-400">{p.errorMessage}</span></div> : <span className="text-gray-600 text-xs">—</span>}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-600"><CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Tranzaksiya topilmadi</p></div>}
        </div>
      </div>
    </div>
  );
}
