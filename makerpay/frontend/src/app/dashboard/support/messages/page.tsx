'use client';
import { useState } from 'react';
import { Send, Bot, CheckCircle, Copy, Check, AlertCircle, Users, MessageSquare } from 'lucide-react';

const MOCK_HISTORY = [
  { id: 1, merchant: 'Ali Valiyev',    text: "Tizimda texnik ishlar olib borilmoqda. 30 daqiqadan keyin to'liq ishlaydi.", time: '2026-04-20 10:15', status: 'delivered' },
  { id: 2, merchant: 'Sardor Rahimov', text: "API kalitingiz yangilandi. Iltimos, tizimga qayta kiring.", time: '2026-04-20 09:30', status: 'delivered' },
  { id: 3, merchant: 'Barchasi',       text: "Texnik xizmat ko'rsatish: 20:00-22:00 da tizim vaqtincha to'xtatiladi.", time: '2026-04-19 18:00', status: 'delivered' },
];

const MOCK_MERCHANTS = ['Ali Valiyev', 'Sardor Rahimov', 'Bobur Toshmatov', 'Jasur Mirzayev', 'Dilnoza Karimova'];

function CopyBtn({ text }: { text: string }) {
  const [c, setC] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 2000); }}
      className="text-gray-500 hover:text-white transition-colors">
      {c ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function MessagesPage() {
  const [botToken, setBotToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | boolean>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ merchant: 'Barchasi', text: '' });
  const [history, setHistory] = useState(MOCK_HISTORY);

  const saveToken = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const testBot = async () => {
    setTesting(true); setTestResult(null);
    await new Promise(r => setTimeout(r, 1500));
    setTestResult(botToken.length > 10);
    setTesting(false);
  };

  const sendMsg = () => {
    if (!form.text.trim()) return;
    const now = new Date();
    setHistory([{ id: Date.now(), merchant: form.merchant, text: form.text, time: now.toLocaleString('uz-UZ').slice(0, 16), status: 'delivered' }, ...history]);
    setForm({ ...form, text: '' });
    setShowModal(false);
  };

  const webhookUrl = 'https://api.makerpay.uz/telegram/webhook';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Telegram xabar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Merchantlarga Telegram orqali xabar yuboring</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all">
          <Send className="w-4 h-4" /> Xabar yuborish
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot setup */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Telegram Bot sozlamasi</div>
              <div className="text-xs text-gray-500">@MakerPayBot</div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {[
              { n: '1', t: "@BotFather ga yozing", d: "Telegram da @BotFather ni toping va /newbot buyrug'ini yuboring" },
              { n: '2', t: "Bot nomini kiriting",   d: "MakerPay Support Bot kabi nom bering" },
              { n: '3', t: "Token oling",            d: "BotFather sizga token beradi — quyiga kiriting" },
              { n: '4', t: "Webhook sozlang",        d: "Quyidagi URL ni BotFather ga belgilang" },
            ].map(({ n, t, d }) => (
              <div key={n} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">{n}</div>
                <div>
                  <div className="text-sm font-medium text-white">{t}</div>
                  <div className="text-xs text-gray-500">{d}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Webhook URL */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Webhook URL</div>
              <code className="text-xs text-blue-400 font-mono">{webhookUrl}</code>
            </div>
            <CopyBtn text={webhookUrl} />
          </div>

          {/* Token input */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bot Token</label>
            <input value={botToken} onChange={e => setBotToken(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-white/25 transition-all"
              placeholder="1234567890:ABCdefGHI..." />
          </div>

          {testResult !== null && (
            <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${testResult ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {testResult ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {testResult ? 'Bot muvaffaqiyatli ulandi!' : "Bot ulanmadi. Tokenni tekshiring."}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={testBot} disabled={!botToken || testing}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white hover:border-white/20 transition-all disabled:opacity-40">
              {testing ? 'Tekshirilmoqda...' : 'Test qilish'}
            </button>
            <button onClick={saveToken}
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
              {saved ? <><CheckCircle className="w-4 h-4 text-green-600" /> Saqlandi!</> : 'Saqlash'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MessageSquare, label: "Yuborilgan xabarlar", value: history.length, clr: 'text-blue-400' },
              { icon: Users,         label: "Ulangan merchantlar", value: 0,              clr: 'text-green-400' },
            ].map(({ icon: Icon, label, value, clr }) => (
              <div key={label} className="bg-[#111] border border-white/10 rounded-2xl p-5">
                <Icon className={`w-5 h-5 ${clr} mb-3`} />
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
            <Bot className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-200/80 leading-relaxed">
              <span className="font-semibold text-blue-400">Qanday ishlaydi:</span> Merchantlar Telegram botini start qilganda ularning chat ID si tizimda saqlanadi. Siz esa bu yerdan ularga xabar yuborishingiz mumkin.
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white">Yuborilgan xabarlar tarixi</h2>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Hali xabar yuborilmagan</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {history.map(h => (
              <div key={h.id} className="flex items-start justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{h.merchant}</span>
                      <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">Yetkazildi</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 max-w-md truncate">{h.text}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 shrink-0">{h.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-white">Xabar yuborish</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kimga</label>
                <select value={form.merchant} onChange={e => setForm({ ...form, merchant: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/25 transition-all">
                  <option value="Barchasi">Barcha merchantlar</option>
                  {MOCK_MERCHANTS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Xabar matni</label>
                <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/25 transition-all resize-none"
                  placeholder="Xabar yozing..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-semibold hover:text-white transition-colors">Bekor</button>
                <button onClick={sendMsg} disabled={!form.text.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                  <Send className="w-4 h-4" /> Yuborish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
