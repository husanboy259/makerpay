'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, paymentsApi } from '@/lib/api';
import { TrendingUp, CreditCard, CheckCircle, BarChart3 } from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const PERIODS = [
  { label: '7 kun', value: 7 },
  { label: '30 kun', value: 30 },
  { label: '90 kun', value: 90 },
];

const TOP_MERCHANTS = [
  { name: 'TechShop UZ',   volume: 4500000, tx: 312, rate: 98.1 },
  { name: 'Online Market',  volume: 3200000, tx: 245, rate: 97.6 },
  { name: 'Delivery Co',    volume: 2100000, tx: 189, rate: 95.2 },
  { name: 'Fashion Store',  volume: 1800000, tx: 156, rate: 99.0 },
  { name: 'FoodChain UZ',   volume: 1200000, tx: 98,  rate: 96.8 },
];

const PROVIDER_DATA = [
  { name: 'TSPay',    merchants: 12, volume: 8500000 },
  { name: 'Paynest',  merchants: 8,  volume: 5200000 },
  { name: 'TulovPay', merchants: 6,  volume: 3100000 },
  { name: 'MirPay',   merchants: 4,  volume: 1800000 },
  { name: 'QulayPay', merchants: 3,  volume: 900000  },
];

export default function ManagerAnalyticsPage() {
  const [period, setPeriod] = useState(7);

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.getStats() });
  const { data: chartData } = useQuery({ queryKey: ['payment-chart', period], queryFn: () => paymentsApi.getChart() });

  const s = stats as any;
  const chart = (chartData as any) || [];

  const totalVol = s?.payments?.totalVolume || 0;
  const totalTx  = s?.payments?.total || 0;
  const successRate = totalTx > 0 ? ((s?.payments?.completed || 0) / totalTx * 100).toFixed(1) : '0';
  const avgTx = totalTx > 0 ? totalVol / totalTx : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analitika</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platforma statistikasi va trendlar</p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p.value ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp,  label: 'Jami aylanma',     value: formatAmount(totalVol), clr: 'bg-green-500/20'  },
          { icon: CreditCard,  label: 'Tranzaksiyalar',   value: totalTx,                clr: 'bg-white/10'      },
          { icon: CheckCircle, label: "Muvaffaqiyat %",   value: `${successRate}%`,      clr: 'bg-blue-500/20'   },
          { icon: BarChart3,   label: "O'rtacha to'lov",  value: formatAmount(avgTx),    clr: 'bg-purple-500/20' },
        ].map(({ icon: Icon, label, value, clr }) => (
          <div key={label} className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${clr}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Area chart */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-5">Daromad dinamikasi</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chart.length ? chart : [{ date: '—', amount: 0 }]}>
            <defs>
              <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ffffff" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: any) => formatAmount(v)}
              contentStyle={{ background: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: 12, fontSize: 12, color: '#fff' }}
              labelStyle={{ color: '#9ca3af' }} />
            <Area type="monotone" dataKey="amount" stroke="#ffffff" strokeWidth={2} fill="url(#ga)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Provider comparison */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-5">Provayder taqqoslash</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={PROVIDER_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={65} />
              <Tooltip formatter={(v: any) => formatAmount(v)}
                contentStyle={{ background: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: 12, fontSize: 12, color: '#fff' }} />
              <Bar dataKey="volume" fill="#ffffff" radius={[0, 4, 4, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top merchants */}
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-white">Top merchantlar</h2>
          </div>
          <div className="divide-y divide-white/5">
            {TOP_MERCHANTS.map((m, i) => (
              <div key={m.name} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-gray-600 w-5">#{i+1}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.tx} tranzaksiya</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{formatAmount(m.volume)}</div>
                  <div className="text-xs text-green-400">{m.rate}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
