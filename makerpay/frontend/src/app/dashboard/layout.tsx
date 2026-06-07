'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Bell, Search, CheckCheck, MessageCircle, X, Send, Bot, Loader2, Menu } from 'lucide-react';
import api from '@/lib/api';

// ─── Chatbot Widget ──────────────────────────────────────────────────────────
function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: "Salom! Men MakerPay yordamchisiman. Qanday yordam bera olaman?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const res: any = await api.post('/chatbot/message', { message: userMsg });
      setMessages(m => [...m, { role: 'bot', text: res.reply || 'Javob topilmadi' }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: '420px' }}>
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-white">MakerPay AI</span>
              <span className="w-2 h-2 bg-green-400 rounded-full" />
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-white text-black font-medium'
                    : 'bg-white/5 border border-white/10 text-gray-200'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Xabar yozing..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-gray-600"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2 bg-white text-black rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:bg-gray-100 transition-all hover:scale-105">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}

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
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (hydrated && !token) router.replace('/login');
  }, [hydrated, token, router]);

  // Wait for localStorage to load — show blank screen, not a redirect flash
  if (!hydrated) return <div className="min-h-screen bg-black" />;
  if (!token || !user) return null;

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0">
        <header className="h-16 bg-[#111] border-b border-white/10 flex items-center justify-between gap-3 px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-full max-w-72">
              <Search className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                placeholder="Qidirish..."
                className="bg-transparent text-sm text-gray-300 outline-none flex-1 min-w-0 placeholder-gray-600"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <NotificationBell />
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-sm font-bold text-black shrink-0">
              {user.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
