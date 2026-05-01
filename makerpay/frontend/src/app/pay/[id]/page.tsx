'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Loader2, ShieldCheck, Lock, ExternalLink } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function AdBanner({ ad }: { ad: any }) {
  useEffect(() => {
    axios.post(`${API}/ads/${ad.id}/impression`).catch(() => {});
  }, [ad.id]);

  const handleClick = () => {
    axios.post(`${API}/ads/${ad.id}/click`).catch(() => {});
    if (ad.linkUrl) window.open(ad.linkUrl, '_blank', 'noopener');
  };

  return (
    <div onClick={ad.linkUrl ? handleClick : undefined}
      className={`overflow-hidden rounded-xl ${ad.linkUrl ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}>
      <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
    </div>
  );
}

function AdSlot({ ads, position, className }: { ads: any[]; position: string; className?: string }) {
  const slotAds = ads.filter(a => a.position === position);
  if (slotAds.length === 0) return null;
  return (
    <div className={className}>
      {slotAds.map(ad => <AdBanner key={ad.id} ad={ad} />)}
    </div>
  );
}

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<any>(null);
  const [ads, setAds]         = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/payments/${id}`).catch(() => null),
      axios.get(`${API}/ads/active`).catch(() => ({ data: [] })),
    ]).then(([payRes, adRes]) => {
      if (payRes) setPayment(payRes.data);
      else setError("To'lov topilmadi");
      setAds(Array.isArray(adRes?.data) ? adRes.data : []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center text-red-400">
        <p className="text-lg font-bold">{error}</p>
      </div>
    </div>
  );

  const amount = new Intl.NumberFormat('uz-UZ').format(payment?.amount || 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header ad */}
      <AdSlot ads={ads} position="header" className="w-full h-20" />

      {/* Top bar */}
      <div className="bg-[#111] border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="MakerPay" className="w-7 h-7 rounded-lg" onError={e => e.currentTarget.style.display='none'} />
          <span className="font-bold text-sm">MakerPay</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <Lock className="w-3.5 h-3.5" />
          <span>Xavfsiz to&apos;lov</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-6">
        {/* Left sidebar ad */}
        <AdSlot ads={ads} position="sidebar_left" className="w-48 shrink-0 space-y-3 hidden lg:block" />

        {/* Center: payment card */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
            {/* Payment header */}
            <div className="p-6 border-b border-white/10">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">To&apos;lov summasi</p>
              <p className="text-4xl font-black text-white">{amount} <span className="text-2xl text-gray-400">{payment?.currency || 'UZS'}</span></p>
              {payment?.description && (
                <p className="text-sm text-gray-400 mt-2">{payment.description}</p>
              )}
            </div>

            {/* Payment details */}
            <div className="p-6 space-y-3">
              {[
                ['To\'lov ID',   payment?.id?.slice(0,8) + '...'],
                ['Buyurtma',     payment?.externalOrderId || '—'],
                ['Provayder',    payment?.providerName || '—'],
                ['Status',       payment?.status || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-gray-500">{k}</span>
                  <span className="text-sm font-medium text-white">{v}</span>
                </div>
              ))}
            </div>

            {/* Middle ad slot */}
            <AdSlot ads={ads} position="middle" className="mx-6 mb-4 rounded-xl overflow-hidden h-20" />

            {/* Pay button (if paymentUrl exists) */}
            {payment?.paymentUrl && payment?.status === 'pending' && (
              <div className="px-6 pb-6">
                <a href={payment.paymentUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-black py-4 rounded-xl hover:bg-gray-100 transition-all text-base">
                  <ShieldCheck className="w-5 h-5" />
                  To&apos;lovni amalga oshirish
                  <ExternalLink className="w-4 h-4" />
                </a>
                <p className="text-center text-xs text-gray-600 mt-3">
                  To&apos;lov {payment?.providerName} orqali xavfsiz amalga oshiriladi
                </p>
              </div>
            )}

            {payment?.status === 'completed' && (
              <div className="px-6 pb-6">
                <div className="w-full py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-center font-bold flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> To&apos;lov muvaffaqiyatli amalga oshirildi
                </div>
              </div>
            )}
          </div>

          {/* Footer ad */}
          <AdSlot ads={ads} position="footer" className="mt-4 rounded-xl overflow-hidden h-16" />
        </div>

        {/* Right sidebar ad */}
        <AdSlot ads={ads} position="sidebar_right" className="w-48 shrink-0 space-y-3 hidden lg:block" />
      </div>

      <p className="text-center text-xs text-gray-700 pb-8">© 2026 MakerPay · Barcha huquqlar himoyalangan</p>
    </div>
  );
}
