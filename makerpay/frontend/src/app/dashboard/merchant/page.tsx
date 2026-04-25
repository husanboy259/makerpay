'use client';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi, providersApi } from '@/lib/api';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import {
  CreditCard, TrendingUp, Clock, XCircle, GitBranch,
  ArrowRight, CheckCircle, Store,
} from 'lucide-react';
import { formatAmount, statusBadgeClass, statusLabel, providerLabel } from '@/lib/utils';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuthStore } from '@/store/auth.store';

function DarkStatsCard({ title, value, subtitle, icon: Icon, trend }: any) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-500/10 text-green-400">
            <TrendingUp className="w-3 h-3" />
            {trend.value}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm font-medium text-gray-500 mt-0.5">{title}</div>
      {subtitle && <div className="text-xs text-gray-600 mt-1">{subtitle}</div>}
    </div>
  );
}

export default function MerchantDashboard() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () => paymentsApi.getStats(),
  });

  const { data: chartData } = useQuery({
    queryKey: ['payment-chart'],
    queryFn: () => paymentsApi.getChart(),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['payments', { limit: 10 }],
    queryFn: () => paymentsApi.getAll({ limit: 10, page: 1 }),
  });

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => providersApi.getAll(),
  });

  const s = stats as any;
  const chart = (chartData as any) || [];
  const payments = (paymentsData as any)?.data || [];
  const providerList = (providers as any) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Xush kelibsiz, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Bugungi to&apos;lov statistikasi</p>
        </div>
        <Link href="/dashboard/merchant/markets"
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all hover:scale-[1.02]">
          <Store className="w-4 h-4" />
          Do&apos;konlar
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DarkStatsCard title="Jami tranzaksiyalar" value={s?.total || 0} icon={CreditCard} trend={{ value: 12 }} />
        <DarkStatsCard title="Muvaffaqiyatli" value={s?.completed || 0} icon={CheckCircle}
          subtitle={formatAmount(parseFloat(s?.total_volume || '0'))} trend={{ value: 8 }} />
        <DarkStatsCard title="Kutilmoqda" value={s?.pending || 0} icon={Clock} />
        <DarkStatsCard title="Xato / Bekor" value={s?.failed || 0} icon={XCircle} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-2 bg-[#111] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Daromad grafigi</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                So&apos;nggi 7 kun —{' '}
                <span className="text-white font-semibold">
                  {chart.reduce((a: number, d: any) => a + d.amount, 0).toLocaleString()} so&apos;m
                </span>
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart.length ? chart : [{ date: '—', amount: 0, count: 0 }]}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => formatAmount(v)}
                contentStyle={{ background: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: 12, fontSize: 12, color: '#fff' }}
                labelStyle={{ color: '#9ca3af' }} />
              <Area type="monotone" dataKey="amount" stroke="#ffffff" strokeWidth={2}
                fill="url(#colorAmt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Connected providers */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white">Provayderlar</h2>
            <Link href="/dashboard/merchant/providers" className="text-gray-400 text-xs font-medium hover:text-white flex items-center gap-1 transition-colors">
              Barchasi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {providerList.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Provayder ulanmagan</p>
              <Link href="/dashboard/merchant/providers"
                className="inline-flex items-center gap-2 bg-white text-black text-xs font-bold px-3 py-2 rounded-xl mt-3 hover:bg-gray-100 transition-all">
                Ulash
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {providerList.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black text-xs font-bold">
                      {p.providerName[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{providerLabel(p.providerName)}</div>
                      <div className="text-xs text-gray-500">{p.totalTransactions} ta tranzaksiya</div>
                    </div>
                  </div>
                  <span className={statusBadgeClass(p.status)}>{statusLabel(p.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">So&apos;nggi tranzaksiyalar</h2>
          <Link href="/dashboard/merchant/transactions" className="text-gray-400 text-xs font-medium hover:text-white flex items-center gap-1 transition-colors">
            Barchasi <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <TransactionTable payments={payments} />
      </div>
    </div>
  );
}
