'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Bell, Search, CheckCheck } from 'lucide-react';
import api from '@/lib/api';

function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => api.get('/subscriptions/notifications/unread-count') as any,
    refetchInterval: 30000,
  });
  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/subscriptions/notifications') as any,
    enabled: open,
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.patch('/subscriptions/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif-count', 'notifications'] }),
  });

  const readOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/subscriptions/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif-count', 'notifications'] }),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const count = (countData as any)?.count || 0;
  const list: any[] = Array.isArray(notifs) ? notifs : [];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-bold text-white">Bildirishnomalar</span>
            {count > 0 && (
              <button onClick={() => readAllMutation.mutate()}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                <CheckCheck className="w-3.5 h-3.5" /> Hammasini o'qildi
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {list.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">Bildirishnoma yo'q</div>
            ) : list.map((n: any) => (
              <div key={n.id}
                onClick={() => { if (!n.isRead) readOneMutation.mutate(n.id); }}
                className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-white/[0.03]' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-indigo-400' : 'bg-transparent'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  if (!token || !user) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-[#111] border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-72">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              placeholder="Qidirish..."
              className="bg-transparent text-sm text-gray-300 outline-none flex-1 placeholder-gray-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-sm font-bold text-black">
              {user.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
