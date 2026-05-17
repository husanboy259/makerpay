'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Terminal, FolderOpen, File, Upload, Archive, Play, Trash2,
  ChevronRight, ChevronDown, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { storageApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  size?: number;
  children?: FileNode[];
}

interface TermLine {
  kind: 'cmd' | 'out' | 'err' | 'info';
  text: string;
}

// ── File node component ────────────────────────────────────────────────────────
function FileTree({
  nodes,
  selected,
  onSelect,
  depth = 0,
}: {
  nodes: FileNode[];
  selected: string | null;
  onSelect: (path: string, name: string) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (!nodes?.length) return <div className="text-xs text-gray-600 pl-2">Bo'sh papka</div>;

  return (
    <div className="space-y-0.5">
      {nodes.map(node => (
        <div key={node.path}>
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer text-xs transition-colors
              ${selected === node.path ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            style={{ paddingLeft: `${8 + depth * 14}px` }}
            onClick={() => {
              if (node.type === 'dir') setOpen(o => ({ ...o, [node.path]: !o[node.path] }));
              else onSelect(node.path, node.name);
            }}
          >
            {node.type === 'dir' ? (
              <>
                {open[node.path] ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                <FolderOpen className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              </>
            ) : (
              <>
                <span className="w-3 h-3 shrink-0" />
                <File className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              </>
            )}
            <span className="truncate">{node.name}</span>
            {node.type === 'file' && node.size != null && (
              <span className="ml-auto text-gray-600 font-mono shrink-0">{fmtSize(node.size)}</span>
            )}
          </div>
          {node.type === 'dir' && open[node.path] && node.children && (
            <FileTree nodes={node.children} selected={selected} onSelect={onSelect} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DeployPage() {
  const qc = useQueryClient();

  // File browser state
  const [selected, setSelected] = useState<{ path: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const zipRef  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // Terminal state
  const [lines, setLines] = useState<TermLine[]>([
    { kind: 'info', text: 'MakerPay Sandbox Terminal' },
    { kind: 'info', text: 'Taqiqlangan: rm -rf, sudo, wget, curl (tashqi), shutdown ...' },
    { kind: 'info', text: 'Buyruq kiriting yoki fayl tanlang va [Run] bosing.' },
  ]);
  const [input, setInput]     = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const termBottomRef = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);

  const { data: raw, isLoading: filesLoading } = useQuery({
    queryKey: ['workspace-files'],
    queryFn: () => storageApi.getWorkspace(),
    retry: false,
  });
  const files: FileNode[] = Array.isArray(raw) ? raw : [];

  // Auto scroll terminal
  useEffect(() => {
    termBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const addLines = (newLines: TermLine[]) => setLines(prev => [...prev, ...newLines]);

  // ── Execute command ──
  const runCommand = useCallback(async (cmd: string) => {
    if (!cmd.trim() || running) return;
    const trimmed = cmd.trim();
    setRunning(true);
    setHistory(h => [trimmed, ...h.slice(0, 49)]);
    setHistIdx(-1);
    addLines([{ kind: 'cmd', text: `$ ${trimmed}` }]);
    try {
      const res: any = await storageApi.exec(trimmed);
      if (res?.blocked) {
        addLines([{ kind: 'err', text: res.output || 'Taqiqlangan buyruq' }]);
      } else if (res?.output) {
        const outLines = res.output.split('\n').map((t: string) => ({ kind: 'out' as const, text: t }));
        addLines(outLines);
        if (res.exitCode !== 0) addLines([{ kind: 'err', text: `exit code: ${res.exitCode}` }]);
      } else {
        addLines([{ kind: 'out', text: '(chiqish yo\'q)' }]);
      }
      // Refresh file tree after commands that might change files
      if (/\b(unzip|cp|mv|mkdir|touch|git|npm|pip|python|node)\b/.test(trimmed)) {
        qc.invalidateQueries({ queryKey: ['workspace-files'] });
      }
    } catch (e: any) {
      addLines([{ kind: 'err', text: e?.message || 'Xato yuz berdi' }]);
    } finally {
      setRunning(false);
    }
  }, [running, qc]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? '' : history[next]);
    }
  };

  // ── Run selected file ──
  const runFile = () => {
    if (!selected) return;
    const ext = selected.name.split('.').pop()?.toLowerCase();
    let cmd = '';
    if (ext === 'js' || ext === 'mjs') cmd = `node "${selected.path}"`;
    else if (ext === 'py') cmd = `python3 "${selected.path}"`;
    else if (ext === 'sh') cmd = `bash "${selected.path}"`;
    else if (ext === 'ts') cmd = `npx ts-node "${selected.path}"`;
    else cmd = `./"${selected.path}"`;
    runCommand(cmd);
  };

  // ── File upload ──
  const handleUpload = async (file: File, isZip: boolean) => {
    setUploading(true);
    setUploadMsg('');
    try {
      const res: any = isZip
        ? await storageApi.uploadZip(file)
        : await storageApi.uploadLocal(file);
      setUploadMsg(isZip ? `${res.extracted} ta fayl chiqarildi` : `${res.name} yuklandi`);
      qc.invalidateQueries({ queryKey: ['workspace-files'] });
      addLines([{ kind: 'info', text: isZip ? `ZIP: ${res.message || res.extracted + ' ta fayl'}` : `Yuklandi: ${res.name}` }]);
    } catch (e: any) {
      setUploadMsg(`Xato: ${e?.message || 'Yuklashda xato'}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(''), 4000);
    }
  };

  // ── Terminal line styles ──
  const lineStyle: Record<string, string> = {
    cmd:  'text-green-400 font-semibold',
    out:  'text-gray-300',
    err:  'text-red-400',
    info: 'text-blue-400',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Terminal className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Deploy & Terminal</h1>
          <p className="text-xs text-gray-500">Sandbox muhit — xavfsiz buyruqlar</p>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* ── LEFT: File browser ── */}
        <div className="w-72 shrink-0 flex flex-col gap-3">

          {/* Upload buttons */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-3 space-y-2">
            <input ref={fileRef} type="file" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, false); e.target.value = ''; }} />
            <input ref={zipRef}  type="file" hidden accept=".zip" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, true);  e.target.value = ''; }} />

            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50">
                <Upload className="w-3.5 h-3.5" /> Fayl
              </button>
              <button
                onClick={() => zipRef.current?.click()}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50">
                <Archive className="w-3.5 h-3.5" /> ZIP
              </button>
              <button
                onClick={() => qc.invalidateQueries({ queryKey: ['workspace-files'] })}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {uploading && <div className="text-xs text-center text-gray-500 animate-pulse">Yuklanmoqda...</div>}
            {uploadMsg && <div className={`text-xs text-center ${uploadMsg.startsWith('Xato') ? 'text-red-400' : 'text-green-400'}`}>{uploadMsg}</div>}
          </div>

          {/* File tree */}
          <div className="flex-1 bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
            <div className="px-3 py-2.5 border-b border-white/10 flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-white">Workspace</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filesLoading ? (
                <div className="text-xs text-gray-600 text-center py-4">Yuklanmoqda...</div>
              ) : (
                <FileTree
                  nodes={files}
                  selected={selected?.path ?? null}
                  onSelect={(path, name) => setSelected({ path, name })}
                />
              )}
            </div>
          </div>

          {/* Selected file actions */}
          {selected && (
            <div className="bg-[#111] border border-white/10 rounded-xl p-3 space-y-2">
              <div className="text-xs text-gray-500 truncate font-mono">{selected.path}</div>
              <div className="flex gap-2">
                <button
                  onClick={runFile}
                  disabled={running}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50">
                  <Play className="w-3.5 h-3.5" /> Run
                </button>
                <button
                  onClick={() => {
                    setSelected(null);
                    addLines([{ kind: 'cmd', text: `$ cat "${selected.path}"` }]);
                    runCommand(`cat "${selected.path}"`);
                  }}
                  className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
                  cat
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-600 hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Terminal ── */}
        <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl flex flex-col overflow-hidden min-w-0">
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-[#111] shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <span className="text-xs text-gray-500 font-mono ml-1">sandbox@makerpay:~/{'{user}'}</span>
            <button
              onClick={() => setLines([{ kind: 'info', text: 'Terminal tozalandi.' }])}
              className="ml-auto text-xs text-gray-600 hover:text-gray-400 transition-colors">
              clear
            </button>
          </div>

          {/* Output area */}
          <div
            className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-5 space-y-0.5 cursor-text"
            onClick={() => inputRef.current?.focus()}>
            {lines.map((l, i) => (
              <div key={i} className={lineStyle[l.kind] || 'text-gray-300'}>
                {l.text || ' '}
              </div>
            ))}
            {running && (
              <div className="text-yellow-400 animate-pulse">▌ bajarilmoqda...</div>
            )}
            <div ref={termBottomRef} />
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 shrink-0">
            <span className="text-green-400 font-mono text-xs shrink-0">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={running}
              autoFocus
              className="flex-1 bg-transparent text-white text-xs font-mono outline-none placeholder-gray-700 disabled:cursor-not-allowed"
              placeholder={running ? 'Bajarilmoqda...' : 'Buyruq kiriting...'}
            />
            <button
              onClick={() => { runCommand(input); setInput(''); }}
              disabled={running || !input.trim()}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all">
              Enter
            </button>
          </div>
        </div>
      </div>

      {/* Warning bar */}
      <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
        <p className="text-xs text-yellow-200/70">
          Sandbox muhit — <code className="text-yellow-400">rm -rf</code>, <code className="text-yellow-400">sudo</code>, <code className="text-yellow-400">wget</code>, tashqi <code className="text-yellow-400">curl</code> va boshqa xavfli buyruqlar bloklanadi.
          Har bir merchant alohida papkada ishlaydi.
        </p>
      </div>
    </div>
  );
}
