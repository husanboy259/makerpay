'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Loader2, ShieldCheck, Lock, ExternalLink, CheckCircle, Clock, X, CreditCard, Banknote } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function AdBanner({ ad }: { ad: any }) {
  useEffect(() => { axios.post(`${API}/ads/${ad.id}/impression`).catch(() => {}); }, [ad.id]);
  return (
    <div onClick={() => { axios.post(`${API}/ads/${ad.id}/click`).catch(() => {}); if (ad.linkUrl) window.open(ad.linkUrl, '_blank', 'noopener'); }}
      className={`overflow-hidden rounded-xl ${ad.linkUrl ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}>
      <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
    </div>
  );
}

function AdSlot({ ads, position, className }: { ads: any[]; position: string; className?: string }) {
  const slotAds = ads.filter(a => a.position === position);
  if (!slotAds.length) return null;
  return <div className={className}>{slotAds.map(ad => <AdBanner key={ad.id} ad={ad} />)}</div>;
}

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<any>(null);
  const [ads, setAds]         = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Modal state
  const [showModal, setShowModal]       = useState(false);
  const [mode, setMode]                 = useState<'choose' | 'auto' | 'manual'>('choose');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [confirming, setConfirming]     = useState(false);
  const [confirmed, setConfirmed]       = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const fetchPayment = useCallback(async () => {
    const res = await axios.get(`${API}/payments/public/${id}`).catch(() => null);
    if (res?.data) setPayment(res.data);
    else setError("To'lov topilmadi");
  }, [id]);

  useEffect(() => {
    Promise.all([
      fetchPayment(),
      axios.get(`${API}/ads/active`).catch(() => ({ data: [] })),
    ]).then(([, adRes]) => {
      setAds(Array.isArray(adRes?.data) ? adRes.data : []);
    }).finally(() => setLoading(false));
  }, [fetchPayment]);

  // Poll every 5s when modal is open and payment is pending
  useEffect(() => {
    if (!showModal || !payment || payment.status === 'completed') return;
    const t = setInterval(async () => {
      const res = await axios.get(`${API}/payments/public/${id}`).catch(() => null);
      if (res?.data?.status === 'completed') {
        setPayment(res.data);
        setConfirmed(true);
        clearInterval(t);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [showModal, payment, id]);

  const handleManualConfirm = async () => {
    setConfirming(true);
    setConfirmError('');
    try {
      await axios.post(`${API}/payments/public/${id}/confirm`, { customerName, customerPhone });
      setConfirmed(true);
      await fetchPayment();
    } catch (e: any) {
      setConfirmError(e?.response?.data?.message || "Xato yuz berdi");
    } finally {
      setConfirming(false);
    }
  };

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
  const isCompleted = payment?.status === 'completed';
  const isProcessing = payment?.status === 'processing';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AdSlot ads={ads} position="header" className="w-full h-20" />

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

      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-6">
        <AdSlot ads={ads} position="sidebar_left" className="w-48 shrink-0 space-y-3 hidden lg:block" />

        <div className="flex-1 min-w-0">
          <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">To&apos;lov summasi</p>
              <p className="text-4xl font-black text-white">{amount} <span className="text-2xl text-gray-400">{payment?.currency || 'UZS'}</span></p>
              {payment?.description && <p className="text-sm text-gray-400 mt-2">{payment.description}</p>}
            </div>

            <div className="p-6 space-y-3">
              {[
                ["To'lov ID",  payment?.id?.slice(0,8) + '...'],
                ['Buyurtma',   payment?.externalOrderId || '—'],
                ['Provayder',  payment?.providerName    || '—'],
                ['Status',     payment?.status          || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-gray-500">{k}</span>
                  <span className="text-sm font-medium text-white">{v}</span>
                </div>
              ))}
            </div>

            <AdSlot ads={ads} position="middle" className="mx-6 mb-4 rounded-xl overflow-hidden h-20" />

            <div className="px-6 pb-6">
              {isCompleted ? (
                <div className="w-full py-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-center font-bold flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> To&apos;lov muvaffaqiyatli amalga oshirildi
                </div>
              ) : isProcessing ? (
                <div className="w-full py-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-center font-bold flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" /> To&apos;lov tasdiqlanmoqda...
                </div>
              ) : (
                <button
                  onClick={() => { setMode('choose'); setShowModal(true); }}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black font-black py-4 rounded-xl hover:bg-gray-100 transition-all text-base">
                  <CreditCard className="w-5 h-5" />
                  To&apos;lovni amalga oshirish
                </button>
              )}
            </div>
          </div>

          <AdSlot ads={ads} position="footer" className="mt-4 rounded-xl overflow-hidden h-16" />
        </div>

        <AdSlot ads={ads} position="sidebar_right" className="w-48 shrink-0 space-y-3 hidden lg:block" />
      </div>

      <p className="text-center text-xs text-gray-700 pb-8">© 2026 MakerPay · Barcha huquqlar himoyalangan</p>

      {/* ── Payment Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { if (mode === 'choose') setShowModal(false); }}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">To&apos;lov</h3>
                <p className="text-xs text-gray-500">{amount} {payment?.currency}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Success state */}
              {confirmed || isCompleted ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-white mb-2">Tasdiqlandi!</h4>
                  <p className="text-sm text-gray-400 mb-6">
                    {isCompleted ? "To'lov muvaffaqiyatli yakunlandi." : "To'lov merchantga yuborildi. Tez orada tasdiqlanadi."}
                  </p>
                  <button onClick={() => setShowModal(false)}
                    className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-100 transition-all">
                    Yopish
                  </button>
                </div>
              ) : mode === 'choose' ? (
                /* Choose payment mode */
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 text-center mb-4">To&apos;lov usulini tanlang</p>

                  {payment?.paymentUrl && (
                    <button
                      onClick={() => { setMode('auto'); window.open(payment.paymentUrl, '_blank', 'noopener'); }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-left">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <ExternalLink className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Provayder orqali</div>
                        <div className="text-xs text-gray-500">{payment?.providerName} — avtomatik tasdiqlash</div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => setMode('manual')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-left">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Qo&apos;lda to&apos;lov</div>
                      <div className="text-xs text-gray-500">Bank o&apos;tkazma, naqd yoki boshqa usul</div>
                    </div>
                  </button>
                </div>
              ) : mode === 'auto' ? (
                /* Auto mode - waiting for webhook */
                <div className="text-center py-4 space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-white mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Provayder sahifasi ochildi</h4>
                    <p className="text-xs text-gray-500 mt-1">To&apos;lov amalga oshgach avtomatik tasdiqlanadi</p>
                  </div>
                  <div className="text-xs text-gray-600">To&apos;lov holati tekshirilmoqda...</div>
                  <button onClick={() => setMode('choose')} className="text-xs text-gray-500 hover:text-white transition-colors">
                    ← Orqaga
                  </button>
                </div>
              ) : (
                /* Manual mode */
                <div className="space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-300">
                    To&apos;lov amalga oshirgandan so&apos;ng quyidagi tugmani bosing. Merchant to&apos;lovni tekshiradi.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Ismingiz</label>
                    <input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Ism Familiya"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Telefon</label>
                    <input
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all" />
                  </div>

                  {confirmError && (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{confirmError}</div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setMode('choose')} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white transition-colors">
                      Orqaga
                    </button>
                    <button
                      onClick={handleManualConfirm}
                      disabled={confirming || !customerName}
                      className="flex-1 py-3 rounded-xl bg-green-500 text-black text-sm font-bold hover:bg-green-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {confirming ? 'Yuborilmoqda...' : "Men to'ladim"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
