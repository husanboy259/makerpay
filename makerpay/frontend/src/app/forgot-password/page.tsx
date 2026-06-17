'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { ArrowLeft, Loader2, Mail, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none transition-all text-sm";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep('reset');
    } catch (err: any) {
      setError(err?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Parollar bir xil emas');
      return;
    }
    if (newPassword.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'Kod noto\'g\'ri yoki muddati tugagan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/3 rounded-full blur-3xl" />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <Link href="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-white transition-all group">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">Orqaga</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img src="/logo.png" alt="MakerPay" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">MakerPay</span>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl shadow-2xl p-8">

          {step === 'done' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Parol o'zgartirildi!</h2>
              <p className="text-sm text-gray-500 mb-6">Yangi parol bilan tizimga kirishingiz mumkin.</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-all text-sm">
                Kirish sahifasiga o'tish
              </button>
            </div>
          ) : step === 'email' ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Parolni tiklash</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Email manzilingizga tasdiqlash kodi yuboriladi</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Email manzil
                  </label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="email@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-black py-3.5 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...</> : 'Kod yuborish'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Yangi parol</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="text-white font-medium">{email}</span> ga kod yuborildi
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Tasdiqlash kodi
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className={`${inputCls} text-center text-2xl font-bold tracking-[0.5em]`}
                    placeholder="000000"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Yangi parol
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className={`${inputCls} pr-11`}
                      placeholder="Kamida 6 belgi"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Parolni tasdiqlang
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className={inputCls}
                    placeholder="Parolni qaytaring"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-black py-3.5 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> O'zgartirilmoqda...</> : 'Parolni o\'zgartirish'}
                </button>

                <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                  className="w-full text-gray-500 hover:text-white text-sm py-2 transition-colors">
                  Boshqa email kiritish
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          © 2026 MakerPay.uz · Barcha huquqlar himoyalangan
        </p>
      </div>
    </div>
  );
}
