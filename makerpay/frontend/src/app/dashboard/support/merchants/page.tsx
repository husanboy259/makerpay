'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { merchantsApi } from '@/lib/api';
import { Users, Search, Eye, Building2, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const MOCK: any[] = [
  { id: 'm1', companyName: 'TechShop UZ',   status: 'active',    email: 'tech@shop.uz',    phone: '+998901000001', createdAt: '2026-03-10T08:00:00Z', tickets: 2 },
  { id: 'm2', companyName: 'Online Market', status: 'pending',   email: 'info@market.uz',  phone: '+998901000002', createdAt: '2026-04-18T10:00:00Z', tickets: 0 },
  { id: 'm3', companyName: 'Delivery Co',   status: 'active',    email: 'ops@delivery.uz', phone: '+998901000003', createdAt: '2026-02-01T08:00:00Z', tickets: 1 },
  { id: 'm4', companyName: 'Fashion Store', status: 'active',    email: 'hi@fashion.uz',   phone: '+998901000004', createdAt: '2026-01-15T08:00:00Z', tickets: 0 },
  { id: 'm5', companyName: 'FoodChain UZ',  status: 'suspended', email: 'ops@food.uz',     phone: '+998901000005', createdAt: '2025-12-01T08:00:00Z', tickets: 3 },
];
const sCls: Record<string,string> = { active: 'bg-green-500/10 text-green-400 border-green-500/20', pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', suspended: 'bg-red-500/10 text-red-400 border-red-500/20' };
const sLbl: Record<string,string> = { active: 'Faol', pending: 'Kutmoqda', suspended: 'Bloklangan' };

export default function SupportMerchantsPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const { data: raw } = useQuery({ queryKey: ['support-merchants'], queryFn: () => merchantsApi.getAll(), retry: false });
  const merchants: any[] = (raw as any)?.data || (Array.isArray(raw) ? (raw as any[]) : MOCK);
  const filtered = merchants.filter(m => !search || m.companyName?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Merchantlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Merchant profillarini ko&apos;rish va yordam berish</p>
      </div>
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Merchant qidirish..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-white/20" />
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.map(m => (
            <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-gray-400" /></div>
                <div>
                  <div className="text-white font-medium">{m.companyName}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{m.email} · {m.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${sCls[m.status] || 'bg-gray-500/10 text-gray-400'}`}>{sLbl[m.status] || m.status}</span>
                {(m.tickets || 0) > 0 && <span className="inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full"><MessageSquare className="w-3 h-3" />{m.tickets}</span>}
                <button onClick={() => setSelected(m)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"><Eye className="w-3.5 h-3.5 text-gray-300" /></button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Merchant topilmadi</p></div>}
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-base font-bold text-white">{selected.companyName}</h3><button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">&#x2715;</button></div>
            <div className="space-y-3">
              {[['Email', selected.email], ['Telefon', selected.phone], ["Ro'yxat", formatDate(selected.createdAt)]].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between py-2 border-b border-white/5"><span className="text-xs text-gray-500">{l}</span><span className="text-sm text-white">{v}</span></div>
              ))}
            </div>
            <Link href="/dashboard/support/tickets" className="mt-5 w-full py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" /> Ticketlarni ko&apos;rish
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
