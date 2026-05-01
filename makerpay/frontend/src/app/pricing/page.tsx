'use client';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Zap, Crown } from 'lucide-react';

const PLANS = [
  {
    key: 'start', label: 'START', emoji: '🟢', price: 'Bepul', period: 'Doimiy',
    color: 'text-gray-300', border: 'border-white/10', bg: '',
    requests: '200', stores: '1', highlight: false,
    tag: null,
    features: ["Asosiy API access", "1 ta do'kon", "200 so'rov/oy", "Dashboard"],
    disabled: ["Advanced funksiyalar", "Ko'p provayder", "Priority support"],
    cta: 'Boshlash', ctaLink: '/register', ctaStyle: 'border border-white/20 text-white hover:bg-white/5',
  },
  {
    key: 'trial', label: 'TRIAL', emoji: '🧪', price: 'BEPUL', period: '2 oy',
    color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/5',
    requests: '15 000', stores: '10', highlight: false,
    tag: 'Startuplar uchun',
    features: ["Business darajasida access", "15 000 so'rov/oy", "10 ta do'kon", "Barcha provayderlar", "Priority support", "Admin ko'rib chiqadi"],
    disabled: [],
    cta: 'Ariza berish', ctaLink: '/apply-trial', ctaStyle: 'bg-green-500 hover:bg-green-400 text-black',
  },
  {
    key: 'basic', label: 'BASIC', emoji: '🔵', price: '49 000', period: 'so\'m/oy',
    color: 'text-blue-400', border: 'border-blue-500/20', bg: '',
    requests: '1 000', stores: '2', highlight: false,
    tag: null,
    features: ["API + Dashboard", "1 000 so'rov/oy", "2 ta do'kon", "2 ta provayder", "Webhook"],
    disabled: ["Kengaytirilgan analitika", "Priority support"],
    cta: 'Boshlash', ctaLink: '/register', ctaStyle: 'border border-blue-500/40 text-blue-400 hover:bg-blue-500/10',
  },
  {
    key: 'standard', label: 'STANDARD', emoji: '🟣', price: '149 000', period: 'so\'m/oy',
    color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/5',
    requests: '5 000', stores: '5', highlight: true,
    tag: 'Eng ommabop',
    features: ["5 000 so'rov/oy", "5 ta do'kon", "Barcha provayderlar", "Analitika", "Webhook + Logs", "Email support"],
    disabled: ["Priority support"],
    cta: 'Boshlash', ctaLink: '/register', ctaStyle: 'bg-purple-600 hover:bg-purple-500 text-white',
  },
  {
    key: 'business', label: 'BUSINESS', emoji: '🔴', price: '399 000', period: 'so\'m/oy',
    color: 'text-red-400', border: 'border-red-500/20', bg: '',
    requests: '15 000', stores: '15', highlight: false,
    tag: null,
    features: ["15 000 so'rov/oy", "15 ta do'kon", "Barcha provayderlar", "Yuqori tezlik", "Priority support", "Batafsil analitika"],
    disabled: [],
    cta: 'Boshlash', ctaLink: '/register', ctaStyle: 'border border-red-500/40 text-red-400 hover:bg-red-500/10',
  },
  {
    key: 'enterprise', label: 'ENTERPRISE', emoji: '🟡', price: '999 000', period: 'so\'m/oy',
    color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/5',
    requests: '50 000+', stores: 'Cheksiz', highlight: false,
    tag: 'Maksimal',
    features: ["50 000+ so'rov/oy", "Cheksiz do'kon", "Hammasi bir joyda", "Maxsus API endpointlar", "Individual yechimlar", "Dedicated support", "SLA kafolat"],
    disabled: [],
    cta: 'Bog\'lanish', ctaLink: '/apply-trial', ctaStyle: 'bg-yellow-500 hover:bg-yellow-400 text-black',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="MakerPay" className="w-8 h-8 rounded-xl" onError={e => e.currentTarget.style.display='none'} />
          <span className="font-black text-lg">MakerPay</span>
        </Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Kirish →</Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-400 text-xs font-semibold px-4 py-2 rounded-full mb-4">
            <Crown className="w-3.5 h-3.5" /> Tarif rejalari
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Biznesingizga mos <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">reja tanlang</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Kichik loyihadan tortib enterprise darajasigacha — har bir biznes uchun yechim.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {PLANS.map(plan => (
            <div key={plan.key}
              className={`relative rounded-3xl border p-7 flex flex-col transition-all hover:border-white/20 ${plan.border} ${plan.bg} ${plan.highlight ? 'ring-2 ring-purple-500/50' : ''}`}>
              {plan.tag && (
                <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold ${plan.highlight ? 'bg-purple-600 text-white' : `bg-white/10 ${plan.color}`}`}>
                  {plan.tag}
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{plan.emoji}</span>
                  <span className={`text-sm font-black tracking-widest ${plan.color}`}>{plan.label}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm mb-1">{plan.period}</span>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span><span className={`font-bold ${plan.color}`}>{plan.requests}</span> so'rov</span>
                  <span><span className={`font-bold ${plan.color}`}>{plan.stores}</span> do'kon</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle className={`w-4 h-4 shrink-0 ${plan.color}`} />
                    <span className="text-sm text-gray-300">{f}</span>
                  </div>
                ))}
                {plan.disabled.map(f => (
                  <div key={f} className="flex items-center gap-2.5 opacity-30">
                    <div className="w-4 h-4 shrink-0 rounded-full border border-gray-600 flex items-center justify-center">
                      <div className="w-1.5 h-0.5 bg-gray-600 rounded" />
                    </div>
                    <span className="text-sm text-gray-500">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link href={plan.ctaLink}
                className={`w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all flex items-center justify-center gap-2 ${plan.ctaStyle}`}>
                <Zap className="w-4 h-4" />
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Trial info box */}
        <div className="mt-12 bg-green-500/5 border border-green-500/20 rounded-3xl p-8 text-center">
          <div className="text-2xl mb-3">🧪</div>
          <h2 className="text-xl font-black text-white mb-2">Startup? 2 oy bepul Business access!</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Tasdiqlangan startuplarga Business tarifini 2 oy mutlaqo bepul beramiz. Ariza bering, admin ko'rib chiqadi va investitsiya imkoniyatlarini muhokama qilamiz.
          </p>
          <Link href="/apply-trial"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-black px-8 py-4 rounded-2xl transition-all text-sm">
            <Zap className="w-4 h-4" /> Trial uchun ariza berish
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-700 text-sm mt-10">
          © 2026 MakerPay.uz · Barcha narxlar so'mda, oylik to'lov
        </p>
      </div>
    </div>
  );
}
