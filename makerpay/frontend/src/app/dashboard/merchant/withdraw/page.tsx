'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { merchantsApi } from '@/lib/api';
import { Loader2, Banknote, CheckCircle, XCircle, Clock, ArrowDownToLine } from 'lucide-react';

const MIN = 15000;

const statusCfg: Record<string, { label: string; cls: string; icon: any }> = {
  pending:   { label: 'Kutilmoqda', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
  completed: { label: 'O\'tkazildi',  cls: 'bg-green-500/10 text-green-400 border-green-500/20',   icon: CheckCircle },
  rejected:  { label: 'Rad etildi',  cls: 'bg-red-500/10 text-red-400 border-red-500/20',          icon: XCircle },
};

function fmt(n: number) { return new Intl.NumberFormat('uz-UZ').format(n); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function WithdrawPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    amount: '', bankName: '', bankAccount: '', cardNumber: '', cardHolder: '', merchantNote: '',
  });
  const [method, setMethod] = useState<'bank' | 'card'>('card');
  const [error, setError]   = useState('');

  const { data: merchant } = useQuery({
    queryKey: ['merchant-me'],
    queryFn: () => merchantsApi.getMe(),
  });

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['my-withdrawals'],
    queryFn: () => api.get('/withdrawals/my') as any,
  });

  const requestMutation = useMutation({
    mutationFn: () => api.post('/withdrawals/request', {
      amount: +form.amount,
      bankName:    method === 'bank' ? form.bankName    : undefined,
      bankAccount: method === 'bank' ? form.bankAccount : undefined,
      cardNumber:  method === 'card' ? form.cardNumber  : undefined,
      cardHolder:  method === 'card' ? form.cardHolder  : undefined,
      merchantNote: form.merchantNote || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-withdrawals', 'merchant-me'] });
      setForm({ amount: '', bankName: '', bankAccount: '', cardNumber: '', cardHolder: '', merchantNote: '' });
      setError('');
    },
    onError: (e: any) => setError(e?.message || e?.error || 'Xatolik yuz berdi'),
  });

  const balance = +(merchant as any)?.balance || 0;
  const list: any[] = Array.isArray(withdrawals) ? withdrawals : [];

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all placeholder-gray-600";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Balans yechish</h1>
        <p className="text-sm text-gray-500 mt-1">Minimal miqdor: {fmt(MIN)} UZS</p>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Joriy balans</p>
        <p className="text-4xl font-black text-white">{fmt(balance)} <span className="text-2xl text-gray-400">UZS</span></p>
        {balance < MIN && (
          <p className="text-xs text-yellow-400 mt-2">⚠️ Yechish uchun kamida {fmt(MIN)} UZS kerak</p>
        )}
      </div>

      {/* Withdraw form */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ArrowDownToLine className="w-4 h-4" /> Yechish so'rovi
        </h2>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{error}</div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Summa (UZS) *</label>
          <input type="number" className={inputCls} placeholder={`Minimal: ${fmt(MIN)}`}
            value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          {form.amount && +form.amount > balance && (
            <p className="text-xs text-red-400 mt-1">Balansdan oshib ketdi</p>
          )}
        </div>

        {/* Method */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">To'lov usuli</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'card', label: 'Karta', sub: 'Uzcard / Humo / Visa' },
              { key: 'bank', label: 'Bank hisob',  sub: 'Bank o\'tkazmasi' },
            ].map(m => (
              <button key={m.key} onClick={() => setMethod(m.key as any)}
                className={`p-3 rounded-xl border text-left transition-all ${method === m.key ? 'border-white/30 bg-white/10' : 'border-white/10 hover:border-white/20'}`}>
                <div className="text-sm font-bold text-white">{m.label}</div>
                <div className="text-xs text-gray-500">{m.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {method === 'card' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Karta raqami *</label>
              <input className={inputCls} placeholder="8600 0000 0000 0000"
                value={form.cardNumber} onChange={e => setForm({ ...form, cardNumber: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Karta egasi *</label>
              <input className={inputCls} placeholder="FAMILIYA ISM"
                value={form.cardHolder} onChange={e => setForm({ ...form, cardHolder: e.target.value.toUpperCase() })} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bank nomi *</label>
              <input className={inputCls} placeholder="Ipotekabank"
                value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hisob raqam *</label>
              <input className={inputCls} placeholder="20208000..."
                value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Izoh <span className="text-gray-600 normal-case font-normal">(ixtiyoriy)</span></label>
          <input className={inputCls} placeholder="Qo'shimcha ma'lumot..."
            value={form.merchantNote} onChange={e => setForm({ ...form, merchantNote: e.target.value })} />
        </div>

        <button
          disabled={
            !form.amount || +form.amount < MIN || +form.amount > balance ||
            (method === 'card' ? !form.cardNumber || !form.cardHolder : !form.bankName || !form.bankAccount) ||
            requestMutation.isPending
          }
          onClick={() => requestMutation.mutate()}
          className="w-full py-3.5 rounded-xl bg-white text-black font-black text-sm hover:bg-gray-100 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          {requestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
          {requestMutation.isPending ? 'Yuborilmoqda...' : `${form.amount ? fmt(+form.amount) : '0'} UZS yechish`}
        </button>
      </div>

      {/* History */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white">Yechish tarixi</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
        ) : list.length === 0 ? (
          <p className="text-center py-8 text-gray-600 text-sm">Hali so'rov yo'q</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Summa', 'Usul', 'Status', 'Sana'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((w: any) => {
                const cfg = statusCfg[w.status] || statusCfg['pending'];
                const Icon = cfg.icon;
                return (
                  <tr key={w.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-5 py-4 font-bold text-white">{fmt(w.amount)} UZS</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {w.cardNumber ? `💳 ****${w.cardNumber.slice(-4)}` : `🏦 ${w.bankName || '—'}`}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{fmtDate(w.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
