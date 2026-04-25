'use client';
import { useQuery } from '@tanstack/react-query';
import { providersApi } from '@/lib/api';
import { GitBranch, CheckCircle, XCircle, Zap } from 'lucide-react';

const PROVIDERS = [
  { key: 'tspay',    name: 'TSPay',    color: 'from-blue-600 to-blue-400',    desc: 'TSPay payment gateway',               merchants: 24, volume: 18500000 },
  { key: 'paynest',  name: 'Paynest',  color: 'from-purple-600 to-purple-400', desc: 'Paynest processing',                  merchants: 18, volume: 12200000 },
  { key: 'tulovpay', name: 'TulovPay', color: 'from-orange-600 to-orange-400', desc: "O'zbekiston to'lov tizimi",            merchants: 31, volume: 8100000  },
  { key: 'mirpay',   name: 'MirPay',   color: 'from-red-600 to-red-400',       desc: 'MirPay gateway',                      merchants: 12, volume: 4800000  },
  { key: 'qulaypay', name: 'QulayPay', color: 'from-cyan-600 to-cyan-400',     desc: 'Qulay va tez to\'lovlar',             merchants: 9,  volume: 2900000  },
];

export default function ManagerProvidersPage() {
  const { data: raw } = useQuery({ queryKey: ['providers'], queryFn: () => providersApi.getAll(), retry: false });
  const connections: any[] = (raw as any)?.data || (Array.isArray(raw) ? (raw as any[]) : []);

  const stats = PROVIDERS.map(p => ({
    ...p,
    active: connections.filter(c => c.providerName === p.key && c.active).length,
    connected: connections.filter(c => c.providerName === p.key).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Provayderlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">To&apos;lov provayderlari holati va statistikasi</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map(p => (
          <div key={p.key} className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${p.color} rounded-xl flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{p.name[0]}</span>
              </div>
              <div>
                <div className="text-white font-bold">{p.name}</div>
                <div className="text-gray-500 text-xs">{p.desc}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-lg font-bold text-white">{p.merchants}</div>
                <div className="text-xs text-gray-500">Merchantlar</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-lg font-bold text-white">{(p.volume / 1000000).toFixed(1)}M</div>
                <div className="text-xs text-gray-500">Hajm</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-green-400">Faol va ishlamoqda</span>
            </div>
          </div>
        ))}
      </div>
      {connections.length > 0 && (
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10"><h2 className="text-sm font-bold text-white">Ulanishlar</h2></div>
          <div className="divide-y divide-white/5">
            {connections.map(c => {
              const p = PROVIDERS.find(x => x.key === c.providerName);
              return (
                <div key={c.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 bg-gradient-to-br ${p?.color || 'from-gray-600 to-gray-400'} rounded-xl flex items-center justify-center`}><GitBranch className="w-4 h-4 text-white" /></div>
                    <div><div className="text-white font-medium text-sm">{p?.name || c.providerName}</div><div className="text-gray-500 text-xs">{c.merchantId}</div></div>
                  </div>
                  {c.active ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-gray-500" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
