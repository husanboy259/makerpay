'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Crown, Users, Clock, CheckCircle, XCircle, Send,
  Loader2, MessageSquare, Phone, ExternalLink,
} from 'lucide-react';

const PLANS = [
  { key: 'start',      label: 'START',      color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',   price: 'Bepul' },
  { key: 'trial',      label: 'TRIAL',      color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  price: '2 oy bepul' },
  { key: 'basic',      label: 'BASIC',      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   price: '49 000 so\'m' },
  { key: 'standard',   label: 'STANDARD',   color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', price: '149 000 so\'m' },
  { key: 'business',   label: 'BUSINESS',   color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    price: '399 000 so\'m' },
  { key: 'enterprise', label: 'ENTERPRISE', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', price: '999 000 so\'m' },
];
const planMeta = Object.fromEntries(PLANS.map(p => [p.key, p]));

const subApi = {
  getStats:      ()              => api.get('/subscriptions/admin/stats'),
  getTrials:     (status?: string) => api.get('/subscriptions/admin/trials', { params: { status, limit: 50 } }),
  getAllSubs:     ()              => api.get('/subscriptions/admin/all?limit=50'),
  assign:        (data: any)     => api.post('/subscriptions/admin/assign', data),
  approve:       (id: string, invitationText?: string) => api.patch(`/subscriptions/admin/trials/${id}/approve`, { invitationText }),
  reject:        (id: string, adminNote: string) => api.patch(`/subscriptions/admin/trials/${id}/reject`, { adminNote }),
  invite:        (id: string, invitationText: string) => api.patch(`/subscriptions/admin/trials/${id}/invite`, { invitationText }),
  getOrders:     (status?: string) => api.get('/subscriptions/admin/orders', { params: { status, limit: 50 } }),
  confirmOrder:  (id: string, adminNote?: string) => api.patch(`/subscriptions/admin/orders/${id}/confirm`, { adminNote }),
  rejectOrder:   (id: string, adminNote: string) => api.patch(`/subscriptions/admin/orders/${id}/reject`, { adminNote }),
};

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('uz-UZ') : '—';
}

export default function SubscriptionsAdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'trials' | 'subscriptions' | 'orders'>('trials');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selected, setSelected] = useState<any>(null);
  const [inviteText, setInviteText] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [assignModal, setAssignModal] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({ plan: 'basic', months: 1, adminNote: '' });

  const { data: stats }  = useQuery({ queryKey: ['sub-stats'], queryFn: () => subApi.getStats() as any });
  const { data: trials, isLoading: loadingTrials } = useQuery({
    queryKey: ['trials', filterStatus],
    queryFn: () => subApi.getTrials(filterStatus === 'all' ? undefined : filterStatus) as any,
  });
  const { data: subs, isLoading: loadingSubs } = useQuery({
    queryKey: ['admin-subs'],
    queryFn: () => subApi.getAllSubs() as any,
    enabled: tab === 'subscriptions',
  });
  const [orderFilter, setOrderFilter] = useState('awaiting_confirmation');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderNote, setOrderNote] = useState('');
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders', orderFilter],
    queryFn: () => subApi.getOrders(orderFilter === 'all' ? undefined : orderFilter) as any,
    enabled: tab === 'orders',
  });

  const approveMutation = useMutation({
    mutationFn: () => subApi.approve(selected.id, inviteText || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trials', 'sub-stats'] }); setSelected(null); setInviteText(''); },
  });
  const rejectMutation = useMutation({
    mutationFn: () => subApi.reject(selected.id, rejectNote),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trials', 'sub-stats'] }); setSelected(null); setRejectNote(''); },
  });
  const inviteMutation = useMutation({
    mutationFn: () => subApi.invite(selected.id, inviteText),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trials'] }); setInviteText(''); },
  });
  const assignMutation = useMutation({
    mutationFn: () => subApi.assign({ merchantId: assignModal.merchantId, ...assignForm }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subs', 'sub-stats'] }); setAssignModal(null); },
  });
  const confirmOrderMutation = useMutation({
    mutationFn: () => subApi.confirmOrder(selectedOrder.id, orderNote || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); setSelectedOrder(null); setOrderNote(''); },
  });
  const rejectOrderMutation = useMutation({
    mutationFn: () => subApi.rejectOrder(selectedOrder.id, orderNote),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); setSelectedOrder(null); setOrderNote(''); },
  });

  const trialsList: any[] = (trials as any)?.data || [];
  const subsList: any[]   = (subs as any)?.data || [];
  const ordersList: any[] = (orders as any)?.data || [];

  const statusBadge = (s: string) => ({
    pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  }[s] || 'bg-gray-500/10 text-gray-400 border-gray-500/20');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Obunalar boshqaruvi</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Jami obunalar', value: (stats as any)?.totalSubscriptions ?? '—', icon: Crown, color: 'text-yellow-400' },
          { label: 'Kutilmoqda', value: (stats as any)?.trialApplications?.pending ?? '—', icon: Clock, color: 'text-yellow-400' },
          { label: 'Tasdiqlangan', value: (stats as any)?.trialApplications?.approved ?? '—', icon: CheckCircle, color: 'text-green-400' },
          { label: 'Rad etilgan', value: (stats as any)?.trialApplications?.rejected ?? '—', icon: XCircle, color: 'text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#111] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Rejalar bo'yicha</p>
        <div className="flex gap-3 flex-wrap">
          {PLANS.map(p => {
            const cnt = (stats as any)?.byPlan?.find((b: any) => b.plan === p.key)?.count || 0;
            return (
              <div key={p.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${p.border} ${p.bg}`}>
                <span className={`text-xs font-bold ${p.color}`}>{p.label}</span>
                <span className="text-white font-bold text-sm">{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'trials', label: 'Trial arizalar' },
          { key: 'orders', label: "To'lov buyurtmalari" },
          { key: 'subscriptions', label: 'Barcha obunalar' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === t.key ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TRIAL APPLICATIONS TAB */}
      {tab === 'trials' && (
        <div className="flex gap-5 h-[calc(100vh-420px)] min-h-[500px]">
          {/* List */}
          <div className="w-2/5 flex flex-col bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10 flex gap-1">
              {['all','pending','approved','rejected'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${filterStatus === s ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                  {s === 'all' ? 'Barchasi' : s === 'pending' ? 'Kutilmoqda' : s === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingTrials ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
              ) : trialsList.length === 0 ? (
                <div className="text-center py-12 text-gray-600 text-sm">Ariza topilmadi</div>
              ) : trialsList.map(t => (
                <button key={t.id} onClick={() => setSelected(t)}
                  className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${selected?.id === t.id ? 'bg-white/10 border-l-2 border-l-white' : ''}`}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{t.companyName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${statusBadge(t.status)}`}>
                      {t.status === 'pending' ? 'Kutilmoqda' : t.status === 'approved' ? 'Tasdiqlangan' : 'Rad etildi'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="w-3 h-3" />{t.phone}
                    {t.telegramUsername && <><span>·</span>@{t.telegramUsername}</>}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{formatDate(t.createdAt)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className="flex-1 bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-gray-600">
                <div className="text-center">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Ariza tanlang</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">{selected.companyName}</h2>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selected.phone}</span>
                        {selected.telegramUsername && <span>@{selected.telegramUsername}</span>}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs border font-semibold ${statusBadge(selected.status)}`}>
                      {selected.status === 'pending' ? 'Kutilmoqda' : selected.status === 'approved' ? 'Tasdiqlangan' : 'Rad etildi'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tavsif</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{selected.description}</p>
                  </div>
                  {selected.mvpUrl && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">MVP</p>
                      <a href={selected.mvpUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300">
                        Ko'rish <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                  {selected.invitationText && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-green-400 mb-1">Yuborilgan taklif</p>
                      <p className="text-sm text-gray-300">{selected.invitationText}</p>
                    </div>
                  )}
                  {selected.adminNote && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-400 mb-1">Admin izohi</p>
                      <p className="text-sm text-gray-300">{selected.adminNote}</p>
                    </div>
                  )}

                  {/* Invitation text */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Taklif xabari <span className="normal-case font-normal text-gray-600">(ixtiyoriy)</span>
                    </p>
                    <textarea value={inviteText} onChange={e => setInviteText(e.target.value)} rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/25 resize-none"
                      placeholder="Startupga taklif yozing... (investitsiya, hamkorlik va h.k.)" />
                  </div>

                  {selected.status === 'pending' && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Rad etish sababi</p>
                      <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/25 resize-none"
                        placeholder="Nima uchun rad etilmoqda..." />
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-white/10 flex gap-2">
                  {selected.status === 'pending' && (
                    <>
                      <button onClick={() => rejectMutation.mutate()} disabled={!rejectNote || rejectMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                        {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Rad etish
                      </button>
                      <button onClick={() => inviteMutation.mutate()} disabled={!inviteText || inviteMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                        {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Taklif yuborish
                      </button>
                      <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                        {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Tasdiqlash
                      </button>
                    </>
                  )}
                  {selected.status !== 'pending' && inviteText && (
                    <button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-1.5">
                      <MessageSquare className="w-4 h-4" /> Taklif yuborish
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SUBSCRIPTIONS TAB */}
      {tab === 'subscriptions' && (
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Merchant ID', 'Reja', 'So\'rovlar', 'Do\'konlar', 'Tugash', 'Amallar'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingSubs ? (
                <tr><td colSpan={6} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-500" /></td></tr>
              ) : subsList.map((s: any) => {
                const meta = planMeta[s.plan] || planMeta['start'];
                return (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{s.merchantId?.slice(0,8)}…</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.border} ${meta.bg} ${meta.color}`}>{meta.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-white">{s.requestLimit?.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-white">{s.storeLimit === 999999 ? 'Cheksiz' : s.storeLimit}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{s.expiresAt ? formatDate(s.expiresAt) : 'Muddatsiz'}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => { setAssignModal(s); setAssignForm({ plan: s.plan, months: 1, adminNote: '' }); }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white hover:border-white/20 transition-all">
                        Reja o'zgartirish
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['awaiting_confirmation', 'paid', 'rejected', 'all'].map(s => (
              <button key={s} onClick={() => setOrderFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${orderFilter === s ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>
                {s === 'awaiting_confirmation' ? 'Kutilmoqda' : s === 'paid' ? 'Tasdiqlangan' : s === 'rejected' ? 'Rad etilgan' : 'Barchasi'}
              </button>
            ))}
          </div>
          <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
            {loadingOrders ? (
              <div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-500" /></div>
            ) : ordersList.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">Buyurtmalar yo'q</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Tarif', 'Summa', "To'lovchi", 'Telefon', 'Sana', 'Status', 'Amallar'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordersList.map((o: any) => {
                    const pm = planMeta[o.plan] || planMeta['start'];
                    return (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${pm.border} ${pm.bg} ${pm.color}`}>{pm.label}</span>
                        </td>
                        <td className="px-4 py-3 text-white font-mono text-xs">{o.amount?.toLocaleString()} so'm</td>
                        <td className="px-4 py-3 text-gray-300 text-xs">{o.payerName || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{o.payerPhone || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(o.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                            o.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            o.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            o.status === 'awaiting_confirmation' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>{o.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {o.status === 'awaiting_confirmation' && (
                            <button onClick={() => { setSelectedOrder(o); setOrderNote(''); }}
                              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white transition-all">
                              Ko'rish
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Order confirm modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">To'lov buyurtmasi</h3>
              <button onClick={() => setSelectedOrder(null)} className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Tarif</span><span className={`font-bold ${planMeta[selectedOrder.plan]?.color}`}>{planMeta[selectedOrder.plan]?.label}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Summa</span><span className="text-white font-mono">{selectedOrder.amount?.toLocaleString()} so'm</span></div>
              <div className="flex justify-between"><span className="text-gray-500">To'lovchi</span><span className="text-white">{selectedOrder.payerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Telefon</span><span className="text-white">{selectedOrder.payerPhone}</span></div>
            </div>
            <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 resize-none"
              rows={2} placeholder="Izoh (ixtiyoriy)" />
            <div className="flex gap-3">
              <button onClick={() => rejectOrderMutation.mutate()} disabled={rejectOrderMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5">
                <XCircle className="w-4 h-4" /> Rad etish
              </button>
              <button onClick={() => confirmOrderMutation.mutate()} disabled={confirmOrderMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-all flex items-center justify-center gap-1.5">
                {confirmOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Reja berish</h3>
              <button onClick={() => setAssignModal(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reja</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLANS.map(p => (
                    <button key={p.key} onClick={() => setAssignForm({ ...assignForm, plan: p.key })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${assignForm.plan === p.key ? `${p.border} ${p.bg} ${p.color}` : 'border-white/10 text-gray-500 hover:text-gray-300'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {assignForm.plan !== 'start' && assignForm.plan !== 'enterprise' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Muddat (oy)</label>
                  <input type="number" min={1} max={24} value={assignForm.months}
                    onChange={e => setAssignForm({ ...assignForm, months: +e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/25" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Izoh</label>
                <input value={assignForm.adminNote} onChange={e => setAssignForm({ ...assignForm, adminNote: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/25"
                  placeholder="Nima uchun berildi..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setAssignModal(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white">Bekor</button>
                <button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
