'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providersApi } from '@/lib/api';
import { GitBranch, Plus, Trash2, TestTube, CheckCircle, XCircle, Zap } from 'lucide-react';

const PROVIDERS = [
  { key: 'tspay',    name: 'TSPay',    color: 'from-blue-600 to-blue-400',   desc: 'TSPay payment gateway' },
  { key: 'paynest',  name: 'Paynest',  color: 'from-purple-600 to-purple-400', desc: 'Paynest processing' },
  { key: 'tulovpay', name: 'TulovPay', color: 'from-orange-600 to-orange-400', desc: "O'zbekiston to'lov tizimi" },
  { key: 'mirpay',   name: 'MirPay',   color: 'from-red-600 to-red-400',     desc: 'MirPay gateway' },
  { key: 'qulaypay', name: 'QulayPay', color: 'from-cyan-600 to-cyan-400',   desc: 'Qulay va tez to`lovlar' },
];

const MOCK_CONNECTIONS: any[] = [
  { id: 'c1', providerName: 'tspay',    merchantId: 'TechShop UZ',   active: true,  createdAt: '2026-01-10T00:00:00Z' },
  { id: 'c2', providerName: 'paynest',  merchantId: 'Delivery Co',   active: true,  createdAt: '2026-02-05T00:00:00Z' },
  { id: 'c3', providerName: 'tulovpay', merchantId: 'Fashion Store', active: false, createdAt: '2026-03-01T00:00:00Z' },
  { id: 'c4', providerName: 'qulaypay', merchantId: 'FoodChain UZ',  active: true,  createdAt: '2026-03-15T00:00:00Z' },
];

export default function AdminProvidersPage() {
  const [showConnect, setShowConnect] = useState(false);
  const [form, setForm] = useState({ providerName: 'tspay', apiKey: '', secretKey: '' });
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});
  const qc = useQueryClient();

  const { data: raw } = useQuery({ queryKey: ['admin-providers'], queryFn: () => providersApi.getAll(), retry: false });
  const connections: any[] = (raw as any)?.data || (Array.isArray(raw) ? (raw as any[]) : MOCK_CONNECTIONS);

  const connect = useMutation({ mutationFn: (d: any) => providersApi.connect(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-providers'] }); setShowConnect(false); setForm({ providerName: 'tspay', apiKey: '', secretKey: '' }); } });
  const disconnect = useMutation({ mutationFn: (id: string) => providersApi.disconnect(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-providers'] }) });
  const testConn = async (id: string) => {
    setTestResults(p => ({ ...p, [id]: null }));
    try { await providersApi.test(id); setTestResults(p => ({ ...p, [id]: true })); } catch { setTestResults(p => ({ ...p, [id]: false })); }
  };

  const providerStats = PROVIDERS.map(p => ({ ...p, count: connections.filter(c => c.providerName === p.key).length, active: connections.filter(c => c.providerName === p.key && c.active).length }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">To&apos;lov ekotizimi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Provayder ulanishlarini boshqaring</p>
        </div>
        <button onClick={() => setShowConnect(true)} className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all">
          <Plus className="w-4 h-4" /> Ulash
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {providerStats.map(p => (
          <div key={p.key} className="bg-[#111] border border-white/10 rounded-2xl p-4 text-center">
            <div className={`w-12 h-12 bg-gradient-to-br ${p.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
              <span className="text-white font-bold text-lg">{p.name[0]}</span>
            </div>
            <div className="text-white font-bold text-sm">{p.name}</div>
            <div className="text-gray-500 text-xs mt-1">{p.count} merchant</div>
            <div className="text-green-400 text-xs">{p.active} faol</div>
          </div>
        ))}
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white">Barcha ulanishlar</h2>
        </div>
        <div className="divide-y divide-white/5">
          {connections.map(c => {
            const p = PROVIDERS.find(x => x.key === c.providerName);
            const tr = testResults[c.id];
            return (
              <div key={c.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 bg-gradient-to-br ${p?.color || 'from-gray-600 to-gray-400'} rounded-xl flex items-center justify-center`}>
                    <GitBranch className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{p?.name || c.providerName}</div>
                    <div className="text-gray-500 text-xs">{c.merchantId}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${c.active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                    {c.active ? <><Zap className="w-3 h-3" /> Faol</> : 'Nofaol'}
                  </span>
                  {tr === true && <CheckCircle className="w-4 h-4 text-green-400" />}
                  {tr === false && <XCircle className="w-4 h-4 text-red-400" />}
                  {tr === null && <span className="text-xs text-gray-500">Test...</span>}
                  <button onClick={() => testConn(c.id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Test">
                    <TestTube className="w-3.5 h-3.5 text-gray-300" />
                  </button>
                  <button onClick={() => disconnect.mutate(c.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors" title="O'chirish">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {connections.length === 0 && <div className="text-center py-12 text-gray-600"><GitBranch className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">Ulanish topilmadi</p></div>}
      </div>

      {showConnect && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowConnect(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Provayder ulash</h3>
              <button onClick={() => setShowConnect(false)} className="text-gray-500 hover:text-white">&#x2715;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Provayder</label>
                <select value={form.providerName} onChange={e => setForm(p => ({ ...p, providerName: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/25">
                  {PROVIDERS.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">API Kalit</label>
                <input value={form.apiKey} onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-white/25" placeholder="API kalit..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Secret Kalit</label>
                <input value={form.secretKey} onChange={e => setForm(p => ({ ...p, secretKey: e.target.value }))} type="password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-white/25" placeholder="Secret kalit..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowConnect(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white transition-colors">Bekor</button>
                <button onClick={() => connect.mutate(form)} disabled={!form.apiKey} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-40">Ulash</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
