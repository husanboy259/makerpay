'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantsApi } from '@/lib/api';
import { Users, CheckCircle, XCircle, Clock, Search, Eye, Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const MOCK: any[] = [
  { id: 'm1', businessName: 'TechShop UZ',   status: 'active',                contactEmail: 'tech@shop.uz',    contactPhone: '+998901000001', createdAt: '2026-03-10T08:00:00Z', totalVolume: 4500000, totalTransactions: 312 },
  { id: 'm2', businessName: 'Online Market', status: 'pending_verification',   contactEmail: 'info@market.uz',  contactPhone: '+998901000002', createdAt: '2026-04-18T10:00:00Z', totalVolume: 0,       totalTransactions: 0   },
  { id: 'm3', businessName: 'Delivery Co',   status: 'active',                contactEmail: 'ops@delivery.uz', contactPhone: '+998901000003', createdAt: '2026-02-01T08:00:00Z', totalVolume: 2100000, totalTransactions: 189 },
  { id: 'm4', businessName: 'Fashion Store', status: 'active',                contactEmail: 'hi@fashion.uz',   contactPhone: '+998901000004', createdAt: '2026-01-15T08:00:00Z', totalVolume: 1800000, totalTransactions: 156 },
  { id: 'm5', businessName: 'FoodChain UZ',  status: 'suspended',             contactEmail: 'ops@food.uz',     contactPhone: '+998901000005', createdAt: '2025-12-01T08:00:00Z', totalVolume: 300000,  totalTransactions: 45  },
  { id: 'm6', businessName: 'GameStore UZ',  status: 'pending_verification',   contactEmail: 'gs@game.uz',      contactPhone: '+998901000006', createdAt: '2026-04-19T14:00:00Z', totalVolume: 0,       totalTransactions: 0   },
];

const sCls: Record<string,string> = {
  active:               'bg-green-500/10 text-green-400 border-green-500/20',
  pending_verification: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  suspended:            'bg-red-500/10 text-red-400 border-red-500/20',
  inactive:             'bg-gray-500/10 text-gray-400 border-gray-500/20',
  rejected:             'bg-red-500/10 text-red-400 border-red-500/20',
};
const sLbl: Record<string,string> = {
  active:               'Faol',
  pending_verification: 'Kutmoqda',
  suspended:            'Bloklangan',
  inactive:             'Nofaol',
  rejected:             'Rad etildi',
};

function StatusBadge({ s }: { s: string }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${sCls[s] || 'bg-gray-500/10 text-gray-400'}`}>{sLbl[s] || s}</span>;
}

export default function AdminMerchantsPage() {
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const qc = useQueryClient();

  const { data: raw } = useQuery({ queryKey: ['admin-merchants'], queryFn: () => merchantsApi.getAll(), retry: false });
  const merchants: any[] = (raw as any)?.data || (Array.isArray(raw) ? (raw as any[]) : MOCK);
  const approve = useMutation({ mutationFn: (id: string) => merchantsApi.approve(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-merchants'] }) });
  const suspend = useMutation({ mutationFn: (id: string) => merchantsApi.suspend(id, 'Admin tomonidan bloklandi'), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-merchants'] }) });

  const filtered = merchants.filter(m => {
    if (tab && m.status !== tab) return false;
    if (search && !m.businessName?.toLowerCase().includes(search.toLowerCase()) && !m.contactEmail?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const counts = { all: merchants.length, active: merchants.filter(m => m.status === 'active').length, pending: merchants.filter(m => m.status === 'pending_verification').length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Merchantlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Barcha merchant kompaniyalar</p>
        </div>
        <div className="flex items-center gap-3">
          {[{ icon: Users, label: 'Jami', val: counts.all, c: 'text-white' }, { icon: CheckCircle, label: 'Faol', val: counts.active, c: 'text-green-400' }, { icon: Clock, label: 'Kutmoqda', val: counts.pending, c: 'text-yellow-400' }].map(({ icon: Icon, label, val, c }) => (
            <div key={label} className="bg-[#111] border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <Icon className={`w-4 h-4 ${c}`} />
              <span className="text-white font-bold text-sm">{val}</span>
              <span className="text-gray-500 text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {[{ label: 'Barchasi', value: '' }, { label: 'Faol', value: 'active' }, { label: 'Kutmoqda', value: 'pending_verification' }, { label: 'Bloklangan', value: 'suspended' }].map(t => (
              <button key={t.value} onClick={() => setTab(t.value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t.value ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>{t.label}</button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-white/20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Kompaniya', 'Email / Telefon', 'Status', 'Hajm', 'Sana', 'Amal'].map(h => <th key={h} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center"><Building2 className="w-4 h-4 text-gray-400" /></div>
                      <span className="text-white font-medium">{m.businessName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-300 text-xs">{m.contactEmail}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{m.contactPhone}</div>
                  </td>
                  <td className="py-3 px-4"><StatusBadge s={m.status} /></td>
                  <td className="py-3 px-4">
                    <div className="text-white text-xs font-semibold">{(m.totalVolume || 0).toLocaleString()} so&apos;m</div>
                    <div className="text-gray-500 text-xs">{m.totalTransactions || 0} tx</div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{formatDate(m.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelected(m)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"><Eye className="w-3.5 h-3.5 text-gray-300" /></button>
                      {m.status === 'pending_verification' && <button onClick={() => approve.mutate(m.id)} className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors"><CheckCircle className="w-3.5 h-3.5 text-green-400" /></button>}
                      {m.status === 'active' && <button onClick={() => suspend.mutate(m.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"><XCircle className="w-3.5 h-3.5 text-red-400" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-600"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Merchant topilmadi</p></div>}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">{selected.businessName}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">&#x2715;</button>
            </div>
            <div className="space-y-3">
              {[['Email', selected.contactEmail], ['Telefon', selected.contactPhone], ['Sana', formatDate(selected.createdAt)]].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-xs text-gray-500">{l}</span>
                  <span className="text-sm text-white">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              {selected.status === 'pending_verification' && <button onClick={() => { approve.mutate(selected.id); setSelected(null); }} className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Tasdiqlash</button>}
              {selected.status === 'active' && <button onClick={() => { suspend.mutate(selected.id); setSelected(null); }} className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"><XCircle className="w-4 h-4" /> Bloklash</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
