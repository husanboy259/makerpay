'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketsApi } from '@/lib/api';
import { Store, CheckCircle, XCircle, Clock, Search, ExternalLink, Globe } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const sCls: Record<string, string> = {
  active:   'bg-green-500/10 text-green-400 border-green-500/20',
  pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};
const sLbl: Record<string, string> = {
  active:   'Faol',
  pending:  'Kutmoqda',
  rejected: 'Rad etildi',
};

function StatusBadge({ s }: { s: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${sCls[s] || 'bg-gray-500/10 text-gray-400'}`}>
      {sLbl[s] || s}
    </span>
  );
}

export default function AdminMarketsPage() {
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: raw, isLoading } = useQuery({
    queryKey: ['admin-markets'],
    queryFn: () => marketsApi.adminGetAll(),
    retry: false,
  });

  const markets: any[] = Array.isArray(raw) ? raw : [];

  const approve = useMutation({
    mutationFn: (id: string) => marketsApi.adminApprove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-markets'] }),
  });

  const reject = useMutation({
    mutationFn: (id: string) => marketsApi.adminReject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-markets'] }),
  });

  const filtered = markets.filter(m => {
    if (tab && m.status !== tab) return false;
    if (search && !m.name?.toLowerCase().includes(search.toLowerCase()) && !m.url?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all:      markets.length,
    pending:  markets.filter(m => m.status === 'pending').length,
    active:   markets.filter(m => m.status === 'active').length,
    rejected: markets.filter(m => m.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Do'konlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Merchant do'konlarini tasdiqlash va boshqarish</p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-xl">
            {counts.pending} kutmoqda
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '',         label: `Hammasi (${counts.all})` },
          { key: 'pending',  label: `Kutmoqda (${counts.pending})` },
          { key: 'active',   label: `Faol (${counts.active})` },
          { key: 'rejected', label: `Rad etildi (${counts.rejected})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${tab === key ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Do'kon nomi yoki URL bo'yicha qidirish..."
          className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Do'kon</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">URL</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Webhook</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Holat</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sana</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-600">Yuklanmoqda...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-600">Do'konlar yo'q</td></tr>
              ) : filtered.map((m: any) => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{m.name}</p>
                        {m.description && <p className="text-xs text-gray-500 mt-0.5 max-w-[180px] truncate">{m.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <a href={m.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-xs">
                      <Globe className="w-3 h-3" />
                      <span className="max-w-[140px] truncate">{m.url?.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-gray-500 max-w-[160px] truncate block">{m.webhookUrl || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge s={m.status || 'pending'} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-gray-500">{m.createdAt ? formatDate(m.createdAt) : '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {m.status !== 'active' && (
                        <button
                          onClick={() => approve.mutate(m.id)}
                          disabled={approve.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-semibold disabled:opacity-50">
                          <CheckCircle className="w-3 h-3" /> Tasdiqlash
                        </button>
                      )}
                      {m.status !== 'rejected' && (
                        <button
                          onClick={() => reject.mutate(m.id)}
                          disabled={reject.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-semibold disabled:opacity-50">
                          <XCircle className="w-3 h-3" /> Rad etish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Clock,        label: 'Kutmoqda',   value: counts.pending,  color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { icon: CheckCircle,  label: 'Tasdiqlandi', value: counts.active,   color: 'text-green-400',  bg: 'bg-green-500/10'  },
          { icon: XCircle,      label: 'Rad etildi', value: counts.rejected, color: 'text-red-400',    bg: 'bg-red-500/10'    },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-[#111] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
