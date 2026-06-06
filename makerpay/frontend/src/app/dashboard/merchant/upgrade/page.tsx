'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api, { merchantsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard, Copy, Check, CheckCircle, Loader2,
  ArrowLeft, Crown, Zap, AlertTriangle, Clock,
} from 'lucide-react';
import Link from 'next/link';

const PLAN_META: Record<string, { label: string; price: string; color: string; emoji: string; features: string[] }> = {
  basic:      { label: 'BASIC',      price: '8 000',   color: 'text-blue-400',   emoji: '🔵', features: ["1 000 so'rov/oy", "2 ta do'kon", "2 ta provayder", "2 GB storage"] },
  standard:   { label: 'STANDARD',   price: '25 000',  color: 'text-purple-400', emoji: '🟣', features: ["5 000 so'rov/oy", "5 ta do'kon", "Barcha provayderlar", "10 GB storage"] },
  business:   { label: 'BUSINESS',   price: '65 000',  color: 'text-red-400',    emoji: '🔴', features: ["15 000 so'rov/oy", "15 ta do'kon", "Priority support", "50 GB storage"] },
  enterprise: { label: 'ENTERPRISE', price: '999 000', color: 'text-yellow-400', emoji: '🟡', features: ["50 000+ so'rov/oy", "Cheksiz do'kon", "SLA kafolat", "Dedicated support"] },
};

export default function UpgradePage() {
  const params = useSearchParams();
  const router = useRouter();
  const plan = params.get('plan') || '';
  const meta = PLAN_META[plan];

  const [step, setStep] = useState<'payment' | 'proof' | 'done'>('payment');
  const [payInfo, setPayInfo] = useState<any>(null);
  const [orderId, setOrderId] = useState('');
  const [payer, setPayer] = useState({ name: '', phone: '' });
  const { data: merchant } = useQuery({ queryKey: ['merchant-me'], queryFn: () => merchantsApi.getMe() });
  useEffect(() => {
    if (merchant) {
      const m = merchant as any;
      setPayer(p => ({
        name: p.name || m.businessName || '',
        phone: p.phone || (m.contactPhone ? m.contactPhone.replace('+998', '').replace(/\D/g, '') : ''),
      }));
    }
  }, [merchant]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');

  useEffect(() => {
    api.get('/subscriptions/payment-info').then((r: any) => setPayInfo(r)).catch(() => {});
  }, []);

  const createOrder = useCallback(async () => {
    if (!plan || !meta) return;
    setCreating(true);
    try {
      const order: any = await api.post('/subscriptions/order', { plan });
      setOrderId(order.id);
      // If provider returned a payment URL → redirect immediately
      if (order.paymentUrl) {
        window.location.href = order.paymentUrl;
        return;
      }
    } catch (e: any) {
      setError(e?.message || 'Order yaratishda xatolik');
    } finally {
      setCreating(false);
    }
  }, [plan, meta]);

  useEffect(() => { createOrder(); }, [createOrder]);

  // Poll order status when on proof step
  useEffect(() => {
    if (step !== 'proof' || !orderId) return;
    const iv = setInterval(async () => {
      try {
        const s: any = await api.get(`/subscriptions/order/${orderId}/status`);
        setOrderStatus(s.status);
        if (s.status === 'paid') { setStep('done'); clearInterval(iv); }
      } catch {}
    }, 5000);
    return () => clearInterval(iv);
  }, [step, orderId]);

  const submitProof = async () => {
    if (!payer.name || !payer.phone) { setError("Ism va telefon raqamini kiriting"); return; }
    setError('');
    setLoading(true);
    try {
      await api.post(`/subscriptions/order/${orderId}/confirm-payment`, {
        payerName: payer.name,
        payerPhone: '+998' + payer.phone.replace(/\D/g, ''),
      });
      setStep('done');
    } catch (e: any) {
      setError(e?.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (!meta) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Noto'g'ri tarif. <Link href="/pricing" className="text-white underline">Tariflar</Link></p>
    </div>
  );

  if (step === 'done') return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      <h1 className="text-2xl font-black text-white mb-3">{meta.label} tarifi faollashtirildi!</h1>
      <p className="text-gray-400 mb-8">Tabriklaymiz! Yangi tarifingiz hozirdanoq ishlaydi.</p>
      <Link href="/dashboard/merchant"
        className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all">
        Dashboardga qaytish
      </Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/pricing" className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Tarifga o'tish</h1>
          <p className="text-sm text-gray-500">{meta.emoji} {meta.label} — {meta.price} so'm/oy</p>
        </div>
      </div>

      {/* Plan summary */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Crown className={`w-5 h-5 ${meta.color}`} />
          <span className={`font-black text-lg ${meta.color}`}>{meta.label}</span>
          <span className="ml-auto text-2xl font-black text-white">{meta.price} <span className="text-sm text-gray-400 font-normal">so'm/oy</span></span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {meta.features.map(f => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
              <span className="text-xs text-gray-400">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {step === 'proof' ? (
        /* Waiting for admin confirmation */
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <Clock className="w-10 h-10 text-yellow-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">To'lov tekshirilmoqda</h2>
          <p className="text-gray-400 text-sm">
            To'lov ma'lumotlaringiz admin tomonidan tekshirilmoqda.<br/>
            Odatda 1–2 soat ichida tasdiqlanadi.
          </p>
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400">
            Tasdiqlangandan so'ng sizga bildirishnoma yuboriladi
          </div>
          <button onClick={() => router.push('/dashboard/merchant')}
            className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-100 transition-all">
            Dashboardga qaytish
          </button>
        </div>
      ) : (
        /* Payment step */
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white mb-1">To'lov qilish</h2>
            <p className="text-xs text-gray-500">Quyidagi kartaga to'lov amalga oshiring</p>
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
              <button onClick={() => { navigator.clipboard.writeText((payInfo?.cardNumber || '').replace(/\s/g, '')); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
                {copied ? <><Check className="w-3 h-3 text-green-400" /> Nusxa!</> : <><Copy className="w-3 h-3" /> Nusxa</>}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">{payInfo?.cardHolder || 'MakerPay'}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 text-xs text-gray-400 leading-relaxed space-y-1">
            <p>1. Yuqoridagi kartaga <strong className="text-white">{meta.price} so'm</strong> o'tkazing</p>
            <p>2. Quyida to'lovchi ma'lumotlarini kiriting</p>
            <p>3. &quot;Tasdiqlash&quot; tugmasini bosing — admin tekshiradi</p>
          </div>

          {/* Payer info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To'lovchi ismi *</label>
              <input value={payer.name} onChange={e => setPayer({ ...payer, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                placeholder="Ism Familiya" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To'lovchi telefon *</label>
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

          <button
            onClick={submitProof}
            disabled={loading || creating || !orderId || !payer.name || payer.phone.replace(/\D/g, '').length !== 9}
            className="w-full py-4 rounded-xl bg-white text-black font-black text-sm hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading || creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {creating ? 'Tayyorlanmoqda...' : loading ? 'Yuborilmoqda...' : "To'lovni tasdiqlash"}
          </button>
        </div>
      )}
    </div>
  );
}
