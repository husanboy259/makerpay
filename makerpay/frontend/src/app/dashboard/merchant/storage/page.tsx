'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '@/lib/api';
import {
  HardDrive, Upload, Trash2, File, Image, FileText,
  Archive, Download, X, Copy, Check, Code2, Key,
} from 'lucide-react';

function FileIcon({ mime }: { mime?: string }) {
  if (!mime) return <File className="w-5 h-5 text-gray-400" />;
  if (mime.startsWith('image/')) return <Image className="w-5 h-5 text-blue-400" />;
  if (mime.startsWith('text/') || mime.includes('pdf')) return <FileText className="w-5 h-5 text-yellow-400" />;
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('apk') || mime.includes('android'))
    return <Archive className="w-5 h-5 text-purple-400" />;
  return <File className="w-5 h-5 text-gray-400" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function CopyBtn({ text, label = 'URL' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${copied ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Nusxa!' : label}
    </button>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.makerpay.uz/api/v1';

export default function StoragePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [lastUpload, setLastUpload] = useState<any>(null);

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
    setLastUpload(null);
    try {
      const res: any = await storageApi.upload(file);
      setLastUpload(res);
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

  const uploadJson = JSON.stringify({
    id: 'uuid',
    fileUrl: `${API_BASE}/storage/serve/{userId}/{filename}`,
    fileName: 'yourfile.jpg',
    fileSize: 102400,
    mimeType: 'image/jpeg',
    createdAt: new Date().toISOString(),
  }, null, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <HardDrive className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Storage</h1>
          <p className="text-sm text-gray-500">Fayl xotira · APK, rasm, hujjat va boshqalar</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-50">
          {uploading
            ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Yuklanmoqda...</>
            : <><Upload className="w-4 h-4" /> Fayl yuklash</>}
        </button>
        <input ref={fileRef} type="file" className="hidden" accept="*/*" onChange={handleUpload} />
      </div>

      {uploadErr && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          <X className="w-4 h-4 shrink-0" /> {uploadErr}
        </div>
      )}

      {/* Last upload result */}
      {lastUpload && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-green-400">Fayl muvaffaqiyatli yuklandi!</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-gray-300 bg-black/30 px-3 py-2 rounded-lg flex-1 break-all">{lastUpload.fileUrl}</code>
            <CopyBtn text={lastUpload.fileUrl} label="URL" />
          </div>
        </div>
      )}

      {/* Usage */}
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

      {/* Files list */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white">Fayllar</h2>
        </div>
        {files.length === 0 ? (
          <div className="py-16 text-center">
            <HardDrive className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">Hech qanday fayl yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {files.map((f: any) => (
              <div key={f.id} className="px-6 py-4 hover:bg-white/2 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <FileIcon mime={f.mimeType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{f.fileName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatSize(Number(f.fileSize))} · {new Date(f.createdAt).toLocaleDateString('uz-UZ')}
                    </p>
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
                {/* URL bar */}
                <div className="mt-2 flex items-center gap-2 ml-13">
                  <code className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-lg truncate flex-1 max-w-md">{f.fileUrl}</code>
                  <CopyBtn text={f.fileUrl} label="URL nusxa" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Integration docs */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-bold text-white">API orqali fayl yuklash</h2>
        </div>
        <div className="p-6 space-y-5">

          {/* Upload */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">1. Fayl yuklash (POST)</p>
            <div className="bg-[#0d0d0d] rounded-xl p-4 font-mono text-xs text-gray-300 space-y-1">
              <div><span className="text-blue-400">POST</span> {API_BASE}/storage/upload</div>
              <div><span className="text-yellow-400">Authorization:</span> Bearer {'{'}<span className="text-green-400">API_KEY</span>{'}'}</div>
              <div><span className="text-yellow-400">Content-Type:</span> multipart/form-data</div>
              <div><span className="text-yellow-400">Body:</span> file=@yourfile.apk</div>
            </div>
            <div className="flex justify-end mt-1">
              <CopyBtn text={`curl -X POST ${API_BASE}/storage/upload -H "Authorization: Bearer API_KEY" -F "file=@yourfile.apk"`} label="curl nusxa" />
            </div>
          </div>

          {/* Response */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">2. JSON javob</p>
            <div className="relative">
              <pre className="bg-[#0d0d0d] rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto">{uploadJson}</pre>
              <div className="absolute top-2 right-2">
                <CopyBtn text={uploadJson} label="nusxa" />
              </div>
            </div>
          </div>

          {/* Rate limits */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-2">
              <Key className="w-3.5 h-3.5" /> Rate limit (so'rov limiti)
            </p>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex justify-between"><span>Free tarif</span><span className="text-white font-mono">50 upload/sekund</span></div>
              <div className="flex justify-between"><span>Basic / Standard</span><span className="text-white font-mono">200 upload/sekund</span></div>
              <div className="flex justify-between"><span>Business / Enterprise</span><span className="text-white font-mono">Limitsiz</span></div>
              <div className="flex justify-between border-t border-white/5 pt-1 mt-1"><span>Max fayl hajmi</span><span className="text-white font-mono">50 MB</span></div>
              <div className="flex justify-between"><span>Timeout</span><span className="text-white font-mono">10 daqiqa</span></div>
            </div>
          </div>

          {/* File URL */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">3. Fayl manzili (public URL)</p>
            <div className="bg-[#0d0d0d] rounded-xl p-4 font-mono text-xs text-gray-300">
              <span className="text-green-400">GET</span> {API_BASE}/storage/serve/<span className="text-yellow-400">{'{userId}'}</span>/<span className="text-blue-400">{'{filename}'}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Bu URL public — authentication kerak emas. To'g'ridan brauzerda ochliladi.</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-700 text-center">
        Free: 512 MB · Basic: 5 GB · Standard: 10 GB · Business: 50 GB · Enterprise: Unlimited
      </p>
    </div>
  );
}
