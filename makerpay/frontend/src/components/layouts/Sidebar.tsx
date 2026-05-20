'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, GitBranch, Key, Webhook,
  FileText, Users, ShieldCheck, BarChart2, Settings,
  LogOut, ChevronRight, HelpCircle, MessageSquare, Store, Rocket,
  Send, Megaphone, Crown, Banknote, HardDrive, ArrowLeftRight, Tag,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const adminMenus = [
  { href: '/dashboard/admin',                icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/admin/merchants',      icon: Users,           label: 'Merchantlar' },
  { href: '/dashboard/admin/transactions',   icon: CreditCard,      label: 'Tranzaksiyalar' },
  { href: '/dashboard/admin/users',          icon: ShieldCheck,     label: 'Foydalanuvchilar' },
  { href: '/dashboard/admin/markets',        icon: Store,           label: "Do'konlar" },
  { href: '/dashboard/admin/providers',      icon: GitBranch,       label: "To'lov ekotizimi" },
  { href: '/dashboard/admin/deploy',         icon: Rocket,          label: 'Deploy' },
  { href: '/dashboard/admin/analytics',      icon: BarChart2,       label: 'Analitika' },
  { href: '/dashboard/admin/subscriptions',  icon: Crown,           label: 'Obunalar' },
  { href: '/dashboard/admin/ads',            icon: Megaphone,       label: 'Reklama' },
  { href: '/dashboard/admin/errors',         icon: HelpCircle,      label: 'Xatolik loglari' },
  { href: '/dashboard/admin/settings',       icon: Settings,        label: 'Sozlamalar' },
];

const merchantMenus = [
  { href: '/dashboard/merchant',              icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/merchant/markets',      icon: Store,           label: "Do'konlar" },
  { href: '/dashboard/merchant/transactions', icon: CreditCard,      label: 'Tranzaksiyalar' },
  { href: '/dashboard/merchant/providers',    icon: GitBranch,       label: 'Provayderlar' },
  { href: '/dashboard/merchant/api-keys',     icon: Key,             label: 'API Kalitlar' },
  { href: '/dashboard/merchant/withdraw',     icon: Banknote,        label: 'Balans yechish' },
  { href: '/dashboard/merchant/webhooks',     icon: Webhook,         label: 'Webhook loglar' },
  { href: '/dashboard/merchant/deploy',       icon: Rocket,          label: 'Deploy' },
  { href: '/dashboard/merchant/storage',      icon: HardDrive,       label: 'Storage' },
  { href: '/dashboard/merchant/analytics',    icon: BarChart2,       label: 'Analitika',  premium: true },
  { href: '/dashboard/merchant/diagnostics',  icon: HelpCircle,      label: 'Diagnostika', premium: true },
  { href: '/dashboard/merchant/profile',      icon: Settings,        label: 'Profil' },
  { href: '/dashboard/merchant/docs',         icon: FileText,        label: 'Dokumentatsiya' },
  { href: '/pricing',                         icon: Tag,             label: 'Tariflar' },
];

const menusByRole: Record<string, any[]> = {
  user:    merchantMenus,
  manager: [
    { href: '/dashboard/manager',              icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/manager/merchants',    icon: Users,           label: 'Merchantlar' },
    { href: '/dashboard/manager/transactions', icon: CreditCard,      label: 'Tranzaksiyalar' },
    { href: '/dashboard/manager/analytics',    icon: BarChart2,       label: 'Analitika' },
    { href: '/dashboard/manager/providers',    icon: GitBranch,       label: 'Provayderlar' },
  ],
  support: [
    { href: '/dashboard/support',              icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/support/tickets',      icon: MessageSquare,   label: 'Ticketlar' },
    { href: '/dashboard/support/messages',     icon: Send,            label: 'Telegram xabar' },
    { href: '/dashboard/support/merchants',    icon: Users,           label: 'Merchantlar' },
    { href: '/dashboard/support/transactions', icon: CreditCard,      label: 'Tranzaksiyalar' },
  ],
};

const roleLabels: Record<string, string> = {
  admin:   'Administrator',
  manager: 'Menejer',
  support: "Qo'llab-quvvatlash",
  user:    'Merchant',
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, viewMode, setViewMode } = useAuthStore();
  const role = user?.role || 'user';

  const isAdmin = role === 'admin';
  const isMerchantView = isAdmin && viewMode === 'merchant';

  const menus = isAdmin
    ? (isMerchantView ? merchantMenus : adminMenus)
    : (menusByRole[role] || merchantMenus);

  const basePath = isMerchantView ? 'merchant' : (role === 'user' ? 'merchant' : role);

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <aside className="w-64 min-h-screen bg-[#111] border-r border-white/10 text-white flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="MakerPay" className="w-10 h-10 rounded-xl object-cover shrink-0" />
          <div>
            <div className="font-bold text-white text-base leading-none">MakerPay</div>
            <div className="text-gray-500 text-xs mt-0.5">Payment Platform</div>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
          {user?.avatarUrl
            ? <img src={user.avatarUrl} alt={user.fullName} className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/20" />
            : <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-sm font-bold text-black shrink-0">
                {user?.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
          }
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate text-white">{user?.fullName || 'Foydalanuvchi'}</div>
            <div className="text-gray-500 text-xs">
              {isMerchantView ? 'Merchant ko\'rinishi' : roleLabels[role]}
            </div>
          </div>
        </div>

        {/* Admin view switcher */}
        {isAdmin && (
          <button
            onClick={() => {
              const next = isMerchantView ? 'default' : 'merchant';
              setViewMode(next);
              router.push(next === 'merchant' ? '/dashboard/merchant' : '/dashboard/admin');
            }}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
            {isMerchantView ? 'Admin paneliga qaytish' : "Merchant ko'rinishi"}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menus.map(({ href, icon: Icon, label, premium }: any) => {
          const active = pathname === href || (href !== `/dashboard/${basePath}` && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group',
                active ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {premium && !active && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">PRO</span>
              )}
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
