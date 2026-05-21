'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketsApi, providersApi } from '@/lib/api';
import {
  Plus, Store, Webhook, Globe, X, ExternalLink,
  Copy, Check, Trash2, AlertCircle, Clock, CheckCircle, XCircle,
  Image, Code2,
} from 'lucide-react';
import { providersApi } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.makerpay.uz/api/v1';

interface Market {
  id: string;
  name: string;
  url: string;
  webhookUrl: string;
  webhookUrl2?: string;
  logoUrl?: string;
  description?: string;
  status?: 'pending' | 'active' | 'rejected';
  createdAt: string;
  lastWebhookAt?: string;
  webhookStatus?: 'success' | 'failed' | 'pending' | null;
}

/* ── Market detail modal ── */
function MarketDetailModal({ market, onClose }: { market: Market; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const { data: keys } = useQuery({ queryKey: ['api-keys'], queryFn: () => providersApi.getApiKeys(), retry: false });
  const apiKey = (keys as any)?.[0]?.keyPrefix ? `${(keys as any)[0].keyPrefix}••••••••` : 'mpk_live_xxxx••••••••';

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000);
  };

  const fields = [
    { label: "Do'kon ID",   value: market.id,   key: 'id' },
    { label: 'API Base URL', value: API_BASE,    key: 'url' },
    { label: 'API Key',      value: apiKey,      key: 'key' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {market.logoUrl
              ? <img src={market.logoUrl} alt={market.name} className="w-10 h-10 rounded-xl object-cover" />
              : <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-black">{market.name[0]}</div>
            }
            <div>
              <h2 className="text-white font-bold">{market.name}</h2>
              <p className="text-gray-500 text-xs">Integratsiya ma'lumotlari</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.key} className="flex items-center gap-3 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">{f.label}</p>
                  <code className="text-sm text-white font-mono truncate block">{f.value}</code>
                </div>
                <button onClick={() => copy(f.value, f.key)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all shrink-0">
                  {copied === f.key ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>

          <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-white mb-3 flex items-center gap-2"><Code2 className="w-3.5 h-3.5" />So'rov namunasi</p>
            <pre className="text-xs text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap">{`POST ${API_BASE}/payments/create
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "amount": 50000,
  "currency": "UZS",
  "externalOrderId": "${market.id}",
  "description": "To'lov",
  "returnUrl": "${market.url}/success",
  "callbackUrl": "${market.webhookUrl || market.url + '/webhook'}"
}`}</pre>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white transition-colors">Yopish</button>
            <a href={`${market.url}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" /> Saytga o'tish
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddMarketModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ name: '', url: '', webhookUrl: '', webhookUrl2: '', logoUrl: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.url) {
      setErr("Do'kon nomi va URL majburiy");
      return;
    }
    setLoading(true);
    setErr('');
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Do&apos;kon qo&apos;shish</h2>
              <p className="text-gray-500 text-xs">Yangi market yarating</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Do&apos;kon nomi *</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none transition-colors text-sm"
              placeholder="Online Market UZ"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              <Globe className="w-3 h-3 inline mr-1" />Sayt URL *
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none transition-colors text-sm"
              placeholder="https://myshop.uz"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              <Image className="w-3 h-3 inline mr-1" />Logo URL (ixtiyoriy)
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none transition-colors text-sm"
              placeholder="https://myshop.uz/logo.png"
              value={form.logoUrl}
              onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
            />
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              <Webhook className="w-3 h-3 inline mr-1" />Webhook URL 1
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none transition-colors text-sm font-mono"
              placeholder="https://myshop.uz/webhook/payment"
              value={form.webhookUrl}
              onChange={e => setForm(f => ({ ...f, webhookUrl: e.target.value }))}
            />
            <p className="text-gray-600 text-xs mt-1">To'lov holati o'zgarganda shu URL ga POST yuboriladi</p>
          </div>

          {/* Webhook URL 2 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              <Webhook className="w-3 h-3 inline mr-1" />Webhook URL 2 <span className="text-amber-500 normal-case font-normal">(Premium)</span>
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none transition-colors text-sm font-mono"
              placeholder="https://backup.myshop.uz/webhook"
              value={form.webhookUrl2}
              onChange={e => setForm(f => ({ ...f, webhookUrl2: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tavsif</label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-white/30 focus:outline-none transition-colors resize-none text-sm"
              placeholder="Do'kon haqida qisqacha ma'lumot..."
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {err && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{err}</p>
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-xs text-yellow-400">
            Do'kon qo'shilgandan so'ng admin tasdiqlashi kerak. Tasdiqlangandan so'ng faollashadi.
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : <><Plus className="w-5 h-5" />Qo&apos;shish</>}
          </button>

          <button onClick={onClose}
            className="w-full py-3 rounded-xl border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all text-sm font-semibold">
            Bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ApprovalBadge({ status }: { status?: string }) {
  if (!status || status === 'active') return null;
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
      <Clock className="w-3 h-3" /> Admin tasdiqi kutilmoqda
    </span>
  );
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
      <XCircle className="w-3 h-3" /> Rad etildi
    </span>
  );
  return null;
}

function WebhookBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-xs text-gray-600">—</span>;
  const cfg: Record<string, string> = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    failed:  'bg-red-500/10 text-red-400 border-red-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  const labels: Record<string, string> = { success: '✓ Muvaffaq', failed: '✗ Xato', pending: '⟳ Kutmoqda' };
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}

export default function MarketsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [detailMarket, setDetailMarket] = useState<Market | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: () => marketsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (form: any) => marketsApi.create(form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['markets'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => marketsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['markets'] }),
  });

  const markets: Market[] = (data as any) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Do&apos;konlar</h1>
          <p className="text-sm text-gray-500 mt-1">Marketlaringizni boshqaring</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" />
          Do&apos;kon qo&apos;shish
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Jami do'konlar", value: markets.length },
          { label: 'Webhook muvaffaq', value: markets.filter(m => m.webhookStatus === 'success').length },
          { label: 'Webhook xato',    value: markets.filter(m => m.webhookStatus === 'failed').length },
        ].map((s, i) => (
          <div key={i} className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <p className="text-3xl font-black text-white">{s.value}</p>
            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Markets list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-white font-semibold text-lg mb-2">Hech qanday do&apos;kon yo&apos;q</p>
          <p className="text-gray-500 text-sm mb-6">Birinchi do&apos;koningizni qo&apos;shing</p>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-white text-black font-bold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-all">
            <Plus className="w-4 h-4" />
            Do&apos;kon qo&apos;shish
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {markets.map((market) => (
            <div key={market.id} className="bg-[#111] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 cursor-pointer" onClick={() => setDetailMarket(market)}>
                  {market.logoUrl
                    ? <img src={market.logoUrl} alt={market.name} className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/10" />
                    : <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-black font-black text-lg shrink-0">{market.name[0].toUpperCase()}</div>
                  }
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-bold text-base">{market.name}</h3>
                      <ApprovalBadge status={market.status} />
                      {market.status === 'active' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle className="w-3 h-3" /> Faol
                        </span>
                      )}
                    </div>
                    {market.description && (
                      <p className="text-gray-500 text-sm mt-0.5 truncate">{market.description}</p>
                    )}
                    {/* URLs */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        <span className="text-gray-400 text-xs font-mono truncate">{market.url}</span>
                        <CopyBtn text={market.url} />
                        <a href={market.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Webhook className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        <span className="text-gray-400 text-xs font-mono truncate">{market.webhookUrl}</span>
                        <CopyBtn text={market.webhookUrl} />
                        <WebhookBadge status={market.webhookStatus} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {market.lastWebhookAt && (
                    <span className="text-xs text-gray-600 hidden sm:block">
                      {new Date(market.lastWebhookAt).toLocaleDateString('uz-UZ')}
                    </span>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(market.id)}
                    className="p-2 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddMarketModal
          onClose={() => setShowAdd(false)}
          onSave={(form) => createMutation.mutateAsync(form)}
        />
      )}

      {detailMarket && (
        <MarketDetailModal market={detailMarket} onClose={() => setDetailMarket(null)} />
      )}
    </div>
  );
}
