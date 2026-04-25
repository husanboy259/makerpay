'use client';
import { useState } from 'react';
import {
  MessageSquare, Send, Clock, CheckCircle, XCircle,
  AlertTriangle, Plus, Search, Filter, User, Zap,
} from 'lucide-react';

type Status = 'open' | 'in_progress' | 'resolved' | 'closed';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Message { id: number; from: 'merchant' | 'support'; text: string; time: string; }
interface Ticket {
  id: string; subject: string; merchantName: string;
  status: Status; priority: Priority; createdAt: string;
  messages: Message[];
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TKT-001', subject: "To'lov amalga oshmadi", merchantName: 'Ali Valiyev',
    status: 'open', priority: 'high', createdAt: '2026-04-20T10:00:00Z',
    messages: [
      { id: 1, from: 'merchant', text: "TSPay orqali to'lov qilmoqchi edim, lekin xato chiqyapti: 'provider_error'", time: '10:00' },
      { id: 2, from: 'support', text: "Assalomu alaykum! Muammoingiz bilan tanishib chiqdim. TSPay API kalitingizni tekshiring.", time: '10:15' },
    ],
  },
  {
    id: 'TKT-002', subject: 'Webhook kelmoqyapti lekin status yangilanmayapti', merchantName: 'Sardor Rahimov',
    status: 'in_progress', priority: 'medium', createdAt: '2026-04-20T09:00:00Z',
    messages: [
      { id: 1, from: 'merchant', text: "Webhook URL ga so'rov keladi lekin payment status pending qolib ketmoqda", time: '09:00' },
      { id: 2, from: 'support', text: "Webhook log larini tekshirib ko'ring. Qanday HTTP kodi qaytmoqda?", time: '09:30' },
    ],
  },
  {
    id: 'TKT-003', subject: "API kalit ishlamayapti", merchantName: 'Bobur Toshmatov',
    status: 'resolved', priority: 'low', createdAt: '2026-04-19T15:00:00Z',
    messages: [
      { id: 1, from: 'merchant', text: "Yangi API kalit yaratdim lekin 401 xato bermoqda", time: '15:00' },
      { id: 2, from: 'support', text: "Eski tokenni revoke qiling va yangi token bilan urinib ko'ring.", time: '15:30' },
      { id: 3, from: 'merchant', text: "Ishladi! Rahmat!", time: '15:45' },
    ],
  },
  {
    id: 'TKT-004', subject: "Merchant verification qaytarildi", merchantName: 'Jasur Mirzayev',
    status: 'open', priority: 'urgent', createdAt: '2026-04-20T08:00:00Z',
    messages: [
      { id: 1, from: 'merchant', text: "Verifikatsiya so'rovim rad etildi, sababi nima?", time: '08:00' },
    ],
  },
  {
    id: 'TKT-005', subject: "Refund amalga oshmayapti", merchantName: 'Dilnoza Karimova',
    status: 'closed', priority: 'medium', createdAt: '2026-04-18T12:00:00Z',
    messages: [
      { id: 1, from: 'merchant', text: "Mijozga refund qaytarib bera olmaymiz, provayder rad etmoqda", time: '12:00' },
      { id: 2, from: 'support', text: "Bu provayder uchun partial refund qo'llab quvvatlanmaydi.", time: '12:20' },
    ],
  },
];

const statusConfig: Record<Status, { label: string; cls: string; icon: any }> = {
  open:        { label: 'Ochiq',       cls: 'bg-red-500/10 text-red-400 border-red-500/20',     icon: AlertTriangle },
  in_progress: { label: 'Jarayonda',  cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
  resolved:    { label: 'Hal qilindi',cls: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle },
  closed:      { label: 'Yopildi',    cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20',   icon: XCircle },
};
const priorityConfig: Record<Priority, { label: string; cls: string }> = {
  low:    { label: 'Past',   cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  medium: { label: "O'rta",  cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  high:   { label: 'Yuqori', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  urgent: { label: 'Shoshilinch', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [selected, setSelected] = useState<Ticket>(MOCK_TICKETS[0]);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ subject: '', merchantName: '', priority: 'medium' as Priority, text: '' });

  const filtered = tickets.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.merchantName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sendReply = () => {
    if (!reply.trim()) return;
    const now = new Date();
    const msg: Message = { id: Date.now(), from: 'support', text: reply, time: `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}` };
    const updated = tickets.map(t => t.id === selected.id ? { ...t, messages: [...t.messages, msg] } : t);
    setTickets(updated);
    const updatedSelected = { ...selected, messages: [...selected.messages, msg] };
    setSelected(updatedSelected);
    setReply('');
  };

  const changeStatus = (status: Status) => {
    const updated = tickets.map(t => t.id === selected.id ? { ...t, status } : t);
    setTickets(updated);
    setSelected({ ...selected, status });
  };

  const createTicket = () => {
    if (!newForm.subject || !newForm.merchantName) return;
    const ticket: Ticket = {
      id: `TKT-00${tickets.length + 1}`,
      subject: newForm.subject,
      merchantName: newForm.merchantName,
      status: 'open',
      priority: newForm.priority,
      createdAt: new Date().toISOString(),
      messages: newForm.text ? [{ id: 1, from: 'merchant', text: newForm.text, time: new Date().toLocaleTimeString().slice(0,5) }] : [],
    };
    setTickets([ticket, ...tickets]);
    setSelected(ticket);
    setShowNew(false);
    setNewForm({ subject: '', merchantName: '', priority: 'medium', text: '' });
  };

  const FILTERS: { key: 'all' | Status; label: string }[] = [
    { key: 'all',        label: 'Barchasi' },
    { key: 'open',       label: 'Ochiq' },
    { key: 'in_progress',label: 'Jarayonda' },
    { key: 'resolved',   label: 'Hal qilindi' },
    { key: 'closed',     label: 'Yopildi' },
  ];

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

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {(['open','in_progress','resolved','closed'] as Status[]).map(s => {
          const cnt = tickets.filter(t => t.status === s).length;
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <div key={s} className={`bg-[#111] border rounded-xl p-4 flex items-center gap-3 ${cnt > 0 && s === 'open' ? 'border-red-500/20' : 'border-white/10'}`}>
              <Icon className={`w-5 h-5 ${statusConfig[s].cls.split(' ')[1]}`} />
              <div>
                <div className="text-xl font-bold text-white">{cnt}</div>
                <div className="text-xs text-gray-500">{cfg.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Left: ticket list */}
        <div className="w-2/5 flex flex-col bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          {/* Search + filter */}
          <div className="p-3 border-b border-white/10 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 transition-all"
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

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Ticket topilmadi</p>
              </div>
            ) : filtered.map(t => {
              const scfg = statusConfig[t.status];
              const pcfg = priorityConfig[t.priority];
              return (
                <button key={t.id} onClick={() => setSelected(t)}
                  className={`w-full text-left p-4 border-b border-white/5 transition-colors hover:bg-white/5 ${selected.id === t.id ? 'bg-white/10 border-l-2 border-l-white' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500">{t.id}</span>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold border ${pcfg.cls} ${t.priority === 'urgent' ? 'animate-pulse' : ''}`}>
                      {pcfg.label}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1 truncate">{t.subject}</div>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-gray-600" />
                    <span className="text-xs text-gray-500 truncate">{t.merchantName}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${scfg.cls}`}>
                      {scfg.label}
                    </span>
                    <span className="text-xs text-gray-600">{formatTime(t.createdAt)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: detail */}
        <div className="flex-1 flex flex-col bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-500">{selected.id}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${priorityConfig[selected.priority].cls}`}>
                    {priorityConfig[selected.priority].label}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white truncate">{selected.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{selected.merchantName}</span>
                  <span className="text-gray-700">·</span>
                  <span className="text-xs text-gray-600">{formatTime(selected.createdAt)}</span>
                </div>
              </div>
              {/* Status actions */}
              <div className="flex items-center gap-2 shrink-0">
                {(['open','in_progress','resolved','closed'] as Status[]).map(s => (
                  <button key={s} onClick={() => changeStatus(s)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selected.status === s ? `${statusConfig[s].cls}` : 'border-white/10 text-gray-600 hover:border-white/20 hover:text-gray-400'}`}>
                    {statusConfig[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selected.messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.from === 'support' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${msg.from === 'support' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                  {msg.from === 'support' ? 'S' : selected.merchantName[0]}
                </div>
                <div className={`max-w-[75%] ${msg.from === 'support' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.from === 'support' ? 'bg-white text-black rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                  <span className="text-xs text-gray-600 px-1">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Reply input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-3">
              <input value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendReply())}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 transition-all"
                placeholder="Javob yozing... (Enter — yuborish)" />
              <button onClick={sendReply} disabled={!reply.trim()}
                className="w-11 h-11 bg-white text-black rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all disabled:opacity-40">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New ticket modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Yangi ticket</h3>
              <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Merchant ismi</label>
                <input value={newForm.merchantName} onChange={e => setNewForm({ ...newForm, merchantName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/25 transition-all"
                  placeholder="Merchant to'liq ismi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Mavzu</label>
                <input value={newForm.subject} onChange={e => setNewForm({ ...newForm, subject: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/25 transition-all"
                  placeholder="Ticket mavzusi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Muhimlik</label>
                <div className="flex gap-2">
                  {(['low','medium','high','urgent'] as Priority[]).map(p => (
                    <button key={p} onClick={() => setNewForm({ ...newForm, priority: p })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${newForm.priority === p ? priorityConfig[p].cls : 'border-white/10 text-gray-600 hover:text-gray-400'}`}>
                      {priorityConfig[p].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Xabar</label>
                <textarea value={newForm.text} onChange={e => setNewForm({ ...newForm, text: e.target.value })} rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/25 transition-all resize-none"
                  placeholder="Muammo tavsifi..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white transition-colors">Bekor</button>
                <button onClick={createTicket} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" /> Yaratish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
