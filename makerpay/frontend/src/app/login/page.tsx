'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { Eye, EyeOff, Loader2, ArrowLeft, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res: any = await authApi.login(form);
      setAuth(res.user, res.accessToken);
      const roleRoutes: Record<string, string> = {
        admin:   '/dashboard/admin',
        manager: '/dashboard/manager',
        support: '/dashboard/support',
        user:    '/dashboard/merchant',
      };
      router.push(roleRoutes[res.user.role] || '/dashboard/merchant');
    } catch (err: any) {
      setError(err?.message || "Login muvaffaqiyatsiz. Iltimos, qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">

      {/* Animated background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-3xl" />

      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Back button */}
      <Link href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-white transition-all duration-200 group animate-fade-in">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">Orqaga</span>
      </Link>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block mb-4 relative animate-zoom-in">
            <div className="absolute -inset-2 bg-red-500/20 rounded-3xl blur-2xl animate-glow-pulse" />
            <img
              src="/logo.png"
              alt="MakerPay"
              className="relative w-24 h-24 rounded-3xl object-contain bg-black shadow-2xl border border-white/10"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">MakerPay</h1>
          <p className="text-gray-500 text-sm mt-1">Payment Automation Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[#111] border border-white/10 rounded-3xl shadow-2xl p-8 animate-scale-in delay-100">
          <h2 className="text-xl font-bold text-white mb-1">Tizimga kirish</h2>
          <p className="text-sm text-gray-500 mb-6">Akkauntingizga kiring</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-fade-in delay-200">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email manzil
              </label>
              <input
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none focus:bg-white/8 transition-all text-sm"
                placeholder="merchant@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="animate-fade-in delay-300">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Parol</label>
                <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-white transition-colors">
                  Parolni unutdingizmi?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none focus:bg-white/8 transition-all text-sm"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="animate-fade-in delay-400">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-black py-3.5 rounded-xl hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-base mt-2"
              >
                {loading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Kirish...</>
                  : <><Zap className="w-5 h-5" /> Kirish</>}
              </button>
            </div>
          </form>

          <div className="mt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-600">yoki</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <a href="http://localhost:3001/api/v1/auth/google"
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-semibold text-white">
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.5 19 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.2 0-9.6-3-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C42 35.2 44 30 44 24c0-1.3-.1-2.6-.4-3.5z"/></svg>
              Google bilan kirish
            </a>
          </div>

          <p className="text-center text-sm text-gray-600 mt-5 animate-fade-in delay-500">
            Akkauntingiz yo&apos;qmi?{' '}
            <Link href="/register" className="text-white font-semibold hover:underline">
              Ro&apos;yxatdan o&apos;ting
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6 animate-fade-in delay-500">
          © 2026 MakerPay.uz · Barcha huquqlar himoyalangan
        </p>
      </div>
    </div>
  );
}
