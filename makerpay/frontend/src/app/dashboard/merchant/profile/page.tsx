'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi, merchantsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Loader2, User, Building2, Shield, Send,
  Instagram, Linkedin, Globe, Calendar, Users, CheckCircle,
} from 'lucide-react';

function Section({ icon: Icon, title, subtitle, color = 'bg-white/5', children }: any) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all placeholder-gray-600";
const selectCls = `${inputCls} cursor-pointer`;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [saved, setSaved] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState('');

  const [profileForm, setProfileForm] = useState({
    fullName: '', phone: '', telegramUsername: '',
  });

  const [merchantForm, setMerchantForm] = useState({
    businessName: '', businessType: '', inn: '',
    description: '', foundedAt: '', employeeCount: '',
    websiteUrl: '', instagramUrl: '', linkedinUrl: '', twitterUrl: '',
    legalAddress: '', actualAddress: '',
    contactEmail: '', contactPhone: '', telegramUsername: '',
    bankName: '', bankAccount: '', mfo: '',
  });

  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const { data: merchant } = useQuery({
    queryKey: ['merchant-me'],
    queryFn: () => merchantsApi.getMe(),
  });

  useEffect(() => {
    if (user) setProfileForm({
      fullName: user.fullName || '',
      phone: (user as any).phone || '',
      telegramUsername: (user as any).telegramUsername || '',
    });
  }, [user]);

  useEffect(() => {
    const m = merchant as any;
    if (m) setMerchantForm({
      businessName: m.businessName || '',
      businessType: m.businessType || '',
      inn: m.inn || '',
      description: m.description || '',
      foundedAt: m.foundedAt ? m.foundedAt.slice(0, 10) : '',
      employeeCount: m.employeeCount || '',
      websiteUrl: m.websiteUrl || '',
      instagramUrl: m.instagramUrl || '',
      linkedinUrl: m.linkedinUrl || '',
      twitterUrl: m.twitterUrl || '',
      legalAddress: m.legalAddress || '',
      actualAddress: m.actualAddress || '',
      contactEmail: m.contactEmail || '',
      contactPhone: m.contactPhone || '',
      telegramUsername: m.telegramUsername || '',
      bankName: m.bankName || '',
      bankAccount: m.bankAccount || '',
      mfo: m.mfo || '',
    });
  }, [merchant]);

  const flash = (key: string) => { setSaved(key); setTimeout(() => setSaved(null), 3000); };

  const saveProfile = async () => {
    try { const r: any = await authApi.updateProfile(profileForm); updateUser(r); flash('profile'); } catch {}
  };

  const saveMerchant = async () => {
    try {
      if ((merchant as any)?.id) await merchantsApi.update(merchantForm);
      else await merchantsApi.create(merchantForm);
      flash('merchant');
    } catch {}
  };

  const changePwd = async () => {
    setPwdError('');
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { setPwdError('Yangi parollar mos kelmaydi'); return; }
    try {
      await authApi.changePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword });
      flash('pwd');
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) { setPwdError(e?.message || 'Xatolik'); }
  };

  const SaveBtn = ({ id }: { id: string }) => (
    <div className="flex items-center gap-3 mt-5 pt-5 border-t border-white/10">
      <button onClick={id === 'profile' ? saveProfile : id === 'merchant' ? saveMerchant : changePwd}
        className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-all flex items-center gap-2">
        {saved === id ? <><CheckCircle className="w-4 h-4 text-green-600" /> Saqlandi</> : 'Saqlash'}
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profil sozlamalari</h1>
        <p className="text-sm text-gray-500 mt-1">Shaxsiy ma&apos;lumotlar va kompaniya profili</p>
      </div>

      {/* ── Personal info ── */}
      <Section icon={User} title="Shaxsiy ma'lumotlar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="To'liq ism" required>
            <input className={inputCls} value={profileForm.fullName}
              onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={`${inputCls} opacity-50 cursor-not-allowed`} value={user?.email || ''} disabled />
          </Field>
          <Field label="Telefon">
            <input className={inputCls} placeholder="+998 90 000 00 00" value={profileForm.phone}
              onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
          </Field>
          <Field label="Telegram username">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
              <input className={`${inputCls} pl-8`} placeholder="username" value={profileForm.telegramUsername?.replace('@', '')}
                onChange={e => setProfileForm({ ...profileForm, telegramUsername: e.target.value })} />
            </div>
          </Field>
        </div>
        <SaveBtn id="profile" />
      </Section>

      {/* ── Company / Startup info ── */}
      <Section icon={Building2} title="Kompaniya / Startup" subtitle="To'lov tizimi va trial ariza uchun">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Kompaniya nomi" required>
            <input className={inputCls} placeholder="OOO MyStartup" value={merchantForm.businessName}
              onChange={e => setMerchantForm({ ...merchantForm, businessName: e.target.value })} />
          </Field>
          <Field label="Tashkilot turi">
            <select className={selectCls} value={merchantForm.businessType}
              onChange={e => setMerchantForm({ ...merchantForm, businessType: e.target.value })}>
              <option value="">Tanlang</option>
              <option value="startup">Startup</option>
              <option value="LLC">MChJ (LLC)</option>
              <option value="JSC">AJ (JSC)</option>
              <option value="IP">Yakka tartib (IP)</option>
              <option value="NGO">NGO</option>
            </select>
          </Field>

          <Field label="Tashkil topgan yil">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="date" className={`${inputCls} pl-11`} value={merchantForm.foundedAt}
                onChange={e => setMerchantForm({ ...merchantForm, foundedAt: e.target.value })} />
            </div>
          </Field>

          <Field label="Xodimlar soni">
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select className={`${selectCls} pl-11`} value={merchantForm.employeeCount}
                onChange={e => setMerchantForm({ ...merchantForm, employeeCount: e.target.value })}>
                <option value="">Tanlang</option>
                <option value="1">Faqat men</option>
                <option value="2">2–5</option>
                <option value="6">6–10</option>
                <option value="11">11–30</option>
                <option value="31">31–100</option>
                <option value="100">100+</option>
              </select>
            </div>
          </Field>

          <Field label="INN (Soliq raqami)">
            <input className={inputCls} placeholder="123456789" value={merchantForm.inn}
              onChange={e => setMerchantForm({ ...merchantForm, inn: e.target.value })} />
          </Field>

          <Field label="Veb-sayt">
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input className={`${inputCls} pl-11`} placeholder="https://yoursite.uz" value={merchantForm.websiteUrl}
                onChange={e => setMerchantForm({ ...merchantForm, websiteUrl: e.target.value })} />
            </div>
          </Field>

          <Field label="Startup haqida" >
            <textarea className={`${inputCls} resize-none`} rows={3}
              placeholder="Loyihangiz nima haqida? Qanday muammoni hal qiladi?"
              value={merchantForm.description}
              onChange={e => setMerchantForm({ ...merchantForm, description: e.target.value })} />
          </Field>

          <div className="space-y-3">
            <Field label="Manzil (yuridik)">
              <input className={inputCls} placeholder="Toshkent sh., Chilonzor..." value={merchantForm.legalAddress}
                onChange={e => setMerchantForm({ ...merchantForm, legalAddress: e.target.value })} />
            </Field>
            <Field label="Manzil (haqiqiy)">
              <input className={inputCls} placeholder="Agar yuridikdan farq qilsa" value={merchantForm.actualAddress}
                onChange={e => setMerchantForm({ ...merchantForm, actualAddress: e.target.value })} />
            </Field>
          </div>
        </div>

        {/* Social media */}
        <div className="mt-5 pt-5 border-t border-white/10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ijtimoiy tarmoqlar</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Telegram kanal/guruh">
              <div className="relative">
                <Send className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input className={`${inputCls} pl-11`} placeholder="@company_channel" value={merchantForm.telegramUsername}
                  onChange={e => setMerchantForm({ ...merchantForm, telegramUsername: e.target.value })} />
              </div>
            </Field>
            <Field label="Instagram">
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input className={`${inputCls} pl-11`} placeholder="@company" value={merchantForm.instagramUrl}
                  onChange={e => setMerchantForm({ ...merchantForm, instagramUrl: e.target.value })} />
              </div>
            </Field>
            <Field label="LinkedIn">
              <div className="relative">
                <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input className={`${inputCls} pl-11`} placeholder="linkedin.com/company/..." value={merchantForm.linkedinUrl}
                  onChange={e => setMerchantForm({ ...merchantForm, linkedinUrl: e.target.value })} />
              </div>
            </Field>
            <Field label="Aloqa email">
              <input type="email" className={inputCls} placeholder="hello@company.uz" value={merchantForm.contactEmail}
                onChange={e => setMerchantForm({ ...merchantForm, contactEmail: e.target.value })} />
            </Field>
          </div>
        </div>

        {/* Bank */}
        <div className="mt-5 pt-5 border-t border-white/10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bank ma&apos;lumotlari</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Bank nomi">
              <input className={inputCls} placeholder="Ipotekabank" value={merchantForm.bankName}
                onChange={e => setMerchantForm({ ...merchantForm, bankName: e.target.value })} />
            </Field>
            <Field label="Hisob raqam">
              <input className={inputCls} placeholder="20208000..." value={merchantForm.bankAccount}
                onChange={e => setMerchantForm({ ...merchantForm, bankAccount: e.target.value })} />
            </Field>
            <Field label="MFO">
              <input className={inputCls} placeholder="00876" value={merchantForm.mfo}
                onChange={e => setMerchantForm({ ...merchantForm, mfo: e.target.value })} />
            </Field>
          </div>
        </div>

        <SaveBtn id="merchant" />
      </Section>

      {/* ── Password ── */}
      <Section icon={Shield} title="Parolni o'zgartirish">
        {pwdError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">{pwdError}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Joriy parol">
            <input type="password" className={inputCls} value={pwdForm.oldPassword}
              onChange={e => setPwdForm({ ...pwdForm, oldPassword: e.target.value })} />
          </Field>
          <Field label="Yangi parol">
            <input type="password" className={inputCls} value={pwdForm.newPassword}
              onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />
          </Field>
          <Field label="Tasdiqlash">
            <input type="password" className={inputCls} value={pwdForm.confirmPassword}
              onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} />
          </Field>
        </div>
        <SaveBtn id="pwd" />
      </Section>
    </div>
  );
}
