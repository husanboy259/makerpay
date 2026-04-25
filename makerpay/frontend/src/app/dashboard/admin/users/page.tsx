'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatDate, formatAmount } from '@/lib/utils';
import {
  Users, Search, ShieldBan, ShieldCheck, Eye, CreditCard,
  Mail, Phone, Globe, Clock, AlertCircle, CheckCircle2, Lock,
} from 'lucide-react';

const ROLES = [
  { value: '',        label: 'Barchasi' },
  { value: 'admin',   label: 'Admin'    },
  { value: 'manager', label: 'Menejer'  },
  { value: 'support', label: 'Support'  },
  { value: 'user',    label: 'Merchant' },
];
const MOCK: any[] = [
  { id: 'u1', fullName: "Abdulaziz Xo'jayev", email: 'admin@makerpay.uz',   phone: '+998901000001', role: 'admin',   isActive: true,  emailVerified: true,  createdAt: '2025-01-01T00:00:00Z', lastLoginAt: '2026-04-20T10:00:00Z', lastLoginIp: '185.22.10.1',  failedLoginCount: 0 },
  { id: 'u2', fullName: 'Jasur Mirzayev',      email: 'manager@makerpay.uz', phone: '+998901000002', role: 'manager', isActive: true,  emailVerified: true,  createdAt: '2025-06-01T00:00:00Z', lastLoginAt: '2026-04-19T08:00:00Z', lastLoginIp: '185.22.10.2',  failedLoginCount: 0 },
  { id: 'u3', fullName: 'Malika Ergasheva',    email: 'support@makerpay.uz', phone: '+998901000003', role: 'support', isActive: true,  emailVerified: false, createdAt: '2025-08-01T00:00:00Z', lastLoginAt: '2026-04-18T14:00:00Z', lastLoginIp: '91.185.10.3',  failedLoginCount: 0 },
  { id: 'u4', fullName: 'Ali Valiyev',          email: 'ali@techshop.uz',     phone: '+998901000004', role: 'user',    isActive: true,  emailVerified: true,  createdAt: '2026-01-15T00:00:00Z', lastLoginAt: '2026-04-21T09:00:00Z', lastLoginIp: '213.230.10.4', failedLoginCount: 0 },
  { id: 'u5', fullName: 'Sardor Rahimov',       email: 'sardor@market.uz',    phone: '+998901000005', role: 'user',    isActive: false, emailVerified: true,  createdAt: '2026-02-20T00:00:00Z', lastLoginAt: '2026-03-10T11:00:00Z', lastLoginIp: '91.185.10.5',  failedLoginCount: 5 },
];
const roleCls: Record<string, string> = {
  admin:   'bg-red-500/10 text-red-400 border-red-500/20',
  manager: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  support: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  user:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
};
const roleLbl: Record<string, string> = { admin: 'Admin', manager: 'Menejer', support: 'Support', user: 'Merchant' };

function Avatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${s} bg-white rounded-full flex items-center justify-center text-black font-bold shrink-0`}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
}

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [logsTab, setLogsTab] = useState<'profile' | 'logs'>('profile');
  const qc = useQueryClient();

  const { data: raw } = useQuery({ queryKey: ['admin-users'], queryFn: () => adminApi.getUsers(), retry: false });
  const users: any[] = (raw as any)?.data || (Array.isArray(raw) ? (raw as any[]) : MOCK);

  const { data: logsRaw } = useQuery({
    queryKey: ['admin-user-logs', selected?.id],
    queryFn: () => adminApi.getUserLogs(selected.id),
    enabled: !!selected && logsTab === 'logs',
    retry: false,
  });
  const logs: any[] = (logsRaw as any)?.payments || [];

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.updateUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const ban = useMutation({
    mutationFn: (id: string) => adminApi.banUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setSelected(null); },
  });
  const unban = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setSelected(null); },
  });

  const filtered = users.filter(u =>
    (!roleFilter || u.role === roleFilter) &&
    (!search || u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Foydalanuvchilar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Profil, rol va ban boshqaruvi</p>
      </div>

      {/* Role counts */}
      <div className="grid grid-cols-4 gap-4">
        {ROLES.filter(r => r.value).map(r => (
          <div key={r.value} className="bg-[#111] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border ${roleCls[r.value]}`}>
              {r.label[0]}
            </div>
            <div>
              <div className="text-xl font-bold text-white">{users.filter(u => u.role === r.value).length}</div>
              <div className="text-xs text-gray-500">{r.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {ROLES.map(r => (
              <button key={r.value} onClick={() => setRoleFilter(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${roleFilter === r.value ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism yoki email..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-white/20" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Foydalanuvchi', 'Email / Telefon', 'Rol', 'Status', "Oxirgi kirish", 'Amal'].map(h => (
                  <th key={h} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} onClick={() => { setSelected(u); setLogsTab('profile'); }} className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!u.isActive ? 'opacity-60' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.fullName} size="sm" />
                      <div>
                        <div className="text-white font-medium text-sm">{u.fullName}</div>
                        <div className="text-gray-600 text-xs font-mono">{u.id?.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-300 text-xs flex items-center gap-1">
                      <Mail className="w-3 h-3" />{u.email}
                    </div>
                    {u.phone && <div className="text-gray-500 text-xs flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{u.phone}</div>}
                  </td>
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <select value={u.role} onChange={e => updateRole.mutate({ id: u.id, role: e.target.value })}
                      className={`bg-transparent border rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none ${roleCls[u.role]}`}>
                      {ROLES.filter(r => r.value).map(r => <option key={r.value} value={r.value} className="bg-[#111] text-white">{r.label}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {u.isActive
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle2 className="w-3 h-3" />Faol</span>
                      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><ShieldBan className="w-3 h-3" />Bloklangan</span>
                    }
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-400 text-xs">{u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}</div>
                    {u.lastLoginIp && <div className="text-gray-600 text-xs font-mono">{u.lastLoginIp}</div>}
                  </td>
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelected(u); setLogsTab('profile'); }}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Profil">
                        <Eye className="w-3.5 h-3.5 text-gray-300" />
                      </button>
                      {u.isActive
                        ? <button onClick={() => ban.mutate(u.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors" title="Bloklash">
                            <ShieldBan className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        : <button onClick={() => unban.mutate(u.id)}
                            className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors" title="Blokni ochish">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                          </button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Foydalanuvchi topilmadi</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-white/10">
              <Avatar name={selected.fullName} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{selected.fullName}</h3>
                <p className="text-sm text-gray-500">{selected.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${roleCls[selected.role]}`}>{roleLbl[selected.role]}</span>
                  {selected.isActive
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle2 className="w-3 h-3" />Faol</span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><ShieldBan className="w-3 h-3" />Bloklangan</span>
                  }
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl leading-none">&#x2715;</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {(['profile', 'logs'] as const).map(t => (
                <button key={t} onClick={() => setLogsTab(t)}
                  className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${logsTab === t ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-white'}`}>
                  {t === 'profile' ? 'Profil' : "Faollik logi"}
                </button>
              ))}
            </div>

            {/* Profile tab */}
            {logsTab === 'profile' && (
              <div className="p-6 space-y-3">
                {[
                  { icon: Mail,         label: 'Email',           val: selected.email },
                  { icon: Phone,        label: 'Telefon',         val: selected.phone || '—' },
                  { icon: Globe,        label: 'Til',             val: selected.preferredLanguage || 'uz' },
                  { icon: Clock,        label: "Ro'yxat sanasi",  val: formatDate(selected.createdAt) },
                  { icon: Clock,        label: 'Oxirgi kirish',   val: selected.lastLoginAt ? formatDate(selected.lastLoginAt) : '—' },
                  { icon: AlertCircle,  label: 'Login IP',        val: selected.lastLoginIp || '—' },
                  { icon: Lock,         label: "Muvaffaqiyatsiz kirish", val: `${selected.failedLoginCount || 0} marta` },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Icon className="w-3.5 h-3.5" />{label}
                    </div>
                    <span className="text-sm text-white font-mono text-right max-w-[220px] truncate">{val}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2 text-gray-500 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Email tasdiqlangan</div>
                  <span className={`text-xs font-semibold ${selected.emailVerified ? 'text-green-400' : 'text-red-400'}`}>{selected.emailVerified ? 'Ha' : "Yo'q"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-2 text-gray-500 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />2FA yoqilgan</div>
                  <span className={`text-xs font-semibold ${selected.twoFactorEnabled ? 'text-green-400' : 'text-gray-500'}`}>{selected.twoFactorEnabled ? 'Ha' : "Yo'q"}</span>
                </div>

                {/* Role changer */}
                <div className="pt-2">
                  <label className="block text-xs text-gray-500 mb-1.5">Rolni o&apos;zgartirish</label>
                  <select defaultValue={selected.role}
                    onChange={e => { updateRole.mutate({ id: selected.id, role: e.target.value }); setSelected((p: any) => ({ ...p, role: e.target.value })); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20">
                    {ROLES.filter(r => r.value).map(r => <option key={r.value} value={r.value} className="bg-[#111]">{r.label}</option>)}
                  </select>
                </div>

                {/* Ban/Unban */}
                <div className="pt-1">
                  {selected.isActive
                    ? <button onClick={() => ban.mutate(selected.id)} disabled={ban.isPending}
                        className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                        <ShieldBan className="w-4 h-4" /> Foydalanuvchini bloklash
                      </button>
                    : <button onClick={() => unban.mutate(selected.id)} disabled={unban.isPending}
                        className="w-full py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-all flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Blokni olib tashlash
                      </button>
                  }
                </div>
              </div>
            )}

            {/* Logs tab */}
            {logsTab === 'logs' && (
              <div className="p-6">
                <p className="text-xs text-gray-500 mb-3">So&apos;nggi 20 ta to&apos;lov</p>
                {logs.length === 0 ? (
                  <div className="text-center py-10 text-gray-600">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tranzaksiya topilmadi</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {logs.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5">
                        <div>
                          <div className="text-white text-xs font-medium">{p.customerName || '—'}</div>
                          <div className="text-gray-500 text-xs font-mono">{formatDate(p.createdAt)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white text-sm font-bold">{formatAmount(p.amount, p.currency)}</div>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            p.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                            p.status === 'pending'   ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
