'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Trash2, ExternalLink, Loader2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';

const POSITIONS = [
  { key: 'header',        label: 'Yuqori banner' },
  { key: 'sidebar_left',  label: 'Chap panel' },
  { key: 'sidebar_right', label: "O'ng panel" },
  { key: 'middle',        label: "O'rta banner" },
  { key: 'footer',        label: 'Pastki banner' },
];

const adsApi = {
  getAll:  ()                      => api.get('/ads'),
  create:  (data: any)             => api.post('/ads', data),
  update:  (id: string, data: any) => api.put(`/ads/${id}`, data),
  toggle:  (id: string)            => api.patch(`/ads/${id}/toggle`),
  remove:  (id: string)            => api.delete(`/ads/${id}`),
};

const EMPTY = { title: '', imageUrl: '', linkUrl: '', position: 'header', isActive: true, startDate: '', endDate: '' };

export default function AdsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [form, setForm]           = useState({ ...EMPTY });

  const { data, isLoading } = useQuery({
    queryKey: ['ads'],
    queryFn: () => adsApi.getAll() as any,
  });

  const saveMutation = useMutation({
    mutationFn: () => editing ? adsApi.update(editing.id, form) : adsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ads'] }); closeModal(); },
  });
  const toggleMutation = useMutation({
    mutationFn: (id: string) => adsApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ads'] }),
  });

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY }); setShowModal(true); };
  const openEdit   = (ad: any) => {
    setEditing(ad);
    setForm({ title: ad.title, imageUrl: ad.imageUrl, linkUrl: ad.linkUrl || '', position: ad.position, isActive: ad.isActive, startDate: ad.startDate?.slice(0,16) || '', endDate: ad.endDate?.slice(0,16) || '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const ads: any[] = Array.isArray(data) ? data : (data as any)?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reklama Joylash</h1>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Yangi Banner
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rasm</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Banner Nomi</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joylashuvi</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Havola</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Holati</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500 mx-auto" />
              </td></tr>
            ) : ads.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16">
                <ImageIcon className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Hali reklama qo'shilmagan</p>
              </td></tr>
            ) : ads.map((ad: any) => (
              <tr key={ad.id}
                onClick={() => openEdit(ad)}
                className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                {/* Rasm */}
                <td className="px-6 py-4">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {ad.imageUrl
                      ? <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display='none'; }} />
                      : <ImageIcon className="w-5 h-5 text-gray-600" />
                    }
                  </div>
                </td>

                {/* Banner Nomi */}
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-white">{ad.title}</span>
                </td>

                {/* Joylashuvi */}
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                    {POSITIONS.find(p => p.key === ad.position)?.label || ad.position}
                  </span>
                </td>

                {/* Havola */}
                <td className="px-6 py-4">
                  {ad.linkUrl ? (
                    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                      Link <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-600">—</span>
                  )}
                </td>

                {/* Holati */}
                <td className="px-6 py-4">
                  {ad.isActive
                    ? <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Faol</span>
                    : <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">Nofaol</span>
                  }
                </td>

                {/* Amallar */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => toggleMutation.mutate(ad.id)}
                      className={`p-2 rounded-lg border transition-all ${ad.isActive ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20' : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'}`}>
                      {ad.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { if (confirm("O'chirasizmi?")) deleteMutation.mutate(ad.id); }}
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <h3 className="text-base font-bold text-white">{editing ? 'Bannerni tahrirlash' : 'Yangi banner'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Banner nomi *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                  placeholder="Masalan: Wentric banner" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Rasm URL *</label>
                <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 font-mono transition-all"
                  placeholder="https://cdn.example.com/banner.jpg" />
                {form.imageUrl && (
                  <div className="mt-2 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover"
                      onError={e => e.currentTarget.style.display='none'} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Havola URL</label>
                <input value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 font-mono transition-all"
                  placeholder="https://example.com" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Joylashuvi *</label>
                <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all">
                  {POSITIONS.map(p => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Boshlanish</label>
                  <input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tugash</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30" />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <div className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? 'bg-indigo-600' : 'bg-white/10'}`}
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all bg-white ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-300">Faol holda saqlash</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white transition-all">
                  Bekor
                </button>
                <button
                  disabled={!form.title || !form.imageUrl || saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editing ? 'Saqlash' : 'Qo\'shish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
