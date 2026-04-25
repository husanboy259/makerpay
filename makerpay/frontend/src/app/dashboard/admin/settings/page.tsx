'use client';
import { useState } from 'react';
import { Settings, Save, CheckCircle, Shield, Bell, Globe, Database } from 'lucide-react';

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [cfg, setCfg] = useState({ siteName: 'MakerPay', apiUrl: 'https://api.makerpay.uz', webhookSecret: '••••••••••••', maxRetries: '5', retryDelay: '30', emailNotify: true, telegramNotify: true, maintenanceMode: false, debug: false });

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tizim sozlamalari</h1>
          <p className="text-sm text-gray-500 mt-0.5">Asosiy konfiguratsiya va parametrlar</p>
        </div>
        <button onClick={save} className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all">
          {saved ? <><CheckCircle className="w-4 h-4 text-green-600" /> Saqlandi!</> : <><Save className="w-4 h-4" /> Saqlash</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-white">Asosiy sozlamalar</h2>
          </div>
          <Field label="Sayt nomi">
            <input value={cfg.siteName} onChange={e => setCfg(p => ({ ...p, siteName: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/25" />
          </Field>
          <Field label="API URL">
            <input value={cfg.apiUrl} onChange={e => setCfg(p => ({ ...p, apiUrl: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-white/25" />
          </Field>
          <Field label="Webhook Secret">
            <input value={cfg.webhookSecret} onChange={e => setCfg(p => ({ ...p, webhookSecret: e.target.value }))} type="password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-white/25" />
          </Field>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-white">Webhook & Retry</h2>
          </div>
          <Field label="Max urinishlar">
            <input value={cfg.maxRetries} onChange={e => setCfg(p => ({ ...p, maxRetries: e.target.value }))} type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/25" />
          </Field>
          <Field label="Kechikish (soniya)">
            <input value={cfg.retryDelay} onChange={e => setCfg(p => ({ ...p, retryDelay: e.target.value }))} type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/25" />
          </Field>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-white">Bildirishnomalar</h2>
          </div>
          {[{ key: 'emailNotify', label: 'Email bildirishnomalari', desc: "Muhim hodisalar uchun email yuborish" }, { key: 'telegramNotify', label: 'Telegram bildirishnomalari', desc: 'Xatolar va hodisalar uchun Telegram' }].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </div>
              <button onClick={() => setCfg(p => ({ ...p, [key]: !(p as any)[key] }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${(cfg as any)[key] ? 'bg-white' : 'bg-white/20'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-black rounded-full transition-all ${(cfg as any)[key] ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-bold text-white">Tizim holati</h2>
          </div>
          {[{ key: 'maintenanceMode', label: "Texnik xizmat ko'rsatish", desc: "Tizimni vaqtincha to'xtatish", warn: true }, { key: 'debug', label: 'Debug rejimi', desc: 'Kengaytirilgan loglarni yoqish', warn: false }].map(({ key, label, desc, warn }) => (
            <div key={key} className={`flex items-center justify-between py-3 border-b border-white/5 last:border-0 ${(cfg as any)[key] && warn ? 'bg-yellow-500/5 -mx-2 px-2 rounded-xl' : ''}`}>
              <div>
                <div className={`text-sm font-medium ${(cfg as any)[key] && warn ? 'text-yellow-400' : 'text-white'}`}>{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </div>
              <button onClick={() => setCfg(p => ({ ...p, [key]: !(p as any)[key] }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${(cfg as any)[key] ? (warn ? 'bg-yellow-400' : 'bg-white') : 'bg-white/20'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-black rounded-full transition-all ${(cfg as any)[key] ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
