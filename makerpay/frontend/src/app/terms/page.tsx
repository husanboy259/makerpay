'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
    <div className="text-sm text-gray-400 leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        <Link href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Bosh sahifa</span>
        </Link>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="MakerPay" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
            <span className="text-xl font-bold">MakerPay</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Foydalanish shartlari</h1>
          <p className="text-sm text-gray-500">So'nggi yangilanish: 2026 yil 1 yanvar</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-8">

          <Section title="1. Umumiy qoidalar">
            <p>MakerPay platformasidan foydalanish orqali siz ushbu foydalanish shartlarini to'liq qabul qilasiz. Agar siz ushbu shartlarga rozi bo'lmasangiz, platformadan foydalanmang.</p>
            <p>MakerPay O'zbekistonda ro'yxatdan o'tgan kompaniya bo'lib, to'lov tizimlarini birlashtirishga yo'naltirilgan API platformasini taqdim etadi.</p>
          </Section>

          <Section title="2. Xizmat tavsifi">
            <p>MakerPay quyidagi xizmatlarni taqdim etadi:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
              <li>To'lov provayderlarini (TSPay, InPay, QulayPay va boshqalar) birlashtirilgan API orqali boshqarish</li>
              <li>To'lov tranzaksiyalarini kuzatish va boshqarish</li>
              <li>Webhook orqali to'lov holatlari haqida bildirishnomalar</li>
              <li>Tranzaksiya tahlili va hisobotlari</li>
              <li>API kalitlari boshqaruvi</li>
            </ul>
          </Section>

          <Section title="3. Hisob va xavfsizlik">
            <p>Siz quyidagilarga rozilik bildirasiz:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
              <li>Hisob yaratishda to'g'ri va to'liq ma'lumot taqdim etish</li>
              <li>API kalitlar va kirish parollarini sir saqlash</li>
              <li>Hisobingiz xavfsizligini ta'minlash</li>
              <li>Ruxsatsiz kirish yoki xavfsizlik buzilishi haqida darhol xabar berish</li>
            </ul>
          </Section>

          <Section title="4. To'lovlar va tariflar">
            <p>MakerPay platformasi quyidagi tarif rejalari asosida ishlaydi: Free, Start, Pro va Business. Har bir rejaning cheklovlari va narxlari <Link href="/pricing" className="text-white underline hover:no-underline">Tariflar sahifasida</Link> ko'rsatilgan.</p>
            <p>Platforma komissiyasi har bir muvaffaqiyatli tranzaksiya summasining 1.5% ini tashkil etadi. To'lov provayderlari o'zining alohida komissiyalarini qo'llashadi.</p>
          </Section>

          <Section title="5. Taqiqlangan faoliyat">
            <p>Quyidagi maqsadlarda platformadan foydalanish qat'iyan taqiqlanadi:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
              <li>Pul yuvish yoki noqonuniy moliyaviy operatsiyalar</li>
              <li>Firibgarlik va aldash</li>
              <li>Platformaning texnik resurslariga zarar yetkazish</li>
              <li>Boshqa foydalanuvchilarning ma'lumotlariga ruxsatsiz kirish</li>
              <li>O'zbekiston Respublikasi qonunlariga zid har qanday faoliyat</li>
            </ul>
          </Section>

          <Section title="6. Maxfiylik va ma'lumotlar">
            <p>MakerPay foydalanuvchi ma'lumotlarini O'zbekiston Respublikasining shaxsiy ma'lumotlar to'g'risidagi qonunchiligiga muvofiq saqlaydi va himoya qiladi.</p>
            <p>Tranzaksiya ma'lumotlari AES-256-GCM shifrlash orqali himoyalanadi. Uchinchi shaxslarga foydalanuvchi ma'lumotlari faqat qonun talabi yoki foydalanuvchining roziligi bilan beriladi.</p>
          </Section>

          <Section title="7. Xizmat uzilishi va cheklovlar">
            <p>MakerPay platforma xizmatlarini profilaktika ishlari yoki texnik yangilanishlar uchun vaqtincha to'xtatish huquqini saqlab qoladi. Bunday hollarda foydalanuvchilarga oldindan xabar berishga harakat qilinadi.</p>
            <p>Platforma to'lov provayderlarining ish faoliyatidan kelib chiqadigan uzilishlar uchun javobgar emas.</p>
          </Section>

          <Section title="8. Javobgarlik chegarasi">
            <p>MakerPay quyidagi holatlar uchun javobgar emas:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
              <li>Foydalanuvchi xatosi natijasida yuzaga kelgan zararlar</li>
              <li>Uchinchi tomon to'lov provayderlarining xatoliklari</li>
              <li>Force majeure (tabiiy ofat, internet uzilishi va h.k.) holatlari</li>
            </ul>
          </Section>

          <Section title="9. Shartlarni o'zgartirish">
            <p>MakerPay ushbu foydalanish shartlarini istalgan vaqtda o'zgartirish huquqini saqlab qoladi. Muhim o'zgarishlar haqida foydalanuvchilar email orqali xabardor qilinadi. Platformadan foydalanishni davom ettirish yangi shartlarni qabul qilish deb hisoblanadi.</p>
          </Section>

          <Section title="10. Aloqa">
            <p>Savollar uchun: <a href="mailto:support@makerpay.uz" className="text-white underline hover:no-underline">support@makerpay.uz</a></p>
            <p>Manzil: Toshkent, O'zbekiston</p>
          </Section>

          <div className="pt-4 mt-4 border-t border-white/10">
            <p className="text-xs text-gray-600 text-center">
              © 2026 MakerPay.uz — Barcha huquqlar himoyalangan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
