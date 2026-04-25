'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Bell, Search } from 'lucide-react';

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
            <button className="relative p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
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
