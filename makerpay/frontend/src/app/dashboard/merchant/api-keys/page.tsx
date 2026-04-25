'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providersApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Copy, Trash2, Plus, Key, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ApiKeysPage() {
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => providersApi.getApiKeys(),
  });

  const createMutation = useMutation({
    mutationFn: () => providersApi.createApiKey({ name: keyName, environment }),
    onSuccess: (res: any) => {
      setNewKey(res.key);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => providersApi.revokeApiKey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const keys = (data as any) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Kalitlar</h1>
          <p className="text-sm text-gray-500 mt-1">MakerPay API ga ulanish uchun kalit yarating</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Yangi kalit
        </button>
      </div>

      {/* Info card */}
      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex gap-3">
        <Key className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-brand-900">API kalitdan foydalanish</div>
          <div className="text-sm text-brand-700 mt-1">
            So&apos;rovlarni Authorization header orqali yuboring:
          </div>
          <code className="block mt-2 bg-brand-100 rounded-xl px-3 py-2 text-xs font-mono text-brand-800">
            Authorization: Bearer mpk_live_xxxxxxxxxxxxxxxx
          </code>
          <div className="text-xs text-brand-600 mt-2">
            Base URL: <code>https://api.makerpay.uz/api/v1</code>
          </div>
        </div>
      </div>

      {/* Keys list */}
      <div className="card">
        <h2 className="text-base font-bold mb-5">Yaratilgan kalitlar</h2>
        {keys.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Key className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-500">API kalit yo&apos;q</p>
            <p className="text-sm mt-1">Birinchi API kalitingizni yarating</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((k: any) => (
              <div key={k.id} className={`flex items-center justify-between p-4 border rounded-xl ${k.isActive ? 'border-gray-100' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.environment === 'production' ? 'bg-green-100' : 'bg-amber-100'}`}>
                    <Key className={`w-4 h-4 ${k.environment === 'production' ? 'text-green-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{k.name}</span>
                      <span className={`badge ${k.environment === 'production' ? 'badge-green' : 'badge-yellow'}`}>
                        {k.environment === 'production' ? 'Production' : 'Sandbox'}
                      </span>
                      {!k.isActive && <span className="badge badge-gray">Bekor qilingan</span>}
                    </div>
                    <div className="font-mono text-xs text-gray-500 mt-0.5">{k.keyPrefix}••••••••</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Yaratildi: {formatDate(k.createdAt)} ·
                      {k.lastUsedAt ? ` So&apos;nggi foydalanish: ${formatDate(k.lastUsedAt)}` : ' Ishlatilmagan'}
                    </div>
                  </div>
                </div>
                {k.isActive && (
                  <button
                    onClick={() => revokeMutation.mutate(k.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Bekor qilish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold">Yangi API kalit</h3>
              <button onClick={() => { setShowModal(false); setNewKey(null); }} className="text-gray-400">✕</button>
            </div>
            {newKey ? (
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-800">Kalit faqat bir marta ko&apos;rsatiladi!</div>
                    <div className="text-sm text-amber-700 mt-1">Ushbu kalitni hozir nusxa oling. Keyinchalik ko&apos;rsatilmaydi.</div>
                  </div>
                </div>
                <div>
                  <label className="label">API Kalit</label>
                  <div className="flex gap-2">
                    <input className="input font-mono text-sm flex-1" value={newKey} readOnly />
                    <button
                      onClick={() => copyToClipboard(newKey)}
                      className={`btn-secondary ${copied ? '!text-green-600' : ''}`}
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(false); setNewKey(null); setKeyName(''); }}
                  className="btn-primary w-full"
                >
                  Tamom
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="label">Kalit nomi *</label>
                  <input className="input" placeholder="Masalan: Production API Key"
                    value={keyName} onChange={(e) => setKeyName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Muhit</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['production', 'sandbox'].map((env) => (
                      <button
                        key={env}
                        type="button"
                        onClick={() => setEnvironment(env)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          environment === env ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {env === 'production' ? '🟢 Production' : '🟡 Sandbox (Test)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Bekor</button>
                  <button
                    onClick={() => createMutation.mutate()}
                    disabled={!keyName || createMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    Yaratish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
