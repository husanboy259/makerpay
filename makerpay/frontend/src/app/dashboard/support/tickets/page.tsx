'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/lib/api';
import {
  MessageSquare, Send, Clock, CheckCircle, XCircle,
  AlertTriangle, Plus, Search, User, Zap, Loader2,
} from 'lucide-react';

type Status   = 'open' | 'in_progress' | 'resolved' | 'closed';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

const statusConfig: Record<string, { label: string; cls: string; icon: any }> = {
  open:        { label: 'Ochiq',        cls: 'bg-red-500/10 text-red-400 border-red-500/20',         icon: AlertTriangle },
  in_progress: { label: 'Jarayonda',   cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
  resolved:    { label: 'Hal qilindi', cls: 'bg-green-500/10 text-green-400 border-green-500/20',    icon: CheckCircle },
  closed:      { label: 'Yopildi',     cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20',       icon: XCircle },
};
const priorityConfig: Record<string, { label: string; cls: string }> = {
  low:    { label: 'Past',         cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  medium: { label: "O'rta",        cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  high:   { label: 'Yuqori',       cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  urgent: { label: 'Shoshilinch',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const FILTERS = [
  { key: 'all',         label: 'Barchasi' },
  { key: 'open',        label: 'Ochiq' },
  { key: 'in_progress', label: 'Jarayonda' },
  { key: 'resolved',    label: 'Hal qilindi' },
  { key: 'closed',      label: 'Yopildi' },
];

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [reply, setReply]           = useState('');
  const [showNew, setShowNew]       = useState(false);
  const [newForm, setNewForm]       = useState({ subject: '', description: '', priority: 'medium', category: '' });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets', filter],
    queryFn: () => supportApi.getTickets({ status: filter === 'all' ? undefined : filter, limit: 50 }),
  });

  const { data: selected, isLoading: loadingSelected } = useQuery({
    queryKey: ['ticket', selectedId],
    queryFn: () => supportApi.getTicket(selectedId!),
    enabled: !!selectedId,
  });

  const replyMutation = useMutation({
    mutationFn: (msg: string) => supportApi.reply(selectedId!, { message: msg }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedId] });
      setReply('');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => supportApi.updateStatus(selectedId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: () => supportApi.createTicket(newForm),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedId(res.id);
      setShowNew(false);
      setNewForm({ subject: '', description: '', priority: 'medium', category: '' });
    },
  });

  const tickets: any[] = (ticketsData as any)?.data || [];
  const filtered = tickets.filter(t => {
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ticketlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Merchant shikoyatlari va murojatlar</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all">
          <Plus className="w-4 h-4" /> Yangi ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(['open','in_progress','resolved','closed']).map(s => {
          const cnt = tickets.filter(t => t.status === s).length;
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <div key={s} className={`bg-[#111] border rounded-xl p-4 flex items-center gap-3 ${s === 'open' && cnt > 0 ? 'border-red-500/20' : 'border-white/10'}`}>
              <Icon className={`w-5 h-5 ${cfg.cls.split(' ')[1]}`} />
              <div>
                <div className="text-xl font-bold text-white">{cnt}</div>
                <div className="text-xs text-gray-500">{cfg.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Ticket list */}
        <div className="w-2/5 flex flex-col bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-3 border-b border-white/10 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25"
                placeholder="Qidirish..." />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === f.key ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Ticket topilmadi</p>
              </div>
            ) : filtered.map(t => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-4 border-b border-white/5 transition-colors hover:bg-white/5 ${selectedId === t.id ? 'bg-white/10 border-l-2 border-l-white' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">{t.ticketNumber}</span>
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold border ${priorityConfig[t.priority]?.cls}`}>
                    {priorityConfig[t.priority]?.label}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white mb-1 truncate">{t.subject}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${statusConfig[t.status]?.cls}`}>
                    {statusConfig[t.status]?.label}
                  </span>
                  <span className="text-xs text-gray-600">{formatTime(t.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 flex flex-col bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Ticket tanlang</p>
              </div>
            </div>
          ) : loadingSelected ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : selected ? (
            <>
              <div className="p-5 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{(selected as any).ticketNumber}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${priorityConfig[(selected as any).priority]?.cls}`}>
                        {priorityConfig[(selected as any).priority]?.label}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-white">{(selected as any).subject}</h2>
                    <span className="text-xs text-gray-500">{formatTime((selected as any).createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {(['open','in_progress','resolved','closed']).map(s => (
                      <button key={s} onClick={() => statusMutation.mutate(s)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${(selected as any).status === s ? statusConfig[s].cls : 'border-white/10 text-gray-600 hover:border-white/20 hover:text-gray-400'}`}>
                        {statusConfig[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {((selected as any).messages || []).map((msg: any) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.userId !== (selected as any).createdBy ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${msg.userId !== (selected as any).createdBy ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className={`max-w-[75%] flex flex-col gap-1 ${msg.userId !== (selected as any).createdBy ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.userId !== (selected as any).createdBy ? 'bg-white text-black rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                        {msg.message}
                      </div>
                      <span className="text-xs text-gray-600 px-1">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                  <input value={reply} onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), replyMutation.mutate(reply))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25"
                    placeholder="Javob yozing... (Enter — yuborish)" />
                  <button onClick={() => replyMutation.mutate(reply)} disabled={!reply.trim() || replyMutation.isPending}
                    className="w-11 h-11 bg-white text-black rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all disabled:opacity-40">
                    {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* New ticket modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Yangi ticket</h3>
              <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mavzu</label>
                <input value={newForm.subject} onChange={e => setNewForm({ ...newForm, subject: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/25"
                  placeholder="Ticket mavzusi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Muhimlik</label>
                <div className="flex gap-2">
                  {(['low','medium','high','urgent']).map(p => (
                    <button key={p} onClick={() => setNewForm({ ...newForm, priority: p })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${newForm.priority === p ? priorityConfig[p].cls : 'border-white/10 text-gray-600 hover:text-gray-400'}`}>
                      {priorityConfig[p].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tavsif</label>
                <textarea value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/25 resize-none"
                  placeholder="Muammo tavsifi..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white">Bekor</button>
                <button onClick={() => createMutation.mutate()} disabled={!newForm.subject || !newForm.description || createMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
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
