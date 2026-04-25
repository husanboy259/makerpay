'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi, paymentsApi } from '@/lib/api';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { Users, CreditCard, TrendingUp, ArrowRight, Building2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/store/auth.store';

const TOP_MERCHANTS = [
  { name: 'TechShop UZ',   volume: 4500000, tx: 312 },
  { name: 'Online Market',  volume: 3200000, tx: 245 },
  { name: 'Delivery Co',    volume: 2100000, tx: 189 },
  { name: 'Fashion Store',  volume: 1800000, tx: 156 },
];

export default function ManagerDashboard() {
  const { user } = useAuthStore();
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.getStats() });
  const { data: paymentsData } = useQuery({ queryKey: ['manager-payments'], queryFn: () => adminApi.getPayments({ limit: 8 }) });
  const { data: chartData } = useQuery({ queryKey: ['payment-chart'], queryFn: () => paymentsApi.getChart() });

  const s = stats as any;
  const payments = (paymentsData as any)?.data || [];
  const chart = (chartData as any) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Menejer paneli</h1>
          <p className="text-sm text-gray-500 mt-0.5">Xush kelibsiz, {user?.fullName?.split(' ')[0]}</p>
        </div>
        <Link href="/dashboard/manager/analytics"
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-400 text-sm font-medium px-4 py-2 rounded-xl hover:text-white hover:border-white/20 transition-all">
          <TrendingUp className="w-4 h-4" /> Analitika
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: Building2,  label: 'Merchantlar',      value: s?.merchants?.total || 0,                    sub: `${s?.merchants?.active || 0} faol`,           clr: 'bg-blue-500/20' },
          { icon: Clock,      label: 'Kutmoqda',         value: s?.merchants?.pending || 0,                  sub: 'Tasdiqlash kerak',                             clr: 'bg-yellow-500/20' },
          { icon: CreditCard, label: 'Tranzaksiyalar',   value: s?.payments?.total || 0,                     sub: `${s?.payments?.completed || 0} muvaffaqiyatli`, clr: 'bg-white/10' },
          { icon: TrendingUp, label: 'Jami aylanma',     value: formatAmount(s?.payments?.totalVolume || 0), sub: `Bugun: ${formatAmount(s?.today?.volume || 0)}`, clr: 'bg-green-500/20' },
        ].map(({ icon: Icon, label, value, sub, clr }) => (
          <div key={label} className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${clr}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-[#111] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">Daromad grafigi</h2>
            <Link href="/dashboard/manager/analytics" className="text-gray-500 text-xs hover:text-white flex items-center gap-1 transition-colors">
              Batafsil <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart.length ? chart : [{ date: '—', amount: 0 }]}>
              <defs>
                <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="amount" stroke="#ffffff" strokeWidth={2} fill="url(#mg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pending approval */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">Tasdiqlash kutmoqda</h2>
            <Link href="/dashboard/manager/merchants" className="text-gray-500 text-xs hover:text-white flex items-center gap-1 transition-colors">
              Barchasi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {s?.merchants?.pending === 0 || !s ? (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Kutayotgan merchant yo&apos;q</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-5xl font-black text-yellow-400 mb-2">{s.merchants.pending}</div>
              <div className="text-sm text-gray-500 mb-5">merchant tasdiqlanishi kutmoqda</div>
              <Link href="/dashboard/manager/merchants"
                className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-all">
                Ko&apos;rish <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Top merchants */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top merchantlar</div>
            <div className="space-y-2.5">
              {TOP_MERCHANTS.map((m, i) => (
                <div key={m.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-600 w-4">#{i+1}</span>
                    <span className="text-xs text-gray-300">{m.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-white">{formatAmount(m.volume)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">So&apos;nggi tranzaksiyalar</h2>
          <Link href="/dashboard/manager/transactions" className="text-gray-500 text-xs hover:text-white flex items-center gap-1 transition-colors">
            Barchasi <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <TransactionTable payments={payments} showMerchant />
      </div>
    </div>
  );
}
