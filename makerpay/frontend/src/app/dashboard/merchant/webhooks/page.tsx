'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhooksApi, merchantsApi } from '@/lib/api';
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils';
import {
  RefreshCw, CheckCircle, XCircle, Clock, Globe, Copy, Check,
  Webhook, Shield, ChevronDown, ExternalLink, Info,
} from 'lucide-react';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg transition-all">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Nusxa!' : 'Nusxa'}
    </button>
  );
}

const SAMPLE_REQUEST = `POST https://yoursite.uz/webhook/makerpay
Content-Type: application/json
X-MakerPay-Signature: sha256=a4b9c2d1e8f3...
X-MakerPay-Event: payment.completed
X-MakerPay-Timestamp: 1747123456

{
  "event": "payment.completed",
  "timestamp": "2026-05-13T10:30:00.000Z",
  "payment": {
    "id": "pay_01HXYZ123ABC",
    "amount": 50000,
    "currency": "UZS",
    "status": "completed",
    "description": "Mahsulot uchun to'lov",
    "provider": "tspay",
    "merchantId": "mer_01HXYZ456DEF",
    "metadata": {},
    "createdAt": "2026-05-13T10:29:55.000Z",
    "completedAt": "2026-05-13T10:30:00.000Z"
  }
}`;

const SAMPLE_RESPONSE = `// Sizning serveringiz qaytarishi kerak:
HTTP/1.1 200 OK
Content-Type: application/json

{ "received": true }

// ⚠️ 200 qaytarmasa, MakerPay qayta urinadi (5 marta)`;

const WEBHOOK_EVENTS = [
  { event: 'payment.completed',  desc: "To'lov muvaffaqiyatli yakunlandi" },
  { event: 'payment.failed',     desc: "To'lov amalga oshmadi" },
  { event: 'payment.pending',    desc: "To'lov kutilmoqda" },
  { event: 'payment.refunded',   desc: "To'lov qaytarildi" },
  { event: 'withdrawal.approved',desc: 'Yechish tasdiqlandi' },
];

export default function WebhooksPage() {
  const qc = useQueryClient();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [showDomains, setShowDomains] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');

  const { data: merchant } = useQuery({
    queryKey: ['merchant-me'],
    queryFn: () => merchantsApi.getMe().catch(() => null),
    retry: false,
  });

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['webhook-logs'],
    queryFn: () => webhooksApi.getLogs({ limit: 50 }),
    refetchInterval: 30000,
  });

  const logs = (logsData as any)?.data || [];

  const handleSaveWebhook = async () => {
    if (!webhookUrl) return;
    await merchantsApi.update({ websiteUrl: webhookUrl } as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    qc.invalidateQueries({ queryKey: ['merchant-me'] });
  };

  const deployedDomains = [
    { name: 'Mening saytim', url: `https://${(merchant as any)?.businessName?.toLowerCase().replace(/\s+/g, '-') || 'project'}.makerpay.uz/webhook` },
    { name: 'Staging', url: `https://staging.${(merchant as any)?.businessName?.toLowerCase().replace(/\s+/g, '-') || 'project'}.makerpay.uz/webhook` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhook sozlamalari</h1>
          <p className="text-sm text-gray-500 mt-1">To'lov hodisalarini qabul qilish uchun endpoint sozlang</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-all">
          <RefreshCw className="w-4 h-4" />
          Yangilash
        </button>
      </div>

      {/* ── Webhook URL config ── */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">
            <Webhook className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Webhook URL</h2>
            <p className="text-xs text-gray-500">To'lov hodisalari yuborilishi kerak bo'lgan endpoint</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Endpoint URL
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="url"
                placeholder="https://yoursite.uz/api/webhook"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white text-sm focus:border-white/30 focus:outline-none transition-all placeholder-gray-600"
              />
            </div>
            <button
              onClick={() => setShowDomains(!showDomains)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-all whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              Domainlar
              <ChevronDown className={`w-3 h-3 transition-transform ${showDomains ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Deployed domains dropdown */}
          {showDomains && (
            <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/5">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Deploy qilingan domainlar</p>
              </div>
              {deployedDomains.map((d, i) => (
                <button key={i} onClick={() => { setWebhookUrl(d.url); setShowDomains(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{d.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{d.url}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                </button>
              ))}
              <div className="px-4 py-3 bg-white/3">
                <p className="text-xs text-gray-600">
                  Yoki qo'lda to'liq URL kiriting
                </p>
              </div>
            </div>
          )}

          <button onClick={handleSaveWebhook}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all">
            {saved ? <><CheckCircle className="w-4 h-4 text-green-600" /> Saqlandi</> : 'Saqlash'}
          </button>
        </div>

        {/* Webhook events */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Yuboriluvchi hodisalar</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WEBHOOK_EVENTS.map(e => (
              <div key={e.event} className="flex items-center gap-2.5 bg-white/3 rounded-lg px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <div>
                  <code className="text-xs text-gray-300 font-mono">{e.event}</code>
                  <p className="text-xs text-gray-600 mt-0.5">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sample request ── */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center">
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Namuna so'rov</h2>
              <p className="text-xs text-gray-500">MakerPay sizning serveringizga shu formatda yuboradi</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('request')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'request' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
              So'rov
            </button>
            <button onClick={() => setActiveTab('response')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'response' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
              Javob
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-3 right-4">
            <CopyBtn text={activeTab === 'request' ? SAMPLE_REQUEST : SAMPLE_RESPONSE} />
          </div>
          <pre className="p-6 text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
            {activeTab === 'request' ? SAMPLE_REQUEST : SAMPLE_RESPONSE}
          </pre>
        </div>

        {/* Signature verification */}
        <div className="border-t border-white/10 px-6 py-4 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-yellow-400 mb-1">Imzoni tekshirish (muhim!)</p>
              <pre className="text-xs text-gray-400 font-mono leading-relaxed">{`// Node.js
const crypto = require('crypto');
const signature = req.headers['x-makerpay-signature'];
const expected = 'sha256=' + crypto
  .createHmac('sha256', process.env.MAKERPAY_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
if (signature !== expected) return res.status(401).send('Invalid');`}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* ── Webhook logs ── */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white">Webhook loglar</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-500">{logs.filter((l: any) => l.status === 'delivered').length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-gray-500">{logs.filter((l: any) => l.status === 'failed').length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-gray-500">{logs.filter((l: any) => l.status === 'pending').length}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Yo\'nalish', 'Hodisa', 'Provayder', 'Status', 'Javob', 'Urinish', 'Sana'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.direction === 'inbound' ? 'bg-blue-900/50 text-blue-400' : 'bg-purple-900/50 text-purple-400'}`}>
                      {log.direction === 'inbound' ? '↓ Kiruvchi' : '↑ Chiquvchi'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-xs bg-white/5 px-2 py-0.5 rounded font-mono text-gray-300">{log.eventType}</code>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{log.providerName || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={statusBadgeClass(log.status)}>{statusLabel(log.status)}</span>
                  </td>
                  <td className="py-3 px-4">
                    {log.responseStatus ? (
                      <span className={`font-mono text-xs font-semibold ${log.responseStatus < 300 ? 'text-green-400' : 'text-red-400'}`}>
                        {log.responseStatus}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{log.attemptCount}/{log.maxAttempts}</td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!logs.length && !isLoading && (
            <div className="text-center py-12">
              <Webhook className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Webhook log yo'q</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
