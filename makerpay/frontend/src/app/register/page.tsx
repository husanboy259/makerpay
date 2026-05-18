'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { Eye, EyeOff, Loader2, Check, ArrowLeft, ArrowRight, User, Building2, Lock, Mail } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'ecommerce',  label: 'E-commerce' },
  { value: 'retail',     label: 'Chakana savdo' },
  { value: 'food',       label: 'Oziq-ovqat' },
  { value: 'logistics',  label: 'Logistika' },
  { value: 'digital',    label: 'Raqamli mahsulot' },
  { value: 'services',   label: 'Xizmatlar' },
  { value: 'other',      label: 'Boshqa' },
];

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    businessType: '',
    website: '',
    address: '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const pwdChecks = [
    { label: 'Kamida 8 ta belgi', ok: form.password.length >= 8 },
    { label: 'Katta harf (A-Z)',  ok: /[A-Z]/.test(form.password) },
    { label: 'Kichik harf (a-z)', ok: /[a-z]/.test(form.password) },
    { label: 'Raqam (0-9)',       ok: /\d/.test(form.password) },
  ];
  const pwdStrong = pwdChecks.every(c => c.ok);

  const startCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => setResendCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    if (step === 2) { setStep(3); return; }

    if (step === 3) {
      setError('');
      if (form.password !== form.confirmPassword) { setError('Parollar mos kelmaydi'); return; }
      if (!pwdStrong) { setError('Parol talablarga javob bermaydi'); return; }
      setLoading(true);
      try {
        await authApi.register({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password });
        startCooldown();
        setStep(4);
      } catch (err: any) {
        setError(err?.message || "Ro'yxatdan o'tish xatoligi");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 4) {
      setError('');
      setLoading(true);
      try {
        const res: any = await authApi.verifyOtp(form.email, otp);
        setAuth(res.user, res.accessToken);
        router.push('/dashboard/merchant');
      } catch (err: any) {
        setError(err?.message || 'Kod noto\'g\'ri');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try { await authApi.resendOtp(form.email); startCooldown(); } catch {}
  };


  const STEPS = [
    { icon: User,      label: 'Shaxsiy' },
    { icon: Building2, label: 'Kompaniya' },
    { icon: Lock,      label: 'Parol' },
    { icon: Mail,      label: 'Tasdiqlash' },
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-80 h-80 bg-white/3 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-white/2 rounded-full blur-3xl" />
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <img src="/logo.png" alt="MakerPay" className="w-10 h-10 rounded-xl" />
            <span className="text-white font-bold text-xl">MakerPay</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Merchant akkaunt yarating</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            return (
              <div key={s.label} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                  ${active ? 'bg-white text-black' : done ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-600'}`}>
                  <s.icon className="w-3 h-3" />
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <div className={`w-6 h-px ${done ? 'bg-white/40' : 'bg-white/10'}`} />}
              </div>
            );
          })}
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Step 1: Personal info */}
            {step === 1 && (
              <>
                <div className="mb-2">
                  <h2 className="text-lg font-bold text-white">Shaxsiy ma&apos;lumotlar</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Asosiy kontakt ma&apos;lumotlaringiz</p>
                </div>
                <Field label="To'liq ism" required>
                  <input className={inputCls} placeholder="Sardor Aliyev" value={form.fullName}
                    onChange={e => set('fullName', e.target.value)} required />
                </Field>
                <Field label="Email manzil" required>
                  <input type="email" className={inputCls} placeholder="sardor@company.uz" value={form.email}
                    onChange={e => set('email', e.target.value)} required />
                </Field>
                <Field label="Telefon raqam" required>
                  <input className={inputCls} placeholder="+998 90 123 45 67" value={form.phone}
                    onChange={e => set('phone', e.target.value)} required />
                </Field>
                <button type="submit" disabled={!form.fullName || !form.email || !form.phone}
                  className="w-full py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  Keyingi <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Step 2: Company info */}
            {step === 2 && (
              <>
                <div className="mb-2">
                  <h2 className="text-lg font-bold text-white">Kompaniya ma&apos;lumotlari</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Biznesingiz haqida ma&apos;lumot</p>
                </div>
                <Field label="Kompaniya nomi" required>
                  <input className={inputCls} placeholder="TechShop UZ LLC" value={form.companyName}
                    onChange={e => set('companyName', e.target.value)} required />
                </Field>
                <Field label="Biznes turi" required>
                  <select className={inputCls} value={form.businessType}
                    onChange={e => set('businessType', e.target.value)} required>
                    <option value="" disabled className="bg-[#111]">Tanlang...</option>
                    {BUSINESS_TYPES.map(b => <option key={b.value} value={b.value} className="bg-[#111]">{b.label}</option>)}
                  </select>
                </Field>
                <Field label="Veb-sayt">
                  <input className={inputCls} placeholder="https://yoursite.uz" value={form.website}
                    onChange={e => set('website', e.target.value)} />
                </Field>
                <Field label="Manzil">
                  <input className={inputCls} placeholder="Toshkent sh., Chilonzor tumani" value={form.address}
                    onChange={e => set('address', e.target.value)} />
                </Field>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Orqaga
                  </button>
                  <button type="submit" disabled={!form.companyName || !form.businessType}
                    className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                    Keyingi <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
              <>
                <div className="mb-2">
                  <h2 className="text-lg font-bold text-white">Parol yarating</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Xavfsiz parol tanlang</p>
                </div>
                <Field label="Parol" required>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} className={`${inputCls} pr-11`}
                      placeholder="••••••••" value={form.password}
                      onChange={e => set('password', e.target.value)} required />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {pwdChecks.map(({ label, ok }) => (
                        <div key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-400' : 'text-gray-600'}`}>
                          <Check className={`w-3 h-3 shrink-0 ${ok ? 'opacity-100' : 'opacity-30'}`} />
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
                <Field label="Parolni tasdiqlang" required>
                  <input type="password" className={`${inputCls} ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/50' : ''}`}
                    placeholder="••••••••" value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)} required />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Parollar mos kelmaydi</p>
                  )}
                </Field>

                {/* Summary */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ma&apos;lumotlar tekshiruvi</div>
                  {[['Ism', form.fullName], ['Email', form.email], ['Telefon', form.phone], ['Kompaniya', form.companyName]].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-xs">
                      <span className="text-gray-500">{l}</span>
                      <span className="text-white font-medium">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Orqaga
                  </button>
                  <button type="submit" disabled={loading || !pwdStrong || form.password !== form.confirmPassword}
                    className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...</> : <><ArrowRight className="w-4 h-4" /> Keyingi</>}
                  </button>
                </div>
              </>
            )}

            {/* Step 4: OTP */}
            {step === 4 && (
              <>
                <div className="mb-2">
                  <h2 className="text-lg font-bold text-white">Emailni tasdiqlang</h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    <span className="text-white font-medium">{form.email}</span> ga 6 xonali kod yuborildi
                  </p>
                </div>

                <div className="flex justify-center gap-2 my-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={otp[i] || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        const arr = otp.split('');
                        arr[i] = val;
                        setOtp(arr.join(''));
                        if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
                      }}
                      className="w-11 h-12 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/40 transition-all"
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Tekshirilmoqda...</> : 'Tasdiqlash'}
                </button>

                <div className="text-center mt-3">
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                    className="text-xs text-gray-500 hover:text-white transition-colors disabled:opacity-40">
                    {resendCooldown > 0 ? `Qayta yuborish (${resendCooldown}s)` : 'Kodni qayta yuborish'}
                  </button>
                </div>
              </>
            )}
          </form>

          {step === 1 && (
            <div className="mt-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-gray-600">yoki</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/google`}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-semibold text-white">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.5 19 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.2 0-9.6-3-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C42 35.2 44 30 44 24c0-1.3-.1-2.6-.4-3.5z"/></svg>
                Google bilan ro&apos;yxatdan o&apos;tish
              </a>
            </div>
          )}

          <p className="text-center text-sm text-gray-600 mt-5">
            Akkauntingiz bormi?{' '}
            <Link href="/login" className="text-white font-medium hover:underline">Kirish</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
