'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, Zap, ArrowLeft, CheckCircle, Copy, Check, CreditCard, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const STEPS = ['form', 'payment', 'done'] as const;
type Step = typeof STEPS[number];

export default function ApplyTrialPage() {
  const [step, setStep]   = useState<Step>('form');
  const [form, setForm]   = useState({ companyName: '', description: '', mvpUrl: '', telegramUsername: '', phone: '' });
  const [payer, setPayer] = useState({ name: '', phone: '' });
  const [payInfo, setPayInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    api.get('/subscriptions/trial/payment-info').then((res: any) => setPayInfo(res)).catch(() => {});
  }, []);

  const copyCard = () => {
    navigator.clipboard.writeText(payInfo?.cardNumber?.replace(/\s/g, '') || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/subscriptions/trial/apply', {
        ...form,
        verificationPayerName:  payer.name,
        verificationPayerPhone: payer.phone,
      });
      setStep('done');
    } catch (err: any) {
      setError(err?.message || err?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">Ariza yuborildi!</h1>
        <p className="text-gray-400 mb-2">To'lov tekshirilgandan so'ng ariza ko'rib chiqiladi.</p>
        <p className="text-gray-500 text-sm mb-8">Natija haqida Telegram yoki email orqali xabar beramiz.</p>
        <Link href="/pricing"
          className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all">
          Tarifni tanlash →
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

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          {[{ n: 1, t: 'Ariza' }, { n: 2, t: "To'lov" }].map(({ n, t }, i) => {
            const isActive = (step as string) === 'form' && i === 0 || (step as string) === 'payment' && i === 1;
            return (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-white text-black' : 'bg-white/10 text-gray-500'}`}>
                  {n}
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>{t}</span>
                {i === 0 && <div className="w-8 h-px bg-white/10" />}
              </div>
            );
          })}
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
              🧪 TRIAL — 2 oy bepul
            </div>
            <h1 className="text-2xl font-black text-white">
              {step === 'form' ? 'Trial ariza' : "Tekshiruv to'lovi"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {step === 'form' ? 'Startup haqida ma\'lumot bering' : 'Ariza tasdiqlash uchun kichik to\'lov'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* ── STEP 1: Form ── */}
          {step === 'form' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kompaniya / Startup nomi *</label>
                <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                  placeholder="Masalan: Wentric, PayFlow..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Loyiha haqida *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all resize-none"
                  placeholder="Loyihangiz nima haqida? Qanday muammoni hal qiladi?" />
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
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">+998</span>
                    <input
                      value={form.phone}
                      maxLength={12}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                        const formatted = digits.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4').trim();
                        setForm({ ...form, phone: formatted });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-16 pr-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                      placeholder="90 123 45 67" />
                  </div>
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
              <button
                onClick={() => { if (!form.companyName || !form.description || !form.phone) { setError('Barcha majburiy maydonlarni to\'ldiring'); return; } setError(''); setStep('payment'); }}
                className="w-full py-4 rounded-xl bg-white text-black font-black text-base hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" /> Keyingi qadam →
              </button>
            </div>
          )}

          {/* ── STEP 2: Payment ── */}
          {step === 'payment' && (
            <div className="space-y-5">
              {/* Payment amount banner */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 text-center">
                <p className="text-xs text-green-400 uppercase tracking-wider mb-1">Tekshiruv to&apos;lovi</p>
                <p className="text-4xl font-black text-white">{payInfo?.amount?.toLocaleString() || '6 000'} <span className="text-xl text-gray-400">UZS</span></p>
                <p className="text-xs text-gray-500 mt-2">Bu summa spam va nohaqiqiy arizalarni oldini olish uchun</p>
              </div>

              {/* Card info */}
              <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Karta raqami</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono font-bold text-white tracking-widest">
                    {payInfo?.cardNumber || '8600 0000 0000 0000'}
                  </code>
                  <button onClick={copyCard}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
                    {copied ? <><Check className="w-3 h-3 text-green-400" /> Nusxa!</> : <><Copy className="w-3 h-3" /> Nusxa</>}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">{payInfo?.cardHolder || 'MakerPay'}</p>
              </div>

              <div className="text-xs text-gray-500 bg-white/5 rounded-xl p-3 leading-relaxed">
                1. Yuqoridagi kartaga <strong className="text-white">{payInfo?.amount?.toLocaleString() || '6 000'} UZS</strong> o&apos;tkazing<br/>
                2. Quyida ismingiz va telefon raqamingizni kiriting<br/>
                3. &quot;Ariza yuborish&quot; tugmasini bosing — admin to&apos;lovni tekshiradi
              </div>

              {/* Payer info */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To&apos;lovchi ismi *</label>
                  <input value={payer.name} onChange={e => setPayer({ ...payer, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                    placeholder="Ism Familiya" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To&apos;lovchi telefon *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">+998</span>
                    <input
                      value={payer.phone}
                      maxLength={12}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                        const formatted = digits.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4').trim();
                        setPayer({ ...payer, phone: formatted });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-16 pr-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                      placeholder="90 123 45 67" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('form')}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white transition-colors">
                  ← Orqaga
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !payer.name || !payer.phone}
                  className="flex-1 py-3 rounded-xl bg-green-500 text-black text-sm font-black hover:bg-green-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {loading ? 'Yuborilmoqda...' : 'Ariza yuborish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
