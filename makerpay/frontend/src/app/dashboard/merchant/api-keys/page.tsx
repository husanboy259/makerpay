'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providersApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Copy, Trash2, Plus, Key, CheckCircle, AlertTriangle, Globe, Server, Shield, Loader2 } from 'lucide-react';

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all placeholder-gray-600";

const EMPTY_FORM = {
  name: '', environment: 'production', keyType: 'secret',
  allowedDomains: '', allowedIps: '', rateLimitPerMin: 60,
};

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey]       = useState<string | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [copied, setCopied]       = useState(false);

  const { data } = useQuery({ queryKey: ['api-keys'], queryFn: () => providersApi.getApiKeys() });

  const createMutation = useMutation({
    mutationFn: () => providersApi.createApiKey({
      name:            form.name,
      environment:     form.environment,
      keyType:         form.keyType,
      allowedDomains:  form.allowedDomains ? form.allowedDomains.split(',').map(s => s.trim()).filter(Boolean) : [],
      allowedIps:      form.allowedIps     ? form.allowedIps.split(',').map(s => s.trim()).filter(Boolean)     : [],
      rateLimitPerMin: form.rateLimitPerMin,
    }),
    onSuccess: (res: any) => { setNewKey(res.key); qc.invalidateQueries({ queryKey: ['api-keys'] }); },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => providersApi.revokeApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const keys = (data as any) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Kalitlar</h1>
          <p className="text-sm text-gray-500 mt-1">Backend va frontend integratsiya uchun kalitlar</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_FORM }); setNewKey(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all">
          <Plus className="w-4 h-4" /> Yangi kalit
        </button>
      </div>

      {/* Key type info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white mb-1">Secret kalit <code className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">mpk_live_xxx</code></div>
            <p className="text-xs text-gray-500">Faqat serverda ishlating. Domain/IP cheklov yo'q. Hech qachon frontendda ishlatmang.</p>
          </div>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white mb-1">Publishable kalit <code className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">mpk_pub_live_xxx</code></div>
            <p className="text-xs text-gray-500">Frontend (browser) uchun. Domain + IP himoya bilan xavfsiz.</p>
          </div>
        </div>
      </div>

      {/* Keys table */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Nomi', 'Kalit', 'Turi', 'Muhit', 'Domain/IP', 'Yaratilgan', 'Amallar'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-600 text-sm">
                <Key className="w-8 h-8 mx-auto mb-2 opacity-20" />
                Hali kalit yo'q
              </td></tr>
            ) : keys.map((k: any) => (
              <tr key={k.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-5 py-4 font-semibold text-white">{k.name}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-gray-400 font-mono bg-white/5 px-2 py-1 rounded-lg">{k.keyPrefix}••••••••</code>
                    <button onClick={() => copy(k.keyPrefix)} className="text-gray-600 hover:text-white transition-colors">
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {k.keyType === 'publishable'
                    ? <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Frontend</span>
                    : <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Backend</span>
                  }
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${k.environment === 'production' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                    {k.environment === 'production' ? 'Live' : 'Test'}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">
                  {k.allowedDomains?.length > 0
                    ? <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{k.allowedDomains.join(', ')}</span>
                    : <span className="text-gray-700">Cheksiz</span>
                  }
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">{formatDate(k.createdAt)}</td>
                <td className="px-5 py-4">
                  <button onClick={() => { if (confirm('O\'chirish?')) revokeMutation.mutate(k.id); }}
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New key shown once */}
      {newKey && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white mb-1">Kalit faqat bir marta ko'rinadi — hozir nusxa oling!</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="text-sm font-mono text-green-400 bg-black/40 px-3 py-2 rounded-xl flex-1 break-all">{newKey}</code>
                <button onClick={() => copy(newKey)}
                  className="p-2.5 rounded-xl bg-white text-black hover:bg-gray-100 transition-all shrink-0">
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Yangi API kalit</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nomi *</label>
                <input className={inputCls} placeholder="Masalan: Production Backend" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              {/* Key type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Kalit turi *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setForm({ ...form, keyType: 'secret' })}
                    className={`p-3 rounded-xl border text-left transition-all ${form.keyType === 'secret' ? 'border-blue-500/40 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}>
                    <Server className={`w-4 h-4 mb-1 ${form.keyType === 'secret' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <div className={`text-sm font-bold ${form.keyType === 'secret' ? 'text-blue-400' : 'text-gray-300'}`}>Secret</div>
                    <div className="text-xs text-gray-600">Backend server</div>
                  </button>
                  <button onClick={() => setForm({ ...form, keyType: 'publishable' })}
                    className={`p-3 rounded-xl border text-left transition-all ${form.keyType === 'publishable' ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 hover:border-white/20'}`}>
                    <Globe className={`w-4 h-4 mb-1 ${form.keyType === 'publishable' ? 'text-green-400' : 'text-gray-500'}`} />
                    <div className={`text-sm font-bold ${form.keyType === 'publishable' ? 'text-green-400' : 'text-gray-300'}`}>Publishable</div>
                    <div className="text-xs text-gray-600">Frontend / Browser</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Muhit</label>
                <select className={inputCls} value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}>
                  <option value="production">Live (Production)</option>
                  <option value="sandbox">Test (Sandbox)</option>
                </select>
              </div>

              {/* Frontend-only fields */}
              {form.keyType === 'publishable' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Ruxsat berilgan domenlar
                    </label>
                    <input className={inputCls} placeholder="yoursite.uz, app.yoursite.uz"
                      value={form.allowedDomains}
                      onChange={e => setForm({ ...form, allowedDomains: e.target.value })} />
                    <p className="text-xs text-gray-600 mt-1">Vergul bilan ajrating. Bo'sh = hamma domen</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Ruxsat berilgan IP manzillar
                    </label>
                    <input className={inputCls} placeholder="192.168.1.0/24, 85.132.10.5"
                      value={form.allowedIps}
                      onChange={e => setForm({ ...form, allowedIps: e.target.value })} />
                    <p className="text-xs text-gray-600 mt-1">CIDR range ham qabul qilinadi. Bo'sh = hamma IP</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Minutiga so'rovlar limiti
                    </label>
                    <input type="number" min={10} max={1000} className={inputCls}
                      value={form.rateLimitPerMin}
                      onChange={e => setForm({ ...form, rateLimitPerMin: +e.target.value })} />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white">
                  Bekor
                </button>
                <button onClick={() => { createMutation.mutate(); setShowModal(false); }}
                  disabled={!form.name || createMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  Yaratish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
