'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storageApi } from '@/lib/api';
import {
  HardDrive, Upload, Trash2, File, Image, FileText,
  Archive, Download, X, Copy, Check, Code2, Key, Eye,
  FolderOpen, Plus, RefreshCw, AlertTriangle, Globe,
  ChevronDown, ChevronRight, Shield,
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://makerpay.uz/api/v1';

function ImagePreviewModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-300 truncate">{name}</p>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <img src={url} alt={name} className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto block" />
        <div className="flex justify-center mt-3 gap-3">
          <a href={url} download target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-gray-300 hover:text-white text-sm transition-colors">
            <Download className="w-4 h-4" /> Yuklab olish
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Token panel for a bucket ─────────────────────────────────────────────────

function BucketTokens({ bucketId, uploadUrl }: { bucketId: string; uploadUrl: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [newToken, setNewToken] = useState<{ id: string; name: string; apiKey: string } | null>(null);

  const { data: tokensRaw, isLoading } = useQuery({
    queryKey: ['bucket-tokens', bucketId],
    queryFn: () => storageApi.listBucketTokens(bucketId),
    enabled: open,
  });
  const tokens: any[] = Array.isArray(tokensRaw) ? tokensRaw : [];

  const deleteMut = useMutation({
    mutationFn: (tokenId: string) => storageApi.deleteBucketToken(bucketId, tokenId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bucket-tokens', bucketId] }),
  });

  const addToken = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res: any = await storageApi.addBucketToken(bucketId, newName.trim());
      setNewToken({ id: res.id, name: res.name, apiKey: res.apiKey });
      setNewName('');
      qc.invalidateQueries({ queryKey: ['bucket-tokens', bucketId] });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors">
        <span className="flex items-center gap-2 text-xs font-semibold text-gray-400">
          <Shield className="w-3.5 h-3.5" /> API Tokenlar
        </span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* New token reveal */}
          {newToken && (
            <div className="bg-green-500/5 border border-green-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> {newToken.name} — faqat bir marta!
                </p>
                <button onClick={() => setNewToken(null)} className="text-gray-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <code className="text-xs text-green-300 font-mono flex-1 break-all">{newToken.apiKey}</code>
                <CopyBtn text={newToken.apiKey} label="Nusxa" />
              </div>
              <p className="text-xs text-yellow-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" /> Xavfsiz joyga saqlang — keyinchalik ko'rilmaydi
              </p>
            </div>
          )}

          {/* Add new token */}
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addToken()}
              placeholder="Token nomi (masalan: mobile-app)"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/25 transition-all placeholder:text-gray-600"
            />
            <button
              onClick={addToken}
              disabled={adding || !newName.trim()}
              className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-all disabled:opacity-50 flex items-center gap-1.5">
              {adding ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-3 h-3" />}
              Qo'shish
            </button>
          </div>

          {/* Token list */}
          {isLoading ? (
            <p className="text-xs text-gray-600 text-center py-2">Yuklanmoqda...</p>
          ) : tokens.length === 0 ? (
            <p className="text-xs text-gray-700 text-center py-2">Qo'shimcha tokenlar yo'q</p>
          ) : (
            <div className="space-y-1.5">
              {tokens.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between gap-2 bg-white/3 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Key className="w-3 h-3 text-gray-500 shrink-0" />
                    <span className="text-xs text-white font-medium truncate">{t.name}</span>
                    <code className="text-xs text-gray-500 font-mono">{t.apiKeyPrefix}••••</code>
                  </div>
                  <button
                    onClick={() => { if (confirm(`"${t.name}" tokenni o'chirish?`)) deleteMut.mutate(t.id); }}
                    className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-700">
            Har bir token <code className="text-gray-500">{uploadUrl}</code> ga upload qilish uchun ishlatiladi
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Domain panel for a bucket ────────────────────────────────────────────────

function BucketDomain({ bucketId, currentDomain, slug }: { bucketId: string; currentDomain: string | null; slug: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState(currentDomain || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await storageApi.updateBucketDomain(bucketId, domain.trim());
      qc.invalidateQueries({ queryKey: ['storage-buckets'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const effectiveDomain = domain.trim() || `${API_BASE.replace('/api/v1', '')}`;
  const exampleUrl = `${effectiveDomain}/api/v1/storage/b/${slug}/{filename}`;

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors">
        <span className="flex items-center gap-2 text-xs font-semibold text-gray-400">
          <Globe className="w-3.5 h-3.5" /> Custom Domain
          {currentDomain && <span className="text-green-400 font-mono">{currentDomain}</span>}
        </span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div className="flex gap-2">
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="https://cdn.sizningsite.uz"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-white/25 transition-all placeholder:text-gray-600"
            />
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-all disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <Check className="w-3 h-3 text-green-400" /> : null}
              {saved ? 'Saqlandi!' : 'Saqlash'}
            </button>
          </div>
          <div className="bg-black/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <code className="text-xs text-gray-400 font-mono flex-1 truncate">{exampleUrl}</code>
            <CopyBtn text={exampleUrl} label="URL" />
          </div>
          <p className="text-xs text-gray-600">
            Domenni o'rnatgandan so'ng, CNAME yozuvini serveringizga yo'naltiring.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Buckets Tab ─────────────────────────────────────────────────────────────

function BucketsTab() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ id: string; apiKey: string } | null>(null);
  const [regenLoading, setRegenLoading] = useState<string | null>(null);

  const { data: bucketsRaw, isLoading } = useQuery({
    queryKey: ['storage-buckets'],
    queryFn: () => storageApi.getBuckets(),
  });
  const buckets: any[] = Array.isArray(bucketsRaw) ? bucketsRaw : [];

  const deleteMut = useMutation({
    mutationFn: (id: string) => storageApi.deleteBucket(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['storage-buckets'] }),
  });

  const createBucket = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res: any = await storageApi.createBucket(newName.trim());
      setNewKeyData({ id: res.id, apiKey: res.apiKey });
      setNewName('');
      qc.invalidateQueries({ queryKey: ['storage-buckets'] });
    } finally {
      setCreating(false);
    }
  };

  const regenKey = async (id: string) => {
    setRegenLoading(id);
    try {
      const res: any = await storageApi.regenerateBucketKey(id);
      setNewKeyData({ id, apiKey: res.apiKey });
      qc.invalidateQueries({ queryKey: ['storage-buckets'] });
    } finally {
      setRegenLoading(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* New key display */}
      {newKeyData && (
        <div className="bg-green-500/5 border border-green-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-green-400 flex items-center gap-2">
              <Key className="w-4 h-4" /> API Key — faqat bir marta ko'rsatiladi!
            </p>
            <button onClick={() => setNewKeyData(null)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-black/30 rounded-xl px-4 py-3">
            <code className="text-sm text-green-300 font-mono flex-1 break-all">{newKeyData.apiKey}</code>
            <CopyBtn text={newKeyData.apiKey} label="Nusxa" />
          </div>
          <p className="text-xs text-yellow-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Ushbu kalitni xavfsiz joyga saqlang — keyinchalik ko'rilmaydi
          </p>
        </div>
      )}

      {/* Create bucket */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-gray-400" /> Yangi bucket yaratish
        </h3>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createBucket()}
            placeholder="Bucket nomi (masalan: codeusta-storage)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-gray-600"
          />
          <button
            onClick={createBucket}
            disabled={creating || !newName.trim()}
            className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center gap-2">
            {creating ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
            Yaratish
          </button>
        </div>
      </div>

      {/* Buckets list */}
      {isLoading ? (
        <div className="py-10 text-center text-gray-600 text-sm">Yuklanmoqda...</div>
      ) : buckets.length === 0 ? (
        <div className="bg-[#111] border border-white/10 rounded-2xl py-16 text-center">
          <FolderOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Hech qanday bucket yo'q</p>
          <p className="text-gray-700 text-xs mt-1">Yuqorida bucket yarating</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buckets.map((b: any) => {
            const uploadUrl = `${API_BASE}/storage/b/${b.slug}/upload`;
            const basePublicUrl = b.customDomain
              ? `${b.customDomain}/api/v1/storage/b/${b.slug}/{filename}`
              : `${API_BASE}/storage/b/${b.slug}/{filename}`;
            return (
              <div key={b.id} className="bg-[#111] border border-white/10 rounded-2xl p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{b.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{b.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{b.fileCount} fayl · {formatSize(Number(b.totalSize))}</span>
                    <button
                      onClick={() => { if (confirm(`"${b.name}" bucketni o'chirish?`)) deleteMut.mutate(b.id); }}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main API Key */}
                <div className="bg-white/3 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" /> Asosiy API Key
                    </span>
                    <button
                      onClick={() => regenKey(b.id)}
                      disabled={regenLoading === b.id}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors disabled:opacity-50">
                      <RefreshCw className={`w-3 h-3 ${regenLoading === b.id ? 'animate-spin' : ''}`} />
                      Yangilash
                    </button>
                  </div>
                  <code className="text-xs text-gray-400 font-mono">{b.apiKeyPrefix}••••••••••••••••••••••••••••••••</code>
                </div>

                {/* Upload URL */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upload URL</p>
                  <div className="flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2">
                    <code className="text-xs text-gray-300 font-mono flex-1 truncate">POST {uploadUrl}</code>
                    <CopyBtn text={uploadUrl} label="URL" />
                  </div>
                  <div className="bg-[#0d0d0d] rounded-xl p-3 font-mono text-xs text-gray-400 space-y-0.5">
                    <div><span className="text-blue-400">POST</span> {uploadUrl}</div>
                    <div><span className="text-yellow-400">X-Storage-Key:</span> <span className="text-green-400">mpk_stg_...</span></div>
                    <div><span className="text-yellow-400">Content-Type:</span> multipart/form-data</div>
                    <div><span className="text-yellow-400">Body:</span> file=@yourfile</div>
                  </div>
                  <div className="flex justify-end">
                    <CopyBtn
                      text={`curl -X POST "${uploadUrl}" -H "X-Storage-Key: YOUR_KEY" -F "file=@yourfile.jpg"`}
                      label="curl nusxa"
                    />
                  </div>
                </div>

                {/* Public URL */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Public URL</p>
                  <div className="flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2">
                    <code className="text-xs text-gray-300 font-mono flex-1 truncate">GET {basePublicUrl}</code>
                    <CopyBtn text={basePublicUrl} label="URL" />
                  </div>
                  <p className="text-xs text-gray-600">Public — autentifikatsiya kerak emas</p>
                </div>

                {/* Token management */}
                <BucketTokens bucketId={b.id} uploadUrl={uploadUrl} />

                {/* Domain management */}
                <BucketDomain bucketId={b.id} currentDomain={b.customDomain} slug={b.slug} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StoragePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [lastUpload, setLastUpload] = useState<any>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [tab, setTab] = useState<'files' | 'buckets'>('files');

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

  const downloadFilesJson = () => {
    const data = files.map(f => ({
      id: f.id,
      fileName: f.fileName,
      fileUrl: f.fileUrl,
      fileSize: f.fileSize,
      mimeType: f.mimeType,
      createdAt: f.createdAt,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storage-files.json';
    a.click();
    URL.revokeObjectURL(url);
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
      {preview && <ImagePreviewModal url={preview.url} name={preview.name} onClose={() => setPreview(null)} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <HardDrive className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Storage</h1>
          <p className="text-sm text-gray-500">Fayl xotira · APK, rasm, hujjat va boshqalar</p>
        </div>
        {tab === 'files' && (
          <div className="ml-auto flex items-center gap-2">
            {files.length > 0 && (
              <button
                onClick={downloadFilesJson}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white hover:border-white/20 transition-all">
                <Download className="w-4 h-4" /> JSON
              </button>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-50">
              {uploading
                ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Yuklanmoqda...</>
                : <><Upload className="w-4 h-4" /> Fayl yuklash</>}
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" className="hidden" accept="*/*" onChange={handleUpload} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('files')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'files' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
          Fayllar
        </button>
        <button onClick={() => setTab('buckets')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${tab === 'buckets' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
          <FolderOpen className="w-4 h-4" /> Buckets
        </button>
      </div>

      {tab === 'buckets' ? <BucketsTab /> : (
        <>
          {uploadErr && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              <X className="w-4 h-4 shrink-0" /> {uploadErr}
            </div>
          )}

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
                        {f.mimeType?.startsWith('image/') && (
                          <button onClick={() => setPreview({ url: f.fileUrl, name: f.fileName })}
                            className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Ko'rish">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <a href={f.fileUrl} download target="_blank" rel="noreferrer"
                          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors" title="Yuklab olish">
                          <Download className="w-4 h-4" />
                        </a>
                        <button onClick={() => deleteMut.mutate(f.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 ml-13">
                      <code className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-lg truncate flex-1 max-w-md">{f.fileUrl}</code>
                      <CopyBtn text={f.fileUrl} label="URL nusxa" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API docs */}
          <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-gray-400" />
              <h2 className="text-base font-bold text-white">API orqali fayl yuklash</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">1. Fayl yuklash (POST)</p>
                <div className="bg-[#0d0d0d] rounded-xl p-4 font-mono text-xs text-gray-300 space-y-1">
                  <div><span className="text-blue-400">POST</span> {API_BASE}/storage/upload</div>
                  <div><span className="text-yellow-400">Authorization:</span> Bearer {'{'}<span className="text-green-400">JWT_TOKEN</span>{'}'}</div>
                  <div><span className="text-yellow-400">Content-Type:</span> multipart/form-data</div>
                  <div><span className="text-yellow-400">Body:</span> file=@yourfile.apk</div>
                </div>
                <div className="flex justify-end mt-1">
                  <CopyBtn text={`curl -X POST ${API_BASE}/storage/upload -H "Authorization: Bearer JWT_TOKEN" -F "file=@yourfile.apk"`} label="curl nusxa" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">2. JSON javob</p>
                <div className="relative">
                  <pre className="bg-[#0d0d0d] rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto">{uploadJson}</pre>
                  <div className="absolute top-2 right-2">
                    <CopyBtn text={uploadJson} label="nusxa" />
                  </div>
                </div>
              </div>
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" /> Rate limit
                </p>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between"><span>Free tarif</span><span className="text-white font-mono">50 upload/sekund</span></div>
                  <div className="flex justify-between"><span>Basic / Standard</span><span className="text-white font-mono">200 upload/sekund</span></div>
                  <div className="flex justify-between"><span>Business / Enterprise</span><span className="text-white font-mono">Limitsiz</span></div>
                  <div className="flex justify-between border-t border-white/5 pt-1 mt-1"><span>Max fayl hajmi</span><span className="text-white font-mono">50 MB</span></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">3. Fayl manzili (public URL)</p>
                <div className="bg-[#0d0d0d] rounded-xl p-4 font-mono text-xs text-gray-300">
                  <span className="text-green-400">GET</span> {API_BASE}/storage/serve/<span className="text-yellow-400">{'{userId}'}</span>/<span className="text-blue-400">{'{filename}'}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Public URL — authentication kerak emas.</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-700 text-center">
            Free: 512 MB · Basic: 5 GB · Standard: 10 GB · Business: 50 GB · Enterprise: Unlimited
          </p>
        </>
      )}
    </div>
  );
}
