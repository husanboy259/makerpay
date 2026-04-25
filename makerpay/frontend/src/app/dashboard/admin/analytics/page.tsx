'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { TrendingUp, CreditCard, CheckCircle, BarChart3, Users } from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_CHART = [
  { date: '14 Apr', amount: 8200000 }, { date: '15 Apr', amount: 11400000 }, { date: '16 Apr', amount: 9800000 },
  { date: '17 Apr', amount: 13200000 }, { date: '18 Apr', amount: 10500000 }, { date: '19 Apr', amount: 15800000 }, { date: '20 Apr', amount: 12400000 },
];
const PROVIDER_DATA = [
  { name: 'TSPay',    volume: 18500000 }, { name: 'Paynest',  volume: 12200000 },
  { name: 'TulovPay', volume: 8100000  }, { name: 'MirPay',   volume: 4800000  }, { name: 'QulayPay', volume: 2900000  },
];
const PERIODS = [{ label: '7 kun', value: 7 }, { label: '30 kun', value: 30 }, { label: '90 kun', value: 90 }];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState(7);
  const { data: statsRaw } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.getStats(), retry: false });
  const { data: chartRaw } = useQuery({ queryKey: ['admin-revenue-chart', period], queryFn: () => adminApi.getRevenueChart(period), retry: false });
  const s = (statsRaw as any)?.data ?? (statsRaw as any);
  const chart = Array.isArray((chartRaw as any)?.data) ? (chartRaw as any).data : Array.isArray(chartRaw) ? chartRaw : MOCK_CHART;
  const totalVol = s?.payments?.totalVolume || 0;
  const totalTx  = s?.payments?.total || 0;
  const successRate = totalTx > 0 ? ((s?.payments?.completed || 0) / totalTx * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analitika</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platforma statistikasi va trendlar</p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {PERIODS.map(p => <button key={p.value} onClick={() => setPeriod(p.value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p.value ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>{p.label}</button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp,  label: 'Jami aylanma',   value: formatAmount(totalVol || 4820500000), clr: 'bg-green-500/20'  },
          { icon: CreditCard,  label: 'Tranzaksiyalar', value: (totalTx || 14820).toLocaleString(),  clr: 'bg-white/10'      },
          { icon: CheckCircle, label: 'Muvaffaqiyat %', value: `${successRate || '97.2'}%`,          clr: 'bg-blue-500/20'   },
          { icon: Users,       label: 'Faol merchantlar', value: s?.merchants?.active || 94,          clr: 'bg-purple-500/20' },
        ].map(({ icon: Icon, label, value, clr }) => (
          <div key={label} className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${clr}`}><Icon className="w-5 h-5 text-white" /></div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-5">Daromad dinamikasi</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chart}>
            <defs><linearGradient id="ga2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} /><stop offset="95%" stopColor="#ffffff" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
            <Tooltip formatter={(v: any) => formatAmount(v)} contentStyle={{ background: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: 12, fontSize: 12, color: '#fff' }} labelStyle={{ color: '#9ca3af' }} />
            <Area type="monotone" dataKey="amount" stroke="#ffffff" strokeWidth={2} fill="url(#ga2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-5">Provayder bo&apos;yicha hajm</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={PROVIDER_DATA} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={65} />
            <Tooltip formatter={(v: any) => formatAmount(v)} contentStyle={{ background: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: 12, fontSize: 12, color: '#fff' }} />
            <Bar dataKey="volume" fill="#ffffff" radius={[0, 4, 4, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
