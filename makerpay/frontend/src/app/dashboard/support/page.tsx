'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { MessageSquare, Users, AlertTriangle, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDate, statusLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const MOCK_TICKETS = [
  { id: 'TKT-001', subject: "To'lov amalga oshmadi",       merchant: 'Ali Valiyev',    priority: 'high',   time: '10 daq oldin' },
  { id: 'TKT-004', subject: 'Merchant verification rad',   merchant: 'Jasur Mirzayev', priority: 'urgent', time: '2 soat oldin' },
  { id: 'TKT-002', subject: 'Webhook status yangilanmaydi',merchant: 'Sardor Rahimov', priority: 'medium', time: '3 soat oldin' },
];

export default function SupportDashboard() {
  const { user } = useAuthStore();
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.getStats() });
  const { data: errorsData } = useQuery({ queryKey: ['errors'], queryFn: () => adminApi.getErrors({ limit: 5 }) });

  const s = stats as any;
  const errors = (errorsData as any)?.data || [];

  const pCls: Record<string, string> = {
    urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
    high:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    low:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Xush kelibsiz, {user?.fullName?.split(' ')[0]} — murojatlarni boshqaring</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, label: 'Ochiq ticketlar',    value: 3,                                                              clr: 'bg-red-500/20',    link: '/dashboard/support/tickets' },
          { icon: Users,         label: 'Merchantlar',        value: s?.merchants?.total || 0,                                      clr: 'bg-blue-500/20',   link: '/dashboard/support/merchants' },
          { icon: AlertTriangle, label: "Xato to'lovlar",     value: Math.max(0,(s?.payments?.total||0)-(s?.payments?.completed||0)), clr: 'bg-orange-500/20', link: '/dashboard/support/transactions' },
          { icon: Clock,         label: 'Kutmoqda',           value: s?.merchants?.pending || 0,                                    clr: 'bg-yellow-500/20', link: '/dashboard/support/merchants' },
        ].map(({ icon: Icon, label, value, clr, link }) => (
          <Link key={label} href={link} className="bg-[#111] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${clr}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Open tickets */}
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-white">Ochiq ticketlar</h2>
            <Link href="/dashboard/support/tickets" className="text-gray-500 text-xs hover:text-white flex items-center gap-1 transition-colors">
              Barchasi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {MOCK_TICKETS.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Ochiq ticket yo&apos;q</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {MOCK_TICKETS.map(t => (
                <Link key={t.id} href="/dashboard/support/tickets"
                  className="flex items-start justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-600">{t.id}</span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold border ${pCls[t.priority]}`}>
                        {t.priority === 'urgent' ? 'Shoshilinch' : t.priority === 'high' ? 'Yuqori' : "O'rta"}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white">{t.subject}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.merchant}</div>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{t.time}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent errors */}
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-white">Xato to&apos;lovlar</h2>
            <Link href="/dashboard/support/transactions" className="text-gray-500 text-xs hover:text-white flex items-center gap-1 transition-colors">
              Barchasi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {errors.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Xato to&apos;lovlar yo&apos;q</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {errors.slice(0,5).map((p: any) => (
                <div key={p.id} className="flex items-start justify-between px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-white">{p.merchantId?.slice(0,8)}...</div>
                    <div className="text-xs text-red-400 mt-0.5">{p.errorMessage || "Noma'lum xato"}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{formatDate(p.createdAt)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">{Number(p.amount).toLocaleString()} so&apos;m</div>
                    <span className="text-xs text-red-400">{statusLabel(p.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/support/tickets',  icon: MessageSquare, label: 'Ticketlar',        desc: "Merchant murojatlarini ko'rish va hal qilish", clr: 'bg-purple-500/20' },
          { href: '/dashboard/support/messages', icon: AlertTriangle, label: 'Telegram xabar',   desc: 'Merchantlarga Telegram orqali xabar yuborish',  clr: 'bg-blue-500/20'   },
          { href: '/dashboard/support/merchants',icon: Users,         label: 'Merchantlar',       desc: "Merchant profillarini ko'rish",                 clr: 'bg-green-500/20'  },
        ].map(({ href, icon: Icon, label, desc, clr }) => (
          <Link key={href} href={href}
            className="bg-[#111] border border-white/10 rounded-2xl p-5 flex items-start gap-4 hover:border-white/20 hover:bg-white/5 transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${clr}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white mb-0.5">{label}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
