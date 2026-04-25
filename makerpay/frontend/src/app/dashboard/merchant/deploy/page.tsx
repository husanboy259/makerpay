'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, Rocket, Code2, Eye, Palette, Zap, Globe, Settings2 } from 'lucide-react';
import { providersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

/* ── Copy button ─────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Nusxa olindi!' : 'Nusxa olish'}
    </button>
  );
}

/* ── Widget preview ──────────────────────────────────── */
function WidgetPreview({ cfg }: { cfg: any }) {
  const btnStyle: React.CSSProperties = {
    background: cfg.btnColor,
    color: cfg.textColor,
    borderRadius: cfg.rounded === 'full' ? '9999px' : cfg.rounded === 'lg' ? '12px' : '6px',
    padding: cfg.size === 'lg' ? '14px 32px' : cfg.size === 'sm' ? '8px 18px' : '11px 24px',
    fontSize: cfg.size === 'lg' ? '16px' : cfg.size === 'sm' ? '13px' : '14px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    transition: 'all 0.2s',
  };

  return (
    <div className="bg-[#0d0d0d] rounded-2xl border border-white/10 p-8 flex items-center justify-center min-h-[180px]">
      <div className="text-center space-y-4">
        {cfg.showAmount && cfg.amount && (
          <div className="text-2xl font-bold text-white">
            {Number(cfg.amount).toLocaleString()} {cfg.currency}
          </div>
        )}
        {cfg.description && (
          <div className="text-sm text-gray-500">{cfg.description}</div>
        )}
        <button style={btnStyle}>
          {cfg.showIcon && <Zap style={{ width: 16, height: 16 }} />}
          {cfg.btnText}
        </button>
      </div>
    </div>
  );
}

/* ── Code generator ──────────────────────────────────── */
function generateCode(cfg: any, apiKey: string, type: 'html' | 'react' | 'js') {
  const base = 'https://api.makerpay.uz';

  if (type === 'html') {
    return `<!-- MakerPay Widget -->
<div id="makerpay-btn"></div>
<script src="${base}/widget/v1/makerpay.js"></script>
<script>
  MakerPay.render('#makerpay-btn', {
    apiKey:      '${apiKey || 'mpk_live_xxxx'}',
    amount:      ${cfg.amount || 0},
    currency:    '${cfg.currency}',
    description: '${cfg.description}',
    btnText:     '${cfg.btnText}',
    btnColor:    '${cfg.btnColor}',
    textColor:   '${cfg.textColor}',
    rounded:     '${cfg.rounded}',
    size:        '${cfg.size}',
    onSuccess: function(payment) {
      console.log('To\\'lov muvaffaqiyatli:', payment.id);
    },
    onError: function(err) {
      console.error('Xato:', err.message);
    }
  });
</script>`;
  }

  if (type === 'react') {
    return `import { MakerPayButton } from '@makerpay/react';

export default function CheckoutPage() {
  return (
    <MakerPayButton
      apiKey="${apiKey || 'mpk_live_xxxx'}"
      amount={${cfg.amount || 0}}
      currency="${cfg.currency}"
      description="${cfg.description}"
      btnText="${cfg.btnText}"
      btnColor="${cfg.btnColor}"
      textColor="${cfg.textColor}"
      rounded="${cfg.rounded}"
      size="${cfg.size}"
      onSuccess={(payment) => {
        console.log('To\\'lov muvaffaqiyatli:', payment.id);
      }}
      onError={(err) => console.error(err)}
    />
  );
}`;
  }

  return `// MakerPay JS SDK
const { MakerPay } = require('@makerpay/sdk');

const mp = new MakerPay('${apiKey || 'mpk_live_xxxx'}');

const payment = await mp.payments.create({
  amount:      ${cfg.amount || 0},
  currency:    '${cfg.currency}',
  description: '${cfg.description}',
  returnUrl:   'https://yoursite.uz/success',
  callbackUrl: 'https://yoursite.uz/api/webhook',
});

// Foydalanuvchini to'lov sahifasiga yo'naltiring
window.location.href = payment.paymentUrl;`;
}

/* ── Main page ───────────────────────────────────────── */
const TABS = [
  { id: 'widget',  label: 'Widget',   icon: Palette },
  { id: 'html',    label: 'HTML',     icon: Code2 },
  { id: 'react',   label: 'React',    icon: Code2 },
  { id: 'js',      label: 'Node.js',  icon: Code2 },
];

export default function DeployPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'widget' | 'html' | 'react' | 'js'>('widget');
  const [cfg, setCfg] = useState({
    amount:      '50000',
    currency:    'UZS',
    description: "Mahsulot uchun to'lov",
    btnText:     "To'lash",
    btnColor:    '#ffffff',
    textColor:   '#000000',
    rounded:     'lg',
    size:        'md',
    showAmount:  true,
    showIcon:    true,
  });

  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => fetch('/api/providers/keys', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).catch(() => []),
  });
  const apiKey = (apiKeys as any)?.[0]?.keyPrefix ? `${(apiKeys as any)[0].keyPrefix}...` : 'mpk_live_xxxx';

  const code = generateCode(cfg, apiKey, tab === 'widget' ? 'html' : tab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
          <Rocket className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Deploy & Integratsiya</h1>
          <p className="text-sm text-gray-500 mt-0.5">To'lov widget va SDK ni saytingizga joylashtiring</p>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { n: '01', icon: Settings2, t: 'Sozlang',    d: 'Widget ko\'rinishini va summasini belgilang' },
          { n: '02', icon: Code2,     t: 'Kodni oling', d: 'HTML, React yoki JS formatda embed kodni nusxalang' },
          { n: '03', icon: Globe,     t: 'Joylashtiring',d: 'Saytingizga kodni qo\'shib, to\'lov qabul qiling' },
        ].map(({ n, icon: Icon, t, d }) => (
          <div key={n} className="bg-[#111] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="text-xs text-gray-600 font-mono mb-0.5">{n}</div>
              <div className="text-sm font-bold text-white">{t}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{d}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Left: Configurator ── */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-400" /> Widget sozlamalari
          </h2>

          {/* Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Summa</label>
              <input type="number" value={cfg.amount}
                onChange={e => setCfg({ ...cfg, amount: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-white/30 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Valyuta</label>
              <select value={cfg.currency} onChange={e => setCfg({ ...cfg, currency: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-white/30 focus:outline-none transition-all">
                <option value="UZS">UZS — So'm</option>
                <option value="USD">USD — Dollar</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tavsif</label>
            <input value={cfg.description} onChange={e => setCfg({ ...cfg, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-white/30 focus:outline-none transition-all"
              placeholder="To'lov tavsifi" />
          </div>

          {/* Button text */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tugma matni</label>
            <input value={cfg.btnText} onChange={e => setCfg({ ...cfg, btnText: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-white/30 focus:outline-none transition-all" />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tugma rangi</label>
              <div className="flex items-center gap-2">
                <input type="color" value={cfg.btnColor} onChange={e => setCfg({ ...cfg, btnColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                <span className="text-xs text-gray-400 font-mono">{cfg.btnColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Matn rangi</label>
              <div className="flex items-center gap-2">
                <input type="color" value={cfg.textColor} onChange={e => setCfg({ ...cfg, textColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                <span className="text-xs text-gray-400 font-mono">{cfg.textColor}</span>
              </div>
            </div>
          </div>

          {/* Shape & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Shakl</label>
              <div className="flex gap-2">
                {[['sm','Kichik'],['lg','O\'rta'],['full','Yumaloq']].map(([v,l]) => (
                  <button key={v} onClick={() => setCfg({ ...cfg, rounded: v })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${cfg.rounded === v ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:text-white'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">O'lcham</label>
              <div className="flex gap-2">
                {[['sm','S'],['md','M'],['lg','L']].map(([v,l]) => (
                  <button key={v} onClick={() => setCfg({ ...cfg, size: v })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${cfg.size === v ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:text-white'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            {[
              { key: 'showAmount', label: 'Summani ko\'rsat' },
              { key: 'showIcon',   label: 'Ikonka ko\'rsat' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <div className={`w-9 h-5 rounded-full transition-colors relative ${(cfg as any)[key] ? 'bg-white' : 'bg-white/10'}`}
                  onClick={() => setCfg({ ...cfg, [key]: !(cfg as any)[key] })}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${(cfg as any)[key] ? 'bg-black translate-x-4' : 'bg-white/40 translate-x-0.5'}`} />
                </div>
                <span className="text-xs text-gray-400">{label}</span>
              </label>
            ))}
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tezkor stil</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Oq',        btnColor: '#ffffff', textColor: '#000000' },
                { label: 'Qora',      btnColor: '#000000', textColor: '#ffffff' },
                { label: 'Ko\'k',     btnColor: '#2563EB', textColor: '#ffffff' },
                { label: 'Yashil',    btnColor: '#16A34A', textColor: '#ffffff' },
                { label: 'To\'q sariq', btnColor: '#D97706', textColor: '#ffffff' },
              ].map(p => (
                <button key={p.label} onClick={() => setCfg({ ...cfg, ...p })}
                  style={{ background: p.btnColor, color: p.textColor, border: '1px solid rgba(255,255,255,0.15)' }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Preview + Code ── */}
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-white">Ko'rinish</span>
            </div>
            <WidgetPreview cfg={cfg} />
          </div>

          {/* Code tabs */}
          <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center border-b border-white/10 bg-white/5">
              {TABS.filter(t => t.id !== 'widget').map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${tab === t.id ? 'text-white border-b-2 border-white -mb-px' : 'text-gray-500 hover:text-gray-300'}`}>
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
              <div className="ml-auto pr-3">
                <CopyBtn text={code} />
              </div>
            </div>
            <pre className="p-4 text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre max-h-[340px] overflow-y-auto">{code}</pre>
          </div>

          {/* Info */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
            <Rocket className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-200/80 leading-relaxed">
              <span className="font-semibold text-blue-400">npm paketi yaqinda!</span>{' '}
              <code className="font-mono">@makerpay/react</code> va <code className="font-mono">@makerpay/sdk</code> paketlari tayyorlanmoqda. Hozircha HTML snippet yoki to'g'ridan to'g'ri API integratsiyasidan foydalaning.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
