'use client';
import { useState } from 'react';
import { Rocket, RefreshCw, CheckCircle, Clock, AlertTriangle, GitBranch, Server, Activity } from 'lucide-react';

const SERVICES = [
  { name: 'API Server',       env: 'production', status: 'running', version: 'v2.4.1', uptime: '12d 4h', cpu: 23, mem: 45 },
  { name: 'Worker Service',   env: 'production', status: 'running', version: 'v2.4.1', uptime: '12d 4h', cpu: 12, mem: 31 },
  { name: 'Webhook Handler',  env: 'production', status: 'running', version: 'v2.3.8', uptime: '5d 2h',  cpu: 8,  mem: 22 },
  { name: 'Telegram Bot',     env: 'production', status: 'stopped', version: 'v1.0.2', uptime: '—',      cpu: 0,  mem: 0  },
];

const DEPLOYS = [
  { id: 'd1', version: 'v2.4.1', branch: 'main',    status: 'success', time: '2026-04-20 09:00', by: 'Admin' },
  { id: 'd2', version: 'v2.4.0', branch: 'main',    status: 'success', time: '2026-04-15 14:30', by: 'Admin' },
  { id: 'd3', version: 'v2.3.9', branch: 'hotfix',  status: 'failed',  time: '2026-04-12 11:00', by: 'Admin' },
  { id: 'd4', version: 'v2.3.8', branch: 'main',    status: 'success', time: '2026-04-10 10:00', by: 'Admin' },
];

export default function AdminDeployPage() {
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const deploy = async () => {
    setDeploying(true);
    await new Promise(r => setTimeout(r, 3000));
    setDeploying(false);
    setDeployed(true);
    setTimeout(() => setDeployed(false), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deploy boshqaruvi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tizim versiyalari va xizmatlar holati</p>
        </div>
        <button onClick={deploy} disabled={deploying}
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50">
          {deploying ? <><RefreshCw className="w-4 h-4 animate-spin" /> Deploylanmoqda...</> : deployed ? <><CheckCircle className="w-4 h-4 text-green-600" /> Muvaffaqiyatli!</> : <><Rocket className="w-4 h-4" /> Deploy qilish</>}
        </button>
      </div>

      {deploying && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin shrink-0" />
          <div>
            <div className="text-sm font-semibold text-yellow-400">Deploy jarayoni...</div>
            <div className="text-xs text-yellow-400/60 mt-0.5">Xizmatlar yangilanmoqda. Bu bir necha daqiqa olishi mumkin.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {SERVICES.map(s => (
          <div key={s.name} className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <Server className="w-4 h-4 text-gray-400" />
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${s.status === 'running' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'running' ? 'bg-green-400' : 'bg-red-400'}`} />
                {s.status === 'running' ? 'Ishlayapti' : "To'xtagan"}
              </span>
            </div>
            <div className="text-white font-semibold text-sm">{s.name}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.version}</div>
            {s.status === 'running' && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">CPU</span>
                  <span className="text-gray-300">{s.cpu}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full"><div className="h-full bg-white/60 rounded-full" style={{ width: `${s.cpu}%` }} /></div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">RAM</span>
                  <span className="text-gray-300">{s.mem}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full"><div className="h-full bg-blue-400/60 rounded-full" style={{ width: `${s.mem}%` }} /></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-white">Deploy tarixi</h2>
        </div>
        <div className="divide-y divide-white/5">
          {DEPLOYS.map(d => (
            <div key={d.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {d.status === 'success' ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                <div>
                  <div className="text-white font-medium text-sm">{d.version}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <GitBranch className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-500 text-xs">{d.branch}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${d.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{d.status === 'success' ? 'Muvaffaqiyatli' : 'Xato'}</span>
                <div className="text-gray-500 text-xs mt-0.5">{d.time} · {d.by}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
