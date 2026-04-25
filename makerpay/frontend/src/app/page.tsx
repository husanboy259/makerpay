'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import {
  Zap, Shield, Globe, ArrowRight, CheckCircle, TrendingUp,
  CreditCard, Webhook, Key, BarChart3, Users, Lock,
  ChevronRight, Star, Play, Menu, X,
} from 'lucide-react';


const FEATURES = [
  { Icon: Globe,    title: 'Unified API',                  desc: "Bitta API orqali barcha to'lov provayderlarini boshqaring.", color: 'from-blue-400 to-cyan-400' },
  { Icon: Shield,   title: 'Bank darajasida xavfsizlik',   desc: 'AES-256-GCM shifrlash, JWT va RBAC rol tizimi.',            color: 'from-purple-400 to-indigo-400' },
  { Icon: Webhook,  title: "Aqlli Webhook tizimi",          desc: "Avtomatik qayta urinish va to'liq log.",                   color: 'from-emerald-400 to-teal-400' },
  { Icon: BarChart3,title: 'Kuchli Analytics',              desc: "Tranzaksiyalar va daromad bo'yicha batafsil grafiklar.",   color: 'from-orange-400 to-amber-400' },
  { Icon: Key,      title: 'API Kalitlar boshqaruvi',       desc: 'Xavfsiz API kalitlar yarating va boshqaring.',             color: 'from-pink-400 to-rose-400' },
  { Icon: Users,    title: "Ko'p rollik tizim",             desc: "Admin, Manager, Support va Merchant rollari.",             color: 'from-violet-400 to-purple-400' },
];

const PROVIDERS = [
  {
    name: 'TSPay', site: 'tspay.uz',
    ring: 'border-blue-500/30', bg: 'hover:bg-blue-500/5',
    tag: "Ishonchli to'lov platforma",
    logoImg: '/tspay-logo.svg', logoBg: '',
    logoFallback: <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center"><span className="text-white font-black text-lg">TS</span></div>,
  },
  {
    name: 'Paynest', site: 'paynest.uz',
    ring: 'border-purple-500/30', bg: 'hover:bg-purple-500/5',
    tag: "Universal to'lov yechimi",
    logoImg: null, logoBg: '',
    logoFallback: <div className="w-full h-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center"><span className="text-white font-black text-lg">PN</span></div>,
  },
  {
    name: 'TulovPay', site: 'tulovpay.uz',
    ring: 'border-orange-500/30', bg: 'hover:bg-orange-500/5',
    tag: "Tez va xavfsiz infratuzilma",
    logoImg: null, logoBg: '',
    logoFallback: <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center"><span className="text-white font-black text-lg">TP</span></div>,
  },
  {
    name: 'MirPay', site: 'mirpay.uz',
    ring: 'border-red-500/30', bg: 'hover:bg-red-500/5',
    tag: "Eng qulay to'lov tizimi",
    logoImg: null, logoBg: '',
    logoFallback: <div className="w-full h-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center"><span className="text-white font-black text-lg">MP</span></div>,
  },
  {
    name: 'QulayPay', site: 'qulaypay.uz',
    ring: 'border-cyan-500/30', bg: 'hover:bg-cyan-500/5',
    tag: "15 daqiqada integratsiya",
    logoImg: '/qulaypay-logo.svg', logoBg: 'bg-white',
    logoFallback: <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-teal-700 flex items-center justify-center"><span className="text-white font-black text-lg">QP</span></div>,
  },
];

const PLANS = [
  {
    id: 'free', emoji: '🟢', name: 'Free',
    price: '0', currency: "so'm", period: '/oy',
    desc: "Kichik biznes uchun, sinab ko'ring",
    badge: null, forever: "Doimiy bepul",
    features: ['1 ta payment provider', 'Oyiga 500 ta payment', 'Basic webhook', 'Basic logs'],
    ring: 'border-white/10', badgeCls: '', btnCls: 'bg-white/10 text-white hover:bg-white/20',
  },
  {
    id: 'start', emoji: '🔵', name: 'Start',
    price: '99 000', currency: "so'm", period: '/oy',
    desc: 'Kichik bizneslar uchun',
    badge: null, forever: null,
    features: ['1 ta provider', 'Oyiga 5 000 ta payment', 'Payment status API', 'Webhook logs'],
    ring: 'border-blue-500/40', badgeCls: '', btnCls: 'bg-blue-600 text-white hover:bg-blue-500',
  },
  {
    id: 'pro', emoji: '🟣', name: 'Pro',
    price: '299 000', currency: "so'm", period: '/oy',
    desc: "O'sayotgan biznes uchun",
    badge: '⭐ Mashhur', forever: null,
    features: ['3 ta provider', 'Oyiga 20 000 ta payment', 'Refund API', 'Analytics', 'Auto retry webhook'],
    ring: 'border-purple-500/60', badgeCls: 'bg-purple-900 text-purple-200', btnCls: 'bg-white text-black hover:bg-gray-100',
  },
  {
    id: 'business', emoji: '🟠', name: 'Business',
    price: '799 000', currency: "so'm", period: '/oy',
    desc: 'Katta bizneslar uchun',
    badge: null, forever: null,
    features: ['Unlimited provider', 'Oyiga 100 000 ta payment', 'Priority support', 'Advanced analytics', 'Multiple webhook endpoints'],
    ring: 'border-orange-500/40', badgeCls: '', btnCls: 'bg-orange-600 text-white hover:bg-orange-500',
  },
];

export default function LandingPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (token && user) {
      const routes: Record<string, string> = {
        admin: '/dashboard/admin', manager: '/dashboard/manager',
        support: '/dashboard/support', user: '/dashboard/merchant',
      };
      router.replace(routes[user.role] || '/dashboard/merchant');
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [token, user, router]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (token && user) return null;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shrink-0" style={{width:36,height:36}}>
              <img src="/logo.png" alt="MakerPay" style={{width:36,height:36,objectFit:'contain',background:'#000'}} />
            </div>
            <span className="font-bold text-xl">Maker<span className="text-gray-500">Pay</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[['#features','Xususiyatlar'],['#how','Qanday ishlaydi'],['#providers','Provayderlar'],['#pricing','Tariflar']].map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-white transition-colors px-3 py-2">Kirish</Link>
            <Link href="/register" className="inline-flex items-center gap-1.5 bg-white text-black text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-100 transition-all hover:scale-[1.02]">
              Boshlash <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-black border-t border-white/10 px-4 py-4 flex flex-col gap-3 animate-slide-up">
            {[['#features','Xususiyatlar'],['#how','Qanday ishlaydi'],['#providers','Provayderlar'],['#pricing','Tariflar']].map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-gray-500 py-1.5" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1 text-center py-2.5 rounded-xl border border-white/10 text-sm font-semibold">Kirish</Link>
              <Link href="/register" className="flex-1 text-center py-2.5 rounded-xl bg-white text-black text-sm font-bold">Boshlash</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/3 rounded-full blur-3xl animate-float delay-200" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            {/* Logo above badge */}
            <div className="mb-6 animate-zoom-in ml-5">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-red-500/25 rounded-3xl blur-3xl animate-glow-pulse" />
                <div className="relative w-36 h-36 rounded-full overflow-hidden border border-white/15 shadow-2xl animate-float">
                  <img src="/logo.png" alt="MakerPay" style={{width:'100%',height:'100%',objectFit:'cover',background:'#000'}} />
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 animate-fade-in delay-100">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping-slow" />
              <span className="text-xs font-medium text-gray-300">O'zbekiston uchun №1 Payment API</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 animate-fade-in delay-200">
              To&apos;lovlarni{' '}
              <span className="block text-gray-500">avtomatlashtiring</span>
            </h1>

            <p className="text-xl text-gray-500 mb-8 leading-relaxed animate-fade-in delay-200">
              MakerPay orqali TSPay, Paynest, TulovPay, MirPay va QulaYPayni bitta kuchli API bilan boshqaring. Xavfsiz, tez va ishonchli.
            </p>

            <div className="flex flex-wrap gap-4 mb-10 animate-fade-in delay-300">
              <Link href="/register" className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-3.5 rounded-xl hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98] group text-base">
                Bepul boshlash
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-white/5 transition-all text-base">
                <Play className="w-4 h-4" /> Demo ko'rish
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 animate-fade-in delay-400">
              {['Bepul boshlash', 'Kredit karta kerak emas', "24/7 qo'llab-quvvatlash"].map(c => (
                <div key={c} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* dashboard mockup */}
          <div className="relative animate-fade-in-right delay-200">
            <div className="bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="bg-[#0a0a0a] px-4 py-3 flex items-center gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 bg-white/5 rounded-md h-5 mx-4 flex items-center px-3">
                  <span className="text-gray-600 text-xs">app.makerpay.uz/dashboard</span>
                </div>
              </div>
              <div className="p-4 bg-[#0d0d0d]">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Daromad', value: '2,450,000', color: 'text-green-400' },
                    { label: 'Tranzaksiyalar', value: '1,284', color: 'text-blue-400' },
                    { label: 'Muvaffaqiyat', value: '98.7%', color: 'text-purple-400' },
                  ].map((s, i) => (
                    <div key={i} className={`bg-[#1a1a1a] rounded-xl p-3 border border-white/5 animate-scale-in delay-${(i+3)*100}`}>
                      <p className="text-xs text-gray-600 mb-1">{s.label}</p>
                      <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5 mb-4">
                  <div className="flex items-end gap-1.5 h-16">
                    {[40,65,45,80,55,90,75].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm"
                        style={{ height:`${h}%`, background:'linear-gradient(to top, #fff, #888)', opacity: 0.1 + i * 0.08 }} />
                    ))}
                  </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl border border-white/5">
                  {[
                    { name: 'Online Market', amount: '+125,000', ok: true,  prov: 'TSPay' },
                    { name: 'TechShop UZ',   amount: '+89,500',  ok: true,  prov: 'Paynest' },
                    { name: 'Delivery Co',   amount: '+43,200',  ok: false, prov: 'TulovPay' },
                  ].map((tx, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i < 2 ? 'border-b border-white/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-300">{tx.name}</p>
                          <p className="text-xs text-gray-600">{tx.prov}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-green-400">{tx.amount}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${tx.ok ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400'}`}>
                          {tx.ok ? 'Muvaffaq' : 'Kutmoqda'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* floating badges */}
            <div className="absolute -top-4 -right-4 glass rounded-2xl p-3 shadow-lg animate-float delay-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-green-900/60 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">+24% o'sish</p>
                  <p className="text-xs text-gray-500">Bu hafta</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 glass rounded-2xl p-3 shadow-lg animate-float-slow delay-300">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-gray-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">AES-256</p>
                  <p className="text-xs text-gray-500">Xavfsiz</p>
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 -right-8 -translate-y-1/2 glass rounded-2xl px-3 py-2 animate-float delay-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-ping-slow" />
                <span className="text-xs font-medium text-white">Live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 border-y border-white/5 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { v: '99.9%', l: 'Uptime SLA' },
            { v: '5+',    l: "To'lov provayderlari" },
            { v: '<200ms',l: 'API javob vaqti' },
            { v: '24/7',  l: "Qo'llab-quvvatlash" },
          ].map((s, i) => (
            <div key={i} data-reveal data-delay={String((i+1)*100)}>
              <p className="text-4xl md:text-5xl font-black text-white">{s.v}</p>
              <p className="text-gray-600 mt-2 text-sm">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span data-reveal className="inline-block bg-white/5 border border-white/10 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">Xususiyatlar</span>
            <h2 data-reveal data-delay="100" className="text-4xl md:text-5xl font-extrabold text-white mb-4">Biznesingiz uchun kerakli <span className="text-gray-500">hamma narsa</span></h2>
            <p data-reveal data-delay="200" className="text-xl text-gray-600 max-w-2xl mx-auto">To'lov integratsiyasidan analitikagacha — MakerPay hamma narsani qamrab oladi.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} data-reveal data-delay={String((i % 3) * 100 + 100)}
                className="group bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/20 hover:bg-[#161616] transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className={`w-5 h-5 bg-gradient-to-br ${f.color} rounded-lg flex items-center justify-center`}>
                    <f.Icon className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 bg-[#0a0a0a] relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span data-reveal className="inline-block bg-white/5 border border-white/10 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">Qanday ishlaydi</span>
            <h2 data-reveal data-delay="100" className="text-4xl md:text-5xl font-extrabold text-white mb-4">4 qadamda <span className="text-gray-500">boshlang</span></h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-white/5 via-white/15 to-white/5" />
            {[
              { title: "Ro'yxatdan o'ting",       desc: "Biznesingiz ma'lumotlarini kiriting va tekshirishni kuting." },
              { title: 'Provayderingizni ulang',   desc: "TSPay, Paynest yoki TulovPay API kalitlarini qo'shing." },
              { title: 'API kaliti oling',          desc: "Xavfsiz API kalitingizni yarating va integratsiya qiling." },
              { title: "To'lovlarni qabul qiling", desc: "Bitta endpoint orqali barcha to'lovlarni boshqaring." },
            ].map((step, i) => (
              <div key={i} data-reveal data-delay={String(i * 150)} className="relative text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full border border-white/10 animate-ping-slow opacity-30" style={{ animationDelay: `${i*0.5}s` }} />
                  <div className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <span className="text-black font-black text-lg">{String(i+1).padStart(2,'0')}</span>
                  </div>
                </div>
                <h3 className="font-bold text-white text-base mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROVIDERS ── */}
      <section id="providers" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span data-reveal className="inline-block bg-white/5 border border-white/10 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">Provayderlar</span>
            <h2 data-reveal data-delay="100" className="text-4xl md:text-5xl font-extrabold text-white mb-4">Barcha yetakchi <span className="text-gray-500">provayderlar</span></h2>
            <p data-reveal data-delay="200" className="text-xl text-gray-600 max-w-2xl mx-auto">O'zbekistonning eng yirik to'lov provayderlari bitta joyda.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-16">
            {PROVIDERS.map((p, i) => (
              <div key={i} data-reveal data-delay={String(i * 100)}
                className={`group bg-[#111] border border-white/10 ${p.ring} rounded-2xl p-5 ${p.bg} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
                {/* Logo */}
                <div className={`w-14 h-14 rounded-2xl overflow-hidden shadow-lg mb-4 group-hover:scale-105 transition-transform duration-300 border border-white/10 ${p.logoBg}`}>
                  {p.logoImg
                    ? <img src={p.logoImg} alt={p.name} className={`w-full h-full object-${p.logoBg ? 'contain p-1' : 'cover'}`} />
                    : p.logoFallback}
                </div>
                {/* Info */}
                <div className="font-bold text-white text-base leading-tight">{p.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 mb-3">{p.site}</div>
                <div className="text-xs text-gray-600 leading-relaxed mb-3">{p.tag}</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-green-500 font-medium">Faol</span>
                </div>
              </div>
            ))}
          </div>

          {/* payment flow */}
          <p data-reveal className="text-center text-xs font-semibold text-gray-700 uppercase tracking-widest mb-10">To'lov jarayoni</p>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0">
            {[
              { Icon: CreditCard,   label: "Sizning sayt",    sub: "To'lov so'rovi",        anim: 'animate-float',      cls: 'from-gray-800 to-gray-900' },
              null,
              { Icon: Zap,          label: 'MakerPay',        sub: 'Routing & xavfsizlik',  anim: 'animate-pulse-glow', cls: 'from-white/15 to-white/5', big: true },
              null,
              { Icon: Globe,        label: 'Provayder',       sub: 'TSPay / Paynest',       anim: 'animate-float-slow', cls: 'from-green-900 to-emerald-900' },
              null,
              { Icon: CheckCircle,  label: "To'lov tasdiqlandi", sub: 'Webhook yuborildi',  anim: 'animate-bounce-soft',cls: 'from-green-800 to-green-900' },
            ].map((item, i) => {
              if (!item) return (
                <div key={i} className="hidden lg:flex items-center mx-4">
                  <div className="w-10 h-px bg-white/15" />
                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white/15" />
                </div>
              );
              const { Icon, label, sub, anim, cls, big } = item as any;
              return (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className={`${big ? 'w-24 h-24' : 'w-20 h-20'} rounded-3xl bg-gradient-to-br ${cls} border border-white/10 flex flex-col items-center justify-center ${anim} shadow-xl mb-3`}>
                    <Icon className={`${big ? 'w-8 h-8' : 'w-6 h-6'} text-white mb-0.5`} />
                    <span className="text-white text-xs font-bold">{label}</span>
                  </div>
                  <p className="text-gray-600 text-xs">{sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 bg-[#0a0a0a] relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span data-reveal className="inline-block bg-white/5 border border-white/10 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">Tariflar</span>
            <h2 data-reveal data-delay="100" className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Biznesingiz o'lchamiga mos <span className="text-gray-500">tarif tanlang</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, i) => (
              <div key={plan.id} data-reveal data-delay={String(i * 100 + 100)}
                className={`relative flex flex-col bg-[#111] border-2 ${plan.ring} rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`inline-block ${plan.badgeCls} bg-purple-900 text-purple-200 text-xs font-black px-3 py-1 rounded-full border border-white/10`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="text-2xl mb-2">{plan.emoji}</div>
                  <h3 className="text-xl font-black text-white">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{plan.desc}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.currency}{plan.period}</span>
                  </div>
                  {plan.forever && (
                    <p className="text-green-400 text-xs font-semibold mt-1">✓ {plan.forever}</p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-400 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="/register"
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] text-center block ${plan.btnCls}`}>
                  Boshlash
                </a>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div data-reveal className="inline-flex items-center gap-2 bg-black/5 border border-black/10 rounded-full px-4 py-1.5 mb-6">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-black/60 text-xs font-medium">Bugun bepul boshlang</span>
          </div>
          <h2 data-reveal data-delay="100" className="text-4xl md:text-6xl font-extrabold text-black mb-6">
            Biznesingizni{' '}
            <span className="text-gray-400">keyingi bosqichga</span>{' '}
            olib chiqing
          </h2>
          <p data-reveal data-delay="200" className="text-xl text-gray-500 mb-10">
            Minglab kompaniyalar MakerPay orqali to'lovlarini avtomatlashtirmoqda. Siz ham qo'shiling.
          </p>
          <div data-reveal data-delay="300" className="flex flex-wrap justify-center gap-4">
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-black text-white font-bold px-8 py-4 rounded-xl hover:bg-gray-900 transition-all hover:scale-[1.03] active:scale-[0.98] shadow-xl text-base">
              Bepul ro'yxatdan o'tish <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 border-2 border-black/10 text-black font-semibold px-8 py-4 rounded-xl hover:bg-black/5 transition-all text-base">
              Kirish
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-black border-t border-white/5 py-10">
        <div data-reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0" style={{width:32,height:32}}>
              <img src="/logo.png" alt="MakerPay" style={{width:32,height:32,objectFit:'contain',background:'#000'}} />
            </div>
            <span className="font-bold text-white text-lg">MakerPay</span>
            <span className="text-gray-700 text-sm">© 2026. Barcha huquqlar himoyalangan.</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" />
            <span>SSL · AES-256-GCM · PCI DSS</span>
          </div>
        </div>
      </footer>


    </div>
  );
}
