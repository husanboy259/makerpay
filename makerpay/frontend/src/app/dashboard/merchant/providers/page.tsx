'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providersApi } from '@/lib/api';
import { statusLabel } from '@/lib/utils';
import {
  Plus, TestTube, Eye, EyeOff, CheckCircle,
  XCircle, Loader2, Zap, Shield, Globe,
} from 'lucide-react';

/* ── Provider brand registry ─────────────────────────── */
const PROVIDER_META: Record<string, {
  name: string; slug: string; color: string; bg: string; border: string;
  tagline: string; features: string[]; site: string; available: boolean;
  logo: React.ReactNode;
}> = {
  tspay: {
    name: 'TSPay', slug: 'tspay', site: 'tspay.uz', available: true,
    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30',
    tagline: "O'zbekistoning ishonchli to'lov platforma",
    features: ["To'lov sahifasi", 'Webhook', 'Refund', 'API'],
    logo: (
      <img src="/tspay-logo.svg" alt="TSPay" className="w-full h-full object-cover" />
    ),
  },
  qulaypay: {
    name: 'QulayPay', slug: 'qulaypay', site: 'qulaypay.uz', available: true,
    color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30',
    tagline: "Eng qulay to'lov tizimi — 15 daqiqada integratsiya",
    features: ['Click & Payme', 'Bank kartasi', 'API', 'Webhook'],
    logo: (
      <div className="w-full h-full bg-white flex items-center justify-center p-1">
        <img src="/qulaypay-logo.svg" alt="QulayPay" className="w-full h-full object-contain" />
      </div>
    ),
  },
  paynest: {
    name: 'Paynest', slug: 'paynest', site: 'paynest.uz', available: false,
    color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30',
    tagline: "Biznes uchun universal to'lov yechimi",
    features: ["Onlayn to'lov", 'Obuna tizimi', 'Dashboard', 'Webhook'],
    logo: (
      <img src="/paynest-logo.svg" alt="Paynest" className="w-full h-full object-cover" />
    ),
  },
  tulovpay: {
    name: 'TulovPay', slug: 'tulovpay', site: 'tulovpay.uz', available: false,
    color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30',
    tagline: "Tez va xavfsiz to'lov infratuzilmasi",
    features: ["Karta to'lovi", 'QR kod', 'API', 'Logs'],
    logo: (
      <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
        <span className="text-white font-black text-xl tracking-tight">TP</span>
      </div>
    ),
  },
  mirpay: {
    name: 'MirPay', slug: 'mirpay', site: 'mirpay.uz', available: false,
    color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30',
    tagline: "Ilovangiz uchun eng qulay to'lov tizimi",
    features: ["QR to'lov", 'Contactless', 'Obuna', 'Real-time hisobot'],
    logo: (
      <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center">
        <span className="text-white font-black text-xl tracking-tight">MP</span>
      </div>
    ),
  },
};

const PROVIDERS_LIST = Object.values(PROVIDER_META);

/* ── Connect modal ───────────────────────────────────── */
function ConnectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    providerName: 'tspay', apiKey: '', secretKey: '',
    providerMerchantId: '', webhookUrl: '', testMode: false, isDefault: false,
  });
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selected = PROVIDER_META[form.providerName];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await providersApi.connect(form);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Ulash xatoligi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10">
              {selected.logo}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Provayder ulash</h3>
              <p className="text-xs text-gray-500">{selected.site}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Provider select */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Provayder</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PROVIDERS_LIST.map((p) => (
                <button key={p.slug} type="button"
                  onClick={() => setForm({ ...form, providerName: p.slug })}
                  className={`rounded-xl border p-2.5 text-center transition-all ${
                    form.providerName === p.slug
                      ? `${p.border} ${p.bg}`
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}>
                  <div className="w-8 h-8 rounded-lg overflow-hidden mx-auto mb-1.5">
                    {p.logo}
                  </div>
                  <div className={`text-xs font-bold ${form.providerName === p.slug ? p.color : 'text-gray-400'}`}>{p.name}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">{selected.tagline}</p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">API Key *</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none text-sm font-mono transition-all"
              placeholder="api_key_xxxxx"
              value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} required />
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Secret Key *</label>
            <div className="relative">
              <input type={showSecret ? 'text' : 'password'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none text-sm font-mono transition-all"
                placeholder="secret_key_xxxxx"
                value={form.secretKey} onChange={(e) => setForm({ ...form, secretKey: e.target.value })} required />
              <button type="button" onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Merchant ID */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Merchant ID <span className="text-gray-600 normal-case font-normal">(ixtiyoriy)</span></label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none text-sm transition-all"
              placeholder="Provayder tomonidan berilgan ID"
              value={form.providerMerchantId} onChange={(e) => setForm({ ...form, providerMerchantId: e.target.value })} />
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Webhook URL</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none text-sm transition-all"
              placeholder="https://yoursite.uz/api/webhook"
              value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} />
            <p className="text-xs text-gray-600 mt-1">To'lov yangilanganda ushbu URL ga POST so'rov yuboriladi</p>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            {[
              { key: 'testMode', label: 'Test rejimi' },
              { key: 'isDefault', label: 'Asosiy provayder' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-10 h-5 rounded-full transition-colors relative ${(form as any)[key] ? 'bg-white' : 'bg-white/10'}`}
                  onClick={() => setForm({ ...form, [key]: !(form as any)[key] })}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${(form as any)[key] ? 'bg-black translate-x-5' : 'bg-white/40 translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{label}</span>
              </label>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm font-semibold">
              Bekor
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? 'Ulanmoqda...' : 'Ulash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export default function ProvidersPage() {
  const [showModal, setShowModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => providersApi.getAll(),
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => providersApi.disconnect(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['providers'] }),
  });

  const testConnection = async (id: string) => {
    setTestingId(id);
    try {
      const result: any = await providersApi.test(id);
      setTestResult({ ...testResult, [id]: result });
    } catch {
      setTestResult({ ...testResult, [id]: { success: false, message: 'Ulanish xatoligi' } });
    } finally {
      setTestingId(null);
    }
  };

  const providers = (data as any) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Provayderlar</h1>
          <p className="text-sm text-gray-500 mt-1">To'lov tizimlarini ulang va boshqaring</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" />
          Provayder ulash
        </button>
      </div>

      {/* Provider cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PROVIDERS_LIST.map((p) => {
          const connected = providers.find((mp: any) => mp.providerName === p.slug);
          return (
            <div key={p.slug}
              className={`bg-[#111] rounded-2xl border transition-all duration-300 p-5 ${
                connected ? `${p.border} ${p.bg}` : 'border-white/10 hover:border-white/20'
              }`}>
              {/* Brand header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
                  {p.logo}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{p.name}</span>
                    {connected?.isDefault && (
                      <span className="text-xs bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-full font-semibold">Asosiy</span>
                    )}
                    {connected?.testMode && (
                      <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-semibold">Test</span>
                    )}
                  </div>
                  <a href={`https://${p.site}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors">{p.site}</a>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{p.tagline}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.features.map(f => (
                  <span key={f} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{f}</span>
                ))}
              </div>

              {/* Status / actions */}
              {connected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-400">Ulangan</span>
                    <span className="text-xs text-gray-600">· {connected.totalTransactions} tranzaksiya</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {testResult[connected.id] && (
                      <span className={`text-xs font-medium flex items-center gap-1 ${testResult[connected.id].success ? 'text-green-400' : 'text-red-400'}`}>
                        {testResult[connected.id].success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {testResult[connected.id].message}
                      </span>
                    )}
                    <button onClick={() => testConnection(connected.id)} disabled={testingId === connected.id}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg transition-all">
                      {testingId === connected.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <TestTube className="w-3 h-3" />}
                      Test
                    </button>
                    <button onClick={() => disconnectMutation.mutate(connected.id)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 px-2.5 py-1.5 rounded-lg transition-all">
                      Uzish
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowModal(true)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-all hover:scale-[1.01] ${p.border} ${p.color} bg-transparent hover:${p.bg}`}>
                  + Ulash
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: 'Tezkor integratsiya', desc: 'Provayderingizni API kalit bilan bir necha daqiqada ulang.' },
          { icon: Shield, title: 'AES-256 shifrlash', desc: 'Barcha kalit va tokenlar shifrlab saqlanadi.' },
          { icon: Globe, title: 'Bir vaqtda ko\'p provayder', desc: 'Asosiy provayderingizni tanlang, qolganlar zaxira sifatida ishlaydi.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-[#111] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-1">{title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="bg-[#111] border border-white/10 rounded-2xl text-center py-12 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Yuklanmoqda...</p>
        </div>
      )}

      {showModal && (
        <ConnectModal
          onClose={() => setShowModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['providers'] })}
        />
      )}
    </div>
  );
}
