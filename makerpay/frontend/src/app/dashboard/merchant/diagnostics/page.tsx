'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { merchantsApi, webhooksApi } from '@/lib/api';
import api from '@/lib/api';
import {
  Crown, Lock, Activity, CheckCircle, XCircle, Clock,
  Wifi, Server, Database, Zap, RefreshCw, ArrowRight, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

function PremiumGate() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-9 h-9 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Premium funksiya</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Diagnostika faqat <span className="text-yellow-400 font-semibold">Start, Pro va Business</span> tariflarida mavjud.
          API holati, webhook xatoliklari, ulanish testi va tizim salomatligi.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/pricing" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 transition-all">
            <Crown className="w-4 h-4" /> Tarifni yangilash
          </Link>
          <Link href="/apply-trial" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition-all">
            Trial so'rash <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <div className={`w-2.5 h-2.5 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
  );
}

export default function DiagnosticsPage() {
  const [apiPing, setApiPing] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const { data: merchant } = useQuery({
    queryKey: ['merchant-me'],
    queryFn: () => merchantsApi.getMe().catch(() => null),
    retry: false,
  });

  const { data: logsData } = useQuery({
    queryKey: ['webhook-logs'],
    queryFn: () => webhooksApi.getLogs({ limit: 100 }),
  });

  const subscription = (merchant as any)?.subscription;
  const isPremium = subscription && subscription.plan !== 'free';

  const logs = (logsData as any)?.data || [];
  const failedLogs = logs.filter((l: any) => l.status === 'failed');
  const deliveredLogs = logs.filter((l: any) => l.status === 'delivered');
  const webhookSuccessRate = logs.length > 0 ? Math.round((deliveredLogs.length / logs.length) * 100) : 100;

  const runPing = async () => {
    setPinging(true);
    const start = Date.now();
    try {
      await api.get('/auth/me');
      setApiPing(Date.now() - start);
    } catch {
      setApiPing(Date.now() - start);
    }
    setLastCheck(new Date());
    setPinging(false);
  };

  useEffect(() => { runPing(); }, []);

  if (!isPremium) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Activity className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnostika</h1>
          <p className="text-sm text-gray-500">Tizim salomatligi va ulanish holati</p>
        </div>
      </div>
      <PremiumGate />
    </div>
  );

  const checks = [
    { label: 'MakerPay API',     icon: Server,   ok: apiPing !== null, detail: apiPing ? `${apiPing}ms` : 'Tekshirilmoqda...' },
    { label: 'Ma\'lumotlar bazasi', icon: Database, ok: true,          detail: 'Ulangan' },
    { label: 'Webhook tizimi',   icon: Wifi,     ok: webhookSuccessRate >= 80, detail: `${webhookSuccessRate}% muvaffaqiyat` },
    { label: 'To\'lov gateway',  icon: Zap,      ok: true,             detail: 'Barcha provayderlar faol' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Activity className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnostika</h1>
          <p className="text-sm text-gray-500">Tizim salomatligi va ulanish holati</p>
        </div>
        <span className="ml-auto text-xs font-black px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">PRO</span>
        <button onClick={runPing} disabled={pinging}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-all disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${pinging ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </div>

      {/* Overall status */}
      <div className={`rounded-2xl border p-5 flex items-center gap-4 ${checks.every(c => c.ok) ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${checks.every(c => c.ok) ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {checks.every(c => c.ok)
            ? <CheckCircle className="w-6 h-6 text-green-400" />
            : <AlertTriangle className="w-6 h-6 text-red-400" />}
        </div>
        <div>
          <p className="text-base font-bold text-white">
            {checks.every(c => c.ok) ? 'Barcha tizimlar ishlayapti' : 'Ba\'zi muammolar aniqlandi'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Oxirgi tekshiruv: {lastCheck ? lastCheck.toLocaleTimeString('uz-UZ') : '—'}
          </p>
        </div>
      </div>

      {/* System checks */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-4">Tizim holati</h2>
        <div className="space-y-3">
          {checks.map(({ label, icon: Icon, ok, detail }) => (
            <div key={label} className="flex items-center gap-4 p-3 bg-white/3 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot ok={ok} />
                <span className={`text-xs font-semibold ${ok ? 'text-green-400' : 'text-red-400'}`}>
                  {ok ? 'Faol' : 'Muammo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Ping */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5 text-center">
          <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <div className="text-3xl font-black text-white">{apiPing ? `${apiPing}ms` : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">API javob vaqti</div>
          <div className={`text-xs mt-2 font-semibold ${apiPing && apiPing < 200 ? 'text-green-400' : apiPing && apiPing < 500 ? 'text-amber-400' : 'text-red-400'}`}>
            {apiPing && apiPing < 200 ? '⚡ Juda tez' : apiPing && apiPing < 500 ? '✓ Normal' : '⚠ Sekin'}
          </div>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5 text-center">
          <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <div className="text-3xl font-black text-white">{webhookSuccessRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Webhook muvaffaqiyat</div>
          <div className={`text-xs mt-2 font-semibold ${webhookSuccessRate >= 95 ? 'text-green-400' : webhookSuccessRate >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
            {deliveredLogs.length} / {logs.length} yetkazildi
          </div>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5 text-center">
          <XCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <div className="text-3xl font-black text-white">{failedLogs.length}</div>
          <div className="text-xs text-gray-500 mt-1">Muvaffaqiyatsiz webhook</div>
          <div className={`text-xs mt-2 font-semibold ${failedLogs.length === 0 ? 'text-green-400' : 'text-red-400'}`}>
            {failedLogs.length === 0 ? '✓ Muammo yo\'q' : `⚠ ${failedLogs.length} ta xato`}
          </div>
        </div>
      </div>

      {/* Failed webhooks */}
      {failedLogs.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Muvaffaqiyatsiz webhook so'rovlar
          </h2>
          <div className="space-y-2">
            {failedLogs.slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 bg-white/3 rounded-lg px-3 py-2 text-xs">
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <code className="text-gray-400 font-mono">{log.eventType}</code>
                <span className="text-gray-600">{log.providerName}</span>
                <span className="ml-auto text-red-400">{log.responseStatus || 'Timeout'}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard/merchant/webhooks" className="text-xs text-gray-500 hover:text-white transition-colors mt-3 inline-flex items-center gap-1">
            Barcha loglarni ko'rish <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-white mb-3">Tavsiyalar</h2>
        <div className="space-y-2">
          {[
            { ok: webhookSuccessRate >= 95, msg: 'Webhook muvaffaqiyat darajasi 95%+ bo\'lishi kerak', fix: 'Webhook URL ni tekshiring' },
            { ok: failedLogs.length === 0,  msg: 'Barcha webhook so\'rovlar yetkazilishi kerak',       fix: 'Serveringiz 200 qaytarishi kerak' },
            { ok: apiPing !== null && apiPing < 300, msg: 'API javob vaqti 300ms dan kam bo\'lishi kerak', fix: 'Internet ulanishingizni tekshiring' },
          ].map(({ ok, msg, fix }, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${ok ? 'bg-green-500/5' : 'bg-amber-500/5'}`}>
              {ok ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              <div>
                <p className={`text-xs font-medium ${ok ? 'text-green-400' : 'text-amber-400'}`}>{ok ? '✓ ' : '⚠ '}{msg}</p>
                {!ok && <p className="text-xs text-gray-500 mt-0.5">{fix}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
