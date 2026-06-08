'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';

const PROVIDERS = [
  { id: 'tspay', name: 'TSPay', logo: '🔵', desc: "Karta orqali to'lov", active: true },
  { id: 'inpay', name: 'inPAY', logo: '🟢', desc: 'Click · Payme · Karta', active: true },
  { id: 'smartpay', name: 'SmartPay', logo: '🟡', desc: "Barcha to'lov usullari", active: true },
];

function fmt(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
}

function ChooseContent() {
  const params = useSearchParams();
  const amount = Number(params.get('amount') || 0);
  const orderId = params.get('orderId') || '';
  const apiKey = params.get('key') || params.get('apiKey') || '';
  const callbackUrl = params.get('callbackUrl') || '';
  const successUrl = params.get('successUrl') || '';
  const description = params.get('description') || '';
  const BASE = 'https://makerpay.uz/api/v1';

  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!amount || !orderId || !apiKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-white font-bold">Noto'g'ri havola</p>
          <p className="text-gray-500 text-sm">amount, orderId va key parametrlari kerak</p>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    if (!selected || loading) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(BASE + '/payments/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
        body: JSON.stringify({ amount, orderId, providerName: selected, callbackUrl, successUrl, description }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Xatolik');
      if (data.paymentUrl) window.location.href = data.paymentUrl;
    } catch (e: any) {
      setError(e.message || 'Xatolik');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-black font-black text-lg">M</span>
          </div>
          <h1 className="text-white font-black text-2xl">To'lov usulini tanlang</h1>
          <p className="text-gray-500 text-sm">{description || 'Buyurtma: ' + orderId}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
          <p className="text-gray-500 text-sm mb-1">To'lov summasi</p>
          <p className="text-white text-3xl font-black">{fmt(amount)}</p>
        </div>

        <div className="space-y-3">
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => setSelected(p.id)}
              className={"w-full flex items-center gap-4 p-4 rounded-2xl border transition-all " +
                (selected === p.id ? 'border-white bg-white/10' : 'border-white/10 bg-black hover:border-white/30')}>
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">{p.logo}</div>
              <div className="flex-1 text-left">
                <p className="font-bold text-white">{p.name}</p>
                <p className="text-gray-500 text-sm">{p.desc}</p>
              </div>
              <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center " +
                (selected === p.id ? 'border-white bg-white' : 'border-gray-600')}>
                {selected === p.id && <div className="w-2 h-2 rounded-full bg-black" />}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button onClick={handlePay} disabled={!selected || loading}
          className="w-full py-4 bg-white text-black font-black text-base rounded-2xl hover:bg-gray-100 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> To'lov yaratilmoqda...</>
            : <><ArrowRight className="w-5 h-5" /> {fmt(amount)} to'lash</>}
        </button>

        <p className="text-center text-gray-600 text-xs">MakerPay orqali xavfsiz to'lov</p>
      </div>
    </div>
  );
}

export default function ChoosePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ChooseContent />
    </Suspense>
  );
}
