'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '@/lib/api';
import { HardDrive, Upload, Trash2, File, Image, FileText, Archive, Download, X } from 'lucide-react';

function FileIcon({ mime }: { mime?: string }) {
  if (!mime) return <File className="w-5 h-5 text-gray-400" />;
  if (mime.startsWith('image/')) return <Image className="w-5 h-5 text-blue-400" />;
  if (mime.startsWith('text/') || mime.includes('pdf')) return <FileText className="w-5 h-5 text-yellow-400" />;
  if (mime.includes('zip') || mime.includes('rar')) return <Archive className="w-5 h-5 text-purple-400" />;
  return <File className="w-5 h-5 text-gray-400" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function StoragePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  const { data: stats } = useQuery({ queryKey: ['storage-stats'], queryFn: () => storageApi.getStats() });
  const { data: filesRaw } = useQuery({ queryKey: ['storage-files'], queryFn: () => storageApi.getFiles() });

  const s = stats as any;
  const files: any[] = Array.isArray(filesRaw) ? filesRaw : [];

  const deleteMut = useMutation({
    mutationFn: (id: string) => storageApi.deleteFile(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['storage-stats'] }); qc.invalidateQueries({ queryKey: ['storage-files'] }); },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr('');
    try {
      await storageApi.upload(file);
      qc.invalidateQueries({ queryKey: ['storage-stats'] });
      qc.invalidateQueries({ queryKey: ['storage-files'] });
    } catch (err: any) {
      setUploadErr(err?.message || 'Yuklashda xatolik');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const usedPct = s?.percent || 0;
  const barColor = usedPct > 90 ? 'bg-red-500' : usedPct > 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <HardDrive className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Storage</h1>
          <p className="text-sm text-gray-500">Fayl xotira boshqaruvi</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-50">
          {uploading
            ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Yuklanmoqda...</>
            : <><Upload className="w-4 h-4" /> Fayl yuklash</>}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      {uploadErr && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          <X className="w-4 h-4 shrink-0" /> {uploadErr}
        </div>
      )}

      {/* Usage card */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Xotira holati</h2>
          <span className="text-sm text-gray-400">
            <span className="text-white font-semibold">{s?.usedMB || 0} MB</span> / {s?.totalMB || 512} MB
          </span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-3 rounded-full transition-all ${barColor}`} style={{ width: `${usedPct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>{usedPct}% ishlatildi</span>
          <span>{s?.fileCount || 0} ta fayl</span>
          <span>{512 - (s?.usedMB || 0)} MB bo'sh</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Jami fayllar', value: s?.fileCount || 0 },
          { label: 'Ishlatilgan', value: `${s?.usedMB || 0} MB` },
          { label: "Bo'sh joy", value: `${Math.max(0, 512 - (s?.usedMB || 0))} MB` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Files list */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white">Fayllar</h2>
        </div>
        {files.length === 0 ? (
          <div className="py-16 text-center">
            <HardDrive className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Hech qanday fayl yo'q</p>
            <p className="text-gray-700 text-xs mt-1">Yuqoridagi tugma orqali fayl yuklang</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {files.map((f: any) => (
              <div key={f.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <FileIcon mime={f.mimeType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{f.fileName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatSize(Number(f.fileSize))} · {new Date(f.createdAt).toLocaleDateString('uz-UZ')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={f.fileUrl} target="_blank" rel="noreferrer"
                    className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                    <Download className="w-4 h-4" />
                  </a>
                  <button onClick={() => deleteMut.mutate(f.id)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-700 text-center">
        Bepul tarif: 512 MB · Basic: 5 GB · Standard: 10 GB · Business: 50 GB
      </p>
    </div>
  );
}
