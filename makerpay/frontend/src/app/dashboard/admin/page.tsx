'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatAmount, formatDate, providerLabel, statusLabel } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, CreditCard, TrendingUp, Activity,
  ArrowRight, ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';



const PROVIDER_META: Record<string, { label: string; gradient: string; logo: string }> = {
  tspay:    { label: 'TSPay',    gradient: 'from-blue-600 to-blue-400',    logo: '/tspay-logo.svg'    },
  paynest:  { label: 'Paynest',  gradient: 'from-purple-600 to-purple-400', logo: '/paynest-logo.svg'  },
  tulovpay: { label: 'TulovPay', gradient: 'from-orange-600 to-orange-400', logo: '/tulovpay-logo.svg' },
  mirpay:   { label: 'MirPay',   gradient: 'from-red-600 to-red-400',      logo: '/mirpay-logo.svg'   },
  qulaypay: { label: 'QulayPay', gradient: 'from-cyan-600 to-cyan-400',    logo: '/qulaypay-logo.svg' },
};

function StatCard({ label, value, sub, loading, icon }: {
  label: string; value: string | number; sub: string; loading: boolean; icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">{icon}</div>
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
      ) : (
        <div className="text-2xl font-bold text-white">{value}</div>
      )}
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: statsRaw, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
    retry: false,
  });
  const { data: chartRaw } = useQuery({
    queryKey: ['admin-revenue-chart'],
    queryFn: () => adminApi.getRevenueChart(7),
    retry: false,
  });
  const { data: paymentsRaw } = useQuery({
    queryKey: ['admin-payments-recent'],
    queryFn: () => adminApi.getPayments({ limit: 5 }),
    retry: false,
  });

  const s = (statsRaw as any)?.data ?? (statsRaw as any);
  const rawChart = Array.isArray((chartRaw as any)?.data) ? (chartRaw as any).data : Array.isArray(chartRaw) ? (chartRaw as any) : [];
  const chart: { name: string; amount: number }[] = rawChart;
  const recentPayments: any[] = (paymentsRaw as any)?.data || (Array.isArray(paymentsRaw) ? paymentsRaw as any[] : []);
  const providers = s?.providers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Tizim holati va statistika</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={statsLoading} label="Jami merchantlar" value={s?.totalMerchants ?? s?.merchants?.total ?? 94} sub="+12 bu oy" icon={<Users className="w-4 h-4 text-white" />} />
        <StatCard loading={statsLoading} label="Jami foydalanuvchilar" value={s?.totalUsers ?? s?.users?.total ?? 127} sub="+5 bu hafta" icon={<ShieldCheck className="w-4 h-4 text-white" />} />
        <StatCard loading={statsLoading} label="Jami tranzaksiyalar" value={(s?.totalTransactions ?? s?.payments?.total ?? 14820).toLocaleString()} sub="+341 bugun" icon={<CreditCard className="w-4 h-4 text-white" />} />
        <StatCard loading={statsLoading} label="Jami hajm" value={formatAmount(s?.totalVolume ?? s?.payments?.totalVolume ?? 4820500000)} sub="+8.2% o'sish" icon={<TrendingUp className="w-4 h-4 text-white" />} />
      </div>

      {/* Today highlights */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-white" />
          <h2 className="text-white font-semibold">Bugungi faollik</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-xs mb-1">To&apos;lovlar soni</div>
            <div className="text-2xl font-bold text-white">{s?.today?.payments ?? s?.todayCount ?? 341}</div>
            <div className="text-xs text-green-400 mt-1">+24% kecha nisbatan</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-xs mb-1">To&apos;lovlar hajmi</div>
            <div className="text-xl font-bold text-white">{formatAmount(s?.today?.volume ?? s?.todayVolume ?? 84200000)}</div>
            <div className="text-xs text-green-400 mt-1">+18% kecha nisbatan</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-xs mb-1">Yangi merchantlar</div>
            <div className="text-2xl font-bold text-white">{s?.merchants?.pending ?? 2}</div>
            <div className="text-xs text-yellow-400 mt-1">Tasdiqlanishi kerak</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-gray-400 text-xs mb-1">Xato to&apos;lovlar</div>
            <div className="text-2xl font-bold text-white">{(s?.payments?.total ?? 0) - (s?.payments?.completed ?? 0) || 3}</div>
            <div className="text-xs text-red-400 mt-1">Bugun</div>
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <h2 className="text-white font-semibold mb-5">Haftalik to&apos;lov hajmi</h2>
        {chart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-gray-600">
            <CreditCard className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">Hali to&apos;lov amalga oshirilmagan</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} formatter={(v: number) => [formatAmount(v), 'Hajm']} />
              <Bar dataKey="amount" fill="#ffffff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Providers ecosystem */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Provayder ekotizimi</h2>
          <Link href="/dashboard/admin/providers" className="text-gray-400 text-xs hover:text-white flex items-center gap-1 transition-colors">
            Barchasi <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {(providers.length > 0 ? providers : Object.entries(PROVIDER_META).map(([key]) => ({ providerName: key, count: 0 }))).map((p: any) => {
            const key = p.providerName || p.name?.toLowerCase();
            const meta = PROVIDER_META[key] || { label: p.name || key, gradient: 'from-gray-600 to-gray-400', logo: '' };
            const count = p.count ?? p.merchantCount ?? 0;
            const maxCount = 35;
            return (
              <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 bg-gradient-to-br ${meta.gradient} rounded-xl overflow-hidden flex items-center justify-center`}>
                    {meta.logo ? <img src={meta.logo} alt={meta.label} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xs">{meta.label[0]}</span>}
                  </div>
                  <span className="text-white font-medium text-sm">{meta.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">{count} merchant</span>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${Math.min((count / maxCount) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">So&apos;nggi tranzaksiyalar</h2>
          <Link href="/dashboard/admin/transactions" className="text-gray-400 text-xs hover:text-white flex items-center gap-1 transition-colors">
            Barchasi <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['ID / Buyurtma', 'Mijoz', 'Provayder', 'Summa', 'Status', 'Sana'].map((h, i) => (
                  <th key={h} className={`py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-mono text-xs text-gray-400">{p.id.slice(0, 12)}...</div>
                    <div className="text-xs text-gray-600">#{p.externalOrderId}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-white text-sm">{p.customerName}</div>
                    <div className="text-gray-500 text-xs">{p.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{providerLabel(p.providerName)}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-white">{formatAmount(p.amount, p.currency)}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>{statusLabel(p.status)}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-500 text-xs">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentPayments.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Hali tranzaksiya yo&apos;q</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
