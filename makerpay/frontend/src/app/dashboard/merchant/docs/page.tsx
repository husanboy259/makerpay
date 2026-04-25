'use client';
import { useState } from 'react';
import {
  Copy, Check, Key, Webhook, CreditCard, AlertCircle,
  RefreshCw, BookOpen, Zap, ChevronRight, Terminal,
  Code2, Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

/* ── Code block ─────────────────────────────────────── */
function CodeBlock({ code, lang = 'bash', title }: { code: string; lang?: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const keywords: Record<string, string[]> = {
    json:       ['"event"','"paymentId"','"status"','"amount"','"currency"','"externalOrderId"','"paidAt"','"metadata"','"id"','"paymentUrl"','"createdAt"','"providerName"','"customerName"','"data"','"message"','"error"'],
    javascript: ['const','function','return','require','crypto','Buffer','true','false','if','let','await','async'],
    php:        ['<?php','function','return','$','echo','if','true','false','hash_hmac','hash_equals'],
    python:     ['import','def','return','if','True','False','hmac','hashlib'],
  };
  const kw = keywords[lang] || [];

  const highlight = (line: string) => {
    let parts: React.ReactNode[] = [line];
    // strings
    parts = [line.replace(/"([^"]+)"(?=\s*:)/g, '<span class="text-blue-400">"$1"</span>')
                  .replace(/:\s*"([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
                  .replace(/:\s*(\d+)/g, ': <span class="text-orange-400">$1</span>')
                  .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-400">$1</span>')];
    return <span dangerouslySetInnerHTML={{ __html: parts[0] as string }} />;
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-500 font-mono">{title || lang}</span>
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Nusxa olindi!' : 'Nusxa olish'}
        </button>
      </div>
      <pre className="p-4 text-sm text-gray-300 overflow-x-auto font-mono leading-relaxed whitespace-pre">
        {lang === 'json'
          ? code.split('\n').map((line, i) => <div key={i}>{highlight(line)}</div>)
          : code}
      </pre>
    </div>
  );
}

/* ── Endpoint badge ─────────────────────────────────── */
function Method({ method }: { method: string }) {
  const colors: Record<string, string> = {
    POST:   'bg-green-500/10 text-green-400 border-green-500/20',
    GET:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PUT:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-black border ${colors[method] || ''}`}>{method}</span>
  );
}

/* ── Param table ─────────────────────────────────────── */
function ParamTable({ rows }: { rows: [string, string, string, boolean?][] }) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Maydon</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tur</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tavsif</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Majburiy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([field, type, desc, req = true]) => (
            <tr key={field} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3"><code className="text-blue-400 text-xs font-mono">{field}</code></td>
              <td className="px-4 py-3"><span className="text-orange-400 text-xs font-mono">{type}</span></td>
              <td className="px-4 py-3 text-gray-400 text-xs">{desc}</td>
              <td className="px-4 py-3">
                {req
                  ? <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">Ha</span>
                  : <span className="text-xs bg-white/5 text-gray-500 border border-white/10 px-2 py-0.5 rounded-full">Yo'q</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Sections ─────────────────────────────────────────── */
const BASE_URL = 'https://api.makerpay.uz/api/v1';

const NAV = [
  { id: 'quickstart', label: 'Tezkor boshlash',     icon: Zap },
  { id: 'auth',       label: 'Autentifikatsiya',    icon: Key },
  { id: 'create',     label: "To'lov yaratish",     icon: CreditCard },
  { id: 'status',     label: 'Status tekshirish',   icon: RefreshCw },
  { id: 'refund',     label: 'Qaytarish',           icon: RefreshCw },
  { id: 'webhook',    label: 'Webhook sozlash',      icon: Webhook },
  { id: 'wh-verify',  label: 'Imzo tekshirish',     icon: Code2 },
  { id: 'errors',     label: 'Xato kodlari',        icon: AlertCircle },
];

export default function DocsPage() {
  const { user } = useAuthStore();
  const [active, setActive] = useState('quickstart');
  const [whLang, setWhLang] = useState<'js' | 'php' | 'python'>('js');

  const apiKeyDemo = 'mpk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  const content: Record<string, React.ReactNode> = {

    /* ── QUICK START ── */
    quickstart: (
      <div className="space-y-6">
        <p className="text-gray-400 text-sm leading-relaxed">
          MakerPay API orqali 3 ta qadamda to'lov qabul qilishni boshlang. Barcha so'rovlar <code className="text-blue-400 font-mono text-xs">{BASE_URL}</code> manziliga yuboriladi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { n: '01', t: 'API kalit oling', d: "Dashboard → API Kalitlar bo'limidan yangi kalit yarating." },
            { n: '02', t: "To'lov yarating", d: "POST /payments/create endpoint'iga so'rov yuboring." },
            { n: '03', t: 'Webhook qabul qiling', d: "To'lov holatini webhook orqali real vaqtda oling." },
          ].map(({ n, t, d }) => (
            <div key={n} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-3xl font-black text-white/10 mb-3">{n}</div>
              <div className="font-bold text-white text-sm mb-1.5">{t}</div>
              <div className="text-gray-500 text-xs leading-relaxed">{d}</div>
            </div>
          ))}
        </div>

        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
          <Globe className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-blue-400 mb-1">Base URL</div>
            <code className="text-sm font-mono text-gray-300">{BASE_URL}</code>
          </div>
        </div>

        <CodeBlock lang="curl" title="Birinchi so'rov — misol" code={`curl -X POST ${BASE_URL}/payments/create \\
  -H "Authorization: Bearer mpk_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "UZS",
    "externalOrderId": "ORDER-001",
    "description": "Test to\\u2018lov",
    "returnUrl": "https://yoursite.uz/success",
    "callbackUrl": "https://yoursite.uz/api/webhook"
  }'`} />
      </div>
    ),

    /* ── AUTH ── */
    auth: (
      <div className="space-y-5">
        <p className="text-gray-400 text-sm leading-relaxed">
          Barcha API so'rovlarda <code className="text-blue-400 font-mono text-xs">Authorization</code> headeri orqali API kalitingizni yuboring.
        </p>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-200/80 leading-relaxed">
            API kalitingizni hech qachon frontend kodi yoki ommaviy repositoriyada saqlamang. Faqat server tomonida ishlating.
          </div>
        </div>

        <CodeBlock lang="http" title="Header format" code={`Authorization: Bearer mpk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="text-sm font-semibold text-white">Kalit turlari</div>
          {[
            { prefix: 'mpk_live_', color: 'text-green-400', name: 'Live kalit', desc: "Haqiqiy to'lovlar uchun. Ehtiyotkorlik bilan foydalaning." },
            { prefix: 'mpk_test_', color: 'text-yellow-400', name: 'Test kalit', desc: 'Ishlab chiqish muhiti uchun. Haqiqiy pul aylanmaydi.' },
          ].map(k => (
            <div key={k.prefix} className="flex items-start gap-3">
              <code className={`text-xs font-mono ${k.color} shrink-0 mt-0.5`}>{k.prefix}…</code>
              <div>
                <div className="text-sm font-medium text-white">{k.name}</div>
                <div className="text-xs text-gray-500">{k.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    /* ── CREATE PAYMENT ── */
    create: (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Method method="POST" />
          <code className="text-sm font-mono text-gray-300">/payments/create</code>
        </div>

        <p className="text-gray-400 text-sm">Yangi to'lov yarating. Javobda <code className="text-blue-400 font-mono text-xs">paymentUrl</code> oling va mijozni shu manzilga yo'naltiring.</p>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">So'rov parametrlari</div>
          <ParamTable rows={[
            ['amount',         'number',  "To'lov miqdori (tiyin yoki so'm). Minimum: 100",   true],
            ['currency',       'string',  '"UZS" — hozircha yagona qiymat',                   true],
            ['externalOrderId','string',  "Sizning tizimingizda buyurtma ID. Takrorlanmasin.", true],
            ['description',    'string',  "To'lov tavsifi (saytda ko'rinadi)",                true],
            ['returnUrl',      'string',  "To'lovdan keyin mijoz yo'naltiriladi",              true],
            ['callbackUrl',    'string',  "Webhook yuboriladi (server URL bo'lsin)",           true],
            ['customerName',   'string',  "Mijoz ismi",                                       false],
            ['customerPhone',  'string',  "Mijoz tel. +998XXXXXXXXX",                         false],
            ['metadata',       'object',  "Qo'shimcha ma'lumotlar (webhook da qaytadi)",      false],
          ]} />
        </div>

        <CodeBlock lang="json" title="Javob — 201 Created" code={`{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "paymentUrl": "https://pay.tspay.uz/checkout/xyz123",
  "status": "pending",
  "amount": 50000,
  "currency": "UZS",
  "externalOrderId": "ORDER-001",
  "createdAt": "2026-04-20T10:30:00Z"
}`} />

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-400 leading-relaxed">
          <span className="text-white font-semibold">Keyingi qadam:</span> mijozni <code className="text-blue-400 font-mono">paymentUrl</code> ga yo'naltiring. To'lov yakunlanganida <code className="text-blue-400 font-mono">callbackUrl</code> ga avtomatik POST keladi.
        </div>
      </div>
    ),

    /* ── STATUS ── */
    status: (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Method method="GET" />
          <code className="text-sm font-mono text-gray-300">/payments/:id</code>
        </div>
        <p className="text-gray-400 text-sm">To'lov holatini ID orqali tekshiring.</p>

        <CodeBlock lang="curl" title="So'rov" code={`curl ${BASE_URL}/payments/a1b2c3d4-xxxx \\
  -H "Authorization: Bearer mpk_live_xxxx"`} />

        <CodeBlock lang="json" title="Javob" code={`{
  "id": "a1b2c3d4-...",
  "status": "completed",
  "amount": 50000,
  "currency": "UZS",
  "externalOrderId": "ORDER-001",
  "providerName": "tspay",
  "customerName": "Sardor Aliyev",
  "paidAt": "2026-04-20T10:35:22Z",
  "metadata": { "product_id": "P-456" }
}`} />

        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-white/10">Status qiymatlari</div>
          {[
            ['pending',    "To'lov kutilmoqda",  'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'],
            ['processing', 'Jarayonda',           'text-blue-400 bg-blue-500/10 border-blue-500/20'],
            ['completed',  'Muvaffaqiyatli',      'text-green-400 bg-green-500/10 border-green-500/20'],
            ['failed',     'Xato / rad etildi',   'text-red-400 bg-red-500/10 border-red-500/20'],
            ['cancelled',  'Bekor qilindi',       'text-gray-400 bg-white/5 border-white/10'],
            ['refunded',   'Qaytarildi',          'text-purple-400 bg-purple-500/10 border-purple-500/20'],
          ].map(([val, label, cls]) => (
            <div key={val} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{val}</span>
              <span className="text-gray-500 text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),

    /* ── REFUND ── */
    refund: (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Method method="POST" />
          <code className="text-sm font-mono text-gray-300">/payments/:id/refund</code>
        </div>
        <p className="text-gray-400 text-sm">Muvaffaqiyatli to'lovni qaytaring. Provayderdan qaytarish qo'llab-quvvatlanishi kerak.</p>

        <ParamTable rows={[
          ['amount', 'number', "Qaytariladigan miqdor. To'liq yoki qisman bo'lishi mumkin.", true],
          ['reason', 'string', 'Qaytarish sababi (log uchun)',                              false],
        ]} />

        <CodeBlock lang="curl" title="So'rov" code={`curl -X POST ${BASE_URL}/payments/a1b2c3d4-xxxx/refund \\
  -H "Authorization: Bearer mpk_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "reason": "Mijoz talabi bilan"
  }'`} />

        <CodeBlock lang="json" title="Javob" code={`{
  "providerRefundId": "REF-789",
  "status": "processing",
  "amount": 50000
}`} />

        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div className="text-xs text-orange-200/80 leading-relaxed">
            Qaytarish faqat <code className="font-mono">completed</code> statusdagi to'lovlar uchun ishlaydi. Provayder qaytarish imkoniyatini qo'llab-quvvatlamasligi mumkin.
          </div>
        </div>
      </div>
    ),

    /* ── WEBHOOK ── */
    webhook: (
      <div className="space-y-6">
        <p className="text-gray-400 text-sm leading-relaxed">
          To'lov holati o'zgarganda MakerPay sizning <code className="text-blue-400 font-mono text-xs">callbackUrl</code> manziliga HTTP POST so'rov yuboradi. Server 200 qaytarishi kerak, aks holda qayta uriniladi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { e: 'payment.completed',  c: 'text-green-400',  d: "To'lov muvaffaqiyatli yakunlandi" },
            { e: 'payment.failed',     c: 'text-red-400',    d: "To'lov rad etildi yoki xato" },
            { e: 'payment.cancelled',  c: 'text-gray-400',   d: "To'lov bekor qilindi" },
            { e: 'payment.refunded',   c: 'text-purple-400', d: "To'lov qaytarildi" },
          ].map(({ e, c, d }) => (
            <div key={e} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
              <Webhook className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <div>
                <code className={`text-xs font-mono font-semibold ${c}`}>{e}</code>
                <div className="text-xs text-gray-500 mt-0.5">{d}</div>
              </div>
            </div>
          ))}
        </div>

        <CodeBlock lang="json" title="Webhook payload (POST body)" code={`{
  "event": "payment.completed",
  "paymentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "externalOrderId": "ORDER-001",
  "status": "completed",
  "amount": 50000,
  "currency": "UZS",
  "providerName": "tspay",
  "paidAt": "2026-04-20T10:35:22Z",
  "metadata": { "product_id": "P-456" }
}`} />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="text-sm font-semibold text-white">Qayta urinish siyosati</div>
          <div className="space-y-2">
            {[
              ['1-urinish', 'Darhol'],
              ['2-urinish', '5 daqiqadan keyin'],
              ['3-urinish', '30 daqiqadan keyin'],
              ['4-urinish', '2 soatdan keyin'],
              ['5-urinish', '24 soatdan keyin — oxirgi'],
            ].map(([attempt, time]) => (
              <div key={attempt} className="flex items-center gap-3 text-xs">
                <span className="text-gray-600 w-24 shrink-0">{attempt}</span>
                <ChevronRight className="w-3 h-3 text-gray-700" />
                <span className="text-gray-400">{time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-200/80 leading-relaxed">
          <span className="font-semibold text-blue-400">Muhim:</span> Webhook URL server tomonida bo'lishi va tashqi tarmoqdan ko'rinishi kerak (localhost qabul qilinmaydi). Javob kodi 200–299 oralig'ida bo'lsin.
        </div>
      </div>
    ),

    /* ── WEBHOOK VERIFY ── */
    'wh-verify': (
      <div className="space-y-5">
        <p className="text-gray-400 text-sm leading-relaxed">
          Webhook so'rovining MakerPay'dan kelganini tasdiqlash uchun <code className="text-blue-400 font-mono text-xs">X-MakerPay-Signature</code> headerini tekshiring. Webhook secret-ni API Kalitlar bo'limidan oling.
        </p>

        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-red-200/80 leading-relaxed">
            Imzo tekshirmasangiz, uchinchi tomon sizning serveringizga soxta webhook yuborishi mumkin. <strong>Har doim tekshiring.</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 border border-white/10 rounded-xl overflow-hidden bg-white/5 w-fit">
          {(['js','php','python'] as const).map(l => (
            <button key={l} onClick={() => setWhLang(l)}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${whLang === l ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
              {l === 'js' ? 'Node.js' : l === 'php' ? 'PHP' : 'Python'}
            </button>
          ))}
        </div>

        {whLang === 'js' && (
          <CodeBlock lang="javascript" title="Node.js / Express" code={`const crypto = require('crypto');

// Webhook secret-ni .env dan oling
const WEBHOOK_SECRET = process.env.MAKERPAY_WEBHOOK_SECRET;

app.post('/api/webhook', (req, res) => {
  const signature = req.headers['x-makerpay-signature'];
  const body      = JSON.stringify(req.body);

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  const valid = crypto.timingSafeEqual(
    Buffer.from(signature || ''),
    Buffer.from(expected)
  );

  if (!valid) return res.status(401).json({ error: 'Invalid signature' });

  const { event, paymentId, externalOrderId, status } = req.body;

  if (event === 'payment.completed') {
    // Buyurtmani tasdiqlang
    await db.orders.update(externalOrderId, { status: 'paid' });
  }

  res.status(200).json({ received: true });
});`} />
        )}

        {whLang === 'php' && (
          <CodeBlock lang="php" title="PHP" code={`<?php
$webhookSecret = getenv('MAKERPAY_WEBHOOK_SECRET');

$rawBody  = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_MAKERPAY_SIGNATURE'] ?? '';

$expected = hash_hmac('sha256', $rawBody, $webhookSecret);

if (!hash_equals($expected, $signature)) {
    http_response_code(401);
    exit('Invalid signature');
}

$payload = json_decode($rawBody, true);

if ($payload['event'] === 'payment.completed') {
    // Buyurtmani tasdiqlang
    $db->orders->update(
        ['status' => 'paid'],
        ['external_order_id' => $payload['externalOrderId']]
    );
}

http_response_code(200);
echo json_encode(['received' => true]);`} />
        )}

        {whLang === 'python' && (
          <CodeBlock lang="python" title="Python / FastAPI" code={`import hmac
import hashlib
import json
import os
from fastapi import Request, HTTPException

WEBHOOK_SECRET = os.getenv("MAKERPAY_WEBHOOK_SECRET")

@app.post("/api/webhook")
async def handle_webhook(request: Request):
    body      = await request.body()
    signature = request.headers.get("x-makerpay-signature", "")

    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = json.loads(body)

    if payload["event"] == "payment.completed":
        # Buyurtmani tasdiqlang
        await db.orders.update(
            {"status": "paid"},
            {"external_order_id": payload["externalOrderId"]}
        )

    return {"received": True}`} />
        )}
      </div>
    ),

    /* ── ERRORS ── */
    errors: (
      <div className="space-y-5">
        <p className="text-gray-400 text-sm">Barcha xatolar quyidagi formatda qaytariladi:</p>

        <CodeBlock lang="json" title="Xato javobi" code={`{
  "statusCode": 400,
  "message": "amount must be a positive number",
  "error": "Bad Request"
}`} />

        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">HTTP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sabab</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Yechim</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['400', 'Bad Request',          "So'rov parametrlari noto'g'ri",             'text-orange-400'],
                ['401', 'Unauthorized',         "API kalit yo'q yoki noto'g'ri",              'text-red-400'],
                ['403', 'Forbidden',            "Bu resursga ruxsatingiz yo'q",               'text-red-400'],
                ['404', 'Not Found',            "Resurs topilmadi",                           'text-yellow-400'],
                ['409', 'Conflict',             "externalOrderId allaqachon ishlatilgan",      'text-orange-400'],
                ['429', 'Too Many Requests',    "Rate limit: 200 req/min. Biroz kuting.",     'text-yellow-400'],
                ['500', 'Internal Server Error','MakerPay server xatosi. Qayta urinib ko\'ring.', 'text-red-400'],
              ].map(([code, name, fix, cls]) => (
                <tr key={code} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex text-xs font-black font-mono ${cls}`}>{code}</span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-300 text-xs font-medium">{name}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="text-sm font-semibold text-white">Rate limiting</div>
          <div className="text-xs text-gray-400 leading-relaxed">
            Har bir API kalit uchun <strong className="text-white">200 so'rov/daqiqa</strong> chekovi qo'yilgan.
            Limit oshganda <code className="text-orange-400 font-mono text-xs">Retry-After</code> header qaytariladi — u soniyalarda kutish vaqtini bildiradi.
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="flex gap-6 min-h-[calc(100vh-100px)]">

      {/* ── Sidebar nav ── */}
      <div className="w-52 shrink-0">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-3 sticky top-6 space-y-0.5">
          <div className="px-3 py-2 mb-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">API Docs</span>
            </div>
          </div>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActive(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active === id ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-left leading-tight">{label}</span>
            </button>
          ))}

          <div className="mt-3 pt-3 border-t border-white/10 px-3">
            <div className="text-xs text-gray-600">v1.0 · REST · JSON</div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Header bar */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-5 flex flex-wrap items-center gap-6">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Base URL</div>
            <code className="text-sm font-mono text-blue-400">{BASE_URL}</code>
          </div>
          <div className="w-px h-8 bg-white/10 hidden md:block" />
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Format</div>
            <code className="text-sm font-mono text-gray-300">JSON · UTF-8</code>
          </div>
          <div className="w-px h-8 bg-white/10 hidden md:block" />
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Rate limit</div>
            <code className="text-sm font-mono text-gray-300">200 req/min</code>
          </div>
          <div className="w-px h-8 bg-white/10 hidden md:block" />
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">SSL</div>
            <code className="text-sm font-mono text-green-400">TLS 1.3</code>
          </div>
        </div>

        {/* Section content */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
            {(() => {
              const nav = NAV.find(n => n.id === active);
              if (!nav) return null;
              const Icon = nav.icon;
              return (
                <>
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-white">{nav.label}</h1>
                </>
              );
            })()}
          </div>
          {content[active]}
        </div>

      </div>
    </div>
  );
}
