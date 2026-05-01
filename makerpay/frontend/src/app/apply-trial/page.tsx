'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, Zap, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ApplyTrialPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '', description: '', mvpUrl: '',
    telegramUsername: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/subscriptions/trial/apply', form);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || err?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">Ariza yuborildi!</h1>
        <p className="text-gray-400 mb-2">Adminlarimiz arizangizni 1-21 kun ichida ko'rib chiqadi.</p>
        <p className="text-gray-500 text-sm mb-8">Natija haqida telegram yoki email orqali xabar beramiz.</p>
        <Link href="/dashboard/merchant"
          className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all">
          Dashboardga qaytish
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Narxlarga qaytish
        </Link>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
              🧪 TRIAL — 2 oy bepul
            </div>
            <h1 className="text-2xl font-black text-white">Trial ariza</h1>
            <p className="text-gray-500 text-sm mt-1">Startup haqida ma'lumot bering, admin ko'rib chiqadi</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kompaniya / Startup nomi *</label>
              <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                placeholder="Masalan: Wentric, PayFlow..." required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Loyiha haqida *</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={4} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all resize-none"
                placeholder="Loyihangiz nima haqida? Qanday muammoni hal qiladi? Qancha foydalanuvchingiz bor?" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                MVP / Demo link <span className="text-gray-600 normal-case font-normal">(ixtiyoriy)</span>
              </label>
              <input value={form.mvpUrl} onChange={e => setForm({ ...form, mvpUrl: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all font-mono"
                placeholder="https://demo.yourproject.uz" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Telefon *</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                  placeholder="+998 90 000 00 00" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Telegram <span className="text-gray-600 normal-case font-normal">(ixtiyoriy)</span>
                </label>
                <input value={form.telegramUsername} onChange={e => setForm({ ...form, telegramUsername: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                  placeholder="@username" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
              ⏳ Admin arizangizni <span className="text-white font-semibold">1 kundan 3 haftagacha</span> ko'rib chiqadi. Tasdiqlansa, <span className="text-green-400 font-semibold">2 oy bepul Business darajasida</span> foydalanasiz.
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl bg-white text-black font-black text-base hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {loading ? 'Yuborilmoqda...' : 'Ariza yuborish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
