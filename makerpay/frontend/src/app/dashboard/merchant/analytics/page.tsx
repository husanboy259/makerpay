'use client';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi, merchantsApi } from '@/lib/api';
import { Crown, Lock, TrendingUp, TrendingDown, CreditCard, CheckCircle, XCircle, Clock, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatAmount } from '@/lib/utils';

function PremiumGate() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-9 h-9 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Premium funksiya</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Batafsil analitika faqat <span className="text-yellow-400 font-semibold">Start, Pro va Business</span> tariflarida mavjud.
          Tranzaksiyalar trenди, konversiya, provayder solishtiruvi va boshqa ma'lumotlarni ko'ring.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/pricing" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 transition-all">
            <Crown className="w-4 h-4" /> Tarifni yangilash
          </Link>
          <Link href="/apply-trial" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition-all">
            Trial so'rash <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

export default function MerchantAnalyticsPage() {
  const { data: merchant } = useQuery({
    queryKey: ['merchant-me'],
    queryFn: () => merchantsApi.getMe().catch(() => null),
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () => paymentsApi.getStats(),
  });

  const { data: chartData } = useQuery({
    queryKey: ['payment-chart'],
    queryFn: () => paymentsApi.getChart(),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['payments', { limit: 100 }],
    queryFn: () => paymentsApi.getAll({ limit: 100, page: 1 }),
  });

  // Check subscription - free plan = no access
  const subscription = (merchant as any)?.subscription;
  const isPremium = subscription && subscription.plan !== 'free';

  if (!isPremium) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Analitika</h1>
          <p className="text-sm text-gray-500">Batafsil to'lov statistikasi va trendlar</p>
        </div>
      </div>
      <PremiumGate />
    </div>
  );

  const s = stats as any;
  const chart = Array.isArray(chartData) ? chartData : [];
  const payments = (paymentsData as any)?.data || [];

  // Provider distribution
  const providerMap: Record<string, number> = {};
  payments.forEach((p: any) => {
    if (p.providerName) providerMap[p.providerName] = (providerMap[p.providerName] || 0) + 1;
  });
  const providerData = Object.entries(providerMap).map(([name, value]) => ({ name, value }));

  // Status distribution
  const statusMap: Record<string, number> = {};
  payments.forEach((p: any) => {
    statusMap[p.status] = (statusMap[p.status] || 0) + 1;
  });
  const statusData = [
    { name: 'Muvaffaqiyatli', value: statusMap['completed'] || 0, color: '#22c55e' },
    { name: 'Kutmoqda',       value: statusMap['pending'] || 0,   color: '#f59e0b' },
    { name: 'Muvaffaqiyatsiz',value: statusMap['failed'] || 0,    color: '#ef4444' },
    { name: 'Qaytarilgan',    value: statusMap['refunded'] || 0,  color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const successRate = s?.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Analitika</h1>
          <p className="text-sm text-gray-500">Batafsil to'lov statistikasi va trendlar</p>
        </div>
        <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">PRO</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Jami daromad',      value: formatAmount(s?.totalVolume || 0), icon: TrendingUp,   color: 'text-green-400' },
          { label: 'Jami tranzaksiya',  value: s?.total || 0,                     icon: CreditCard,   color: 'text-blue-400' },
          { label: 'Muvaffaqiyat %',    value: `${successRate}%`,                 icon: CheckCircle,  color: 'text-emerald-400' },
          { label: "Kutilayotganlar",   value: s?.pending || 0,                   icon: Clock,        color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-4">Daromad trendi (so'nggi 30 kun)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chart}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} labelStyle={{ color: '#fff' }} />
            <Area type="monotone" dataKey="amount" stroke="#22c55e" fill="url(#grad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Transaction volume bar chart */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4">Tranzaksiyalar soni</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4">To'lov holatlari</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">Ma'lumot yo'q</div>
          )}
        </div>
      </div>

      {/* Provider stats */}
      {providerData.length > 0 && (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4">Provayder bo'yicha taqsimot</h2>
          <div className="space-y-3">
            {providerData.map((p, i) => {
              const total = providerData.reduce((a, b) => a + b.value, 0);
              const pct = Math.round((p.value / total) * 100);
              return (
                <div key={p.name} className="flex items-center gap-4">
                  <span className="text-sm text-gray-400 w-24 shrink-0">{p.name}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <span className="text-sm font-semibold text-white w-12 text-right">{pct}%</span>
                  <span className="text-xs text-gray-500 w-16 text-right">{p.value} ta</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
