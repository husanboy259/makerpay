'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi, merchantsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Loader2, User, Building2, Phone, Mail, Globe, CreditCard, Shield, Bell } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({
    fullName: '', phone: '', telegramUsername: '',
    preferredLanguage: 'uz', notificationEmail: true, notificationTelegram: false,
  });
  const [merchantForm, setMerchantForm] = useState({
    businessName: '', businessType: '', inn: '', legalAddress: '',
    actualAddress: '', websiteUrl: '', contactEmail: '', contactPhone: '',
    bankName: '', bankAccount: '', mfo: '',
  });
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [merchantSaved, setMerchantSaved] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const { data: merchant } = useQuery({
    queryKey: ['merchant-me'],
    queryFn: () => merchantsApi.getMe(),
  });

  useEffect(() => {
    if (user) setProfileForm({
      fullName: user.fullName || '',
      phone: '',
      telegramUsername: '',
      preferredLanguage: 'uz',
      notificationEmail: true,
      notificationTelegram: false,
    });
  }, [user]);

  useEffect(() => {
    const m = merchant as any;
    if (m) setMerchantForm({
      businessName: m.businessName || '',
      businessType: m.businessType || '',
      inn: m.inn || '',
      legalAddress: m.legalAddress || '',
      actualAddress: m.actualAddress || '',
      websiteUrl: m.websiteUrl || '',
      contactEmail: m.contactEmail || '',
      contactPhone: m.contactPhone || '',
      bankName: m.bankName || '',
      bankAccount: m.bankAccount || '',
      mfo: m.mfo || '',
    });
  }, [merchant]);

  const saveProfile = async () => {
    try {
      const res: any = await authApi.updateProfile(profileForm);
      updateUser(res);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch {}
  };

  const saveMerchant = async () => {
    try {
      if ((merchant as any)?.id) {
        await merchantsApi.update(merchantForm);
      } else {
        await merchantsApi.create(merchantForm);
      }
      setMerchantSaved(true);
      setTimeout(() => setMerchantSaved(false), 3000);
    } catch {}
  };

  const changePwd = async () => {
    setPwdError('');
    setPwdSuccess(false);
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('Yangi parollar mos kelmaydi');
      return;
    }
    try {
      await authApi.changePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword });
      setPwdSuccess(true);
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPwdError(err?.message || 'Parol almashtirish xatoligi');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil sozlamalari</h1>
        <p className="text-sm text-gray-500 mt-1">Shaxsiy ma&apos;lumotlar va biznes profil</p>
      </div>

      {/* Personal info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center">
            <User className="w-4 h-4 text-brand-600" />
          </div>
          <h2 className="text-base font-bold">Shaxsiy ma&apos;lumotlar</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">To&apos;liq ism</label>
            <input className="input" value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input" placeholder="+998901234567" value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Telegram</label>
            <input className="input" placeholder="@username" value={profileForm.telegramUsername}
              onChange={(e) => setProfileForm({ ...profileForm, telegramUsername: e.target.value })} />
          </div>
          <div>
            <label className="label">Til</label>
            <select className="input" value={profileForm.preferredLanguage}
              onChange={(e) => setProfileForm({ ...profileForm, preferredLanguage: e.target.value })}>
              <option value="uz">O&apos;zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold">Bildirishnomalar</span>
          </div>
          <div className="space-y-2">
            {[
              ['notificationEmail', 'Email orqali bildirishnoma'],
              ['notificationTelegram', 'Telegram orqali bildirishnoma'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="rounded"
                  checked={profileForm[key as keyof typeof profileForm] as boolean}
                  onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.checked })} />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button onClick={saveProfile} className="btn-primary">Saqlash</button>
          {profileSaved && <span className="text-green-600 text-sm font-medium">✓ Saqlandi</span>}
        </div>
      </div>

      {/* Business info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold">Biznes ma&apos;lumotlari</h2>
            <p className="text-xs text-gray-400">To&apos;lov tizimiga ulanish uchun talab qilinadi</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Kompaniya nomi *</label>
            <input className="input" placeholder="OOO MyCom" value={merchantForm.businessName}
              onChange={(e) => setMerchantForm({ ...merchantForm, businessName: e.target.value })} />
          </div>
          <div>
            <label className="label">Tashkilot turi</label>
            <select className="input" value={merchantForm.businessType}
              onChange={(e) => setMerchantForm({ ...merchantForm, businessType: e.target.value })}>
              <option value="">Tanlang</option>
              <option value="LLC">MChJ (LLC)</option>
              <option value="JSC">AJ (JSC)</option>
              <option value="IP">Yakka tartib (IP)</option>
              <option value="NGO">NGO</option>
            </select>
          </div>
          <div>
            <label className="label">INN (Soliq raqami)</label>
            <input className="input" placeholder="123456789" value={merchantForm.inn}
              onChange={(e) => setMerchantForm({ ...merchantForm, inn: e.target.value })} />
          </div>
          <div>
            <label className="label">Veb-sayt</label>
            <input className="input" placeholder="https://yoursite.uz" value={merchantForm.websiteUrl}
              onChange={(e) => setMerchantForm({ ...merchantForm, websiteUrl: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Yuridik manzil</label>
            <input className="input" placeholder="Toshkent sh., Chilonzor tumani..." value={merchantForm.legalAddress}
              onChange={(e) => setMerchantForm({ ...merchantForm, legalAddress: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Haqiqiy manzil</label>
            <input className="input" placeholder="Agar yuridikdan farq qilsa" value={merchantForm.actualAddress}
              onChange={(e) => setMerchantForm({ ...merchantForm, actualAddress: e.target.value })} />
          </div>
          <div>
            <label className="label">Aloqa emaili</label>
            <input type="email" className="input" value={merchantForm.contactEmail}
              onChange={(e) => setMerchantForm({ ...merchantForm, contactEmail: e.target.value })} />
          </div>
          <div>
            <label className="label">Aloqa telefoni</label>
            <input className="input" value={merchantForm.contactPhone}
              onChange={(e) => setMerchantForm({ ...merchantForm, contactPhone: e.target.value })} />
          </div>
        </div>

        {/* Bank info */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold">Bank ma&apos;lumotlari</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Bank nomi</label>
              <input className="input" placeholder="Ipotekabank" value={merchantForm.bankName}
                onChange={(e) => setMerchantForm({ ...merchantForm, bankName: e.target.value })} />
            </div>
            <div>
              <label className="label">Hisob raqam</label>
              <input className="input" placeholder="20208000..." value={merchantForm.bankAccount}
                onChange={(e) => setMerchantForm({ ...merchantForm, bankAccount: e.target.value })} />
            </div>
            <div>
              <label className="label">MFO</label>
              <input className="input" placeholder="00876" value={merchantForm.mfo}
                onChange={(e) => setMerchantForm({ ...merchantForm, mfo: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button onClick={saveMerchant} className="btn-primary">Saqlash</button>
          {merchantSaved && <span className="text-green-600 text-sm font-medium">✓ Saqlandi</span>}
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
            <Shield className="w-4 h-4 text-red-600" />
          </div>
          <h2 className="text-base font-bold">Parolni o&apos;zgartirish</h2>
        </div>
        {pwdError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{pwdError}</div>}
        {pwdSuccess && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl">✓ Parol muvaffaqiyatli o&apos;zgartirildi</div>}
        <div className="space-y-4 max-w-sm">
          <div>
            <label className="label">Joriy parol</label>
            <input type="password" className="input" value={pwdForm.oldPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">Yangi parol</label>
            <input type="password" className="input" value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">Yangi parolni tasdiqlang</label>
            <input type="password" className="input" value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} />
          </div>
          <button onClick={changePwd} className="btn-primary">Parolni o&apos;zgartirish</button>
        </div>
      </div>
    </div>
  );
}
