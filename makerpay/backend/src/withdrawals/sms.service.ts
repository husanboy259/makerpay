import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  // Eskiz.uz API (O'zbekistoning asosiy SMS provideri)
  private readonly baseUrl = 'https://notify.eskiz.uz';
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  private async getToken(): Promise<string | null> {
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    const email    = process.env.ESKIZ_EMAIL;
    const password = process.env.ESKIZ_PASSWORD;

    if (!email || !password) {
      this.logger.warn('ESKIZ_EMAIL yoki ESKIZ_PASSWORD .env da yo\'q — SMS yuborilmaydi');
      return null;
    }

    try {
      const { data } = await axios.post(`${this.baseUrl}/api/auth/login`, { email, password });
      this.token       = data.data.token;
      this.tokenExpiry = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000); // 29 kun
      return this.token;
    } catch (e: any) {
      this.logger.error(`Eskiz login xatolik: ${e.message}`);
      return null;
    }
  }

  async send(phone: string, message: string): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    // Telefon raqamni tozalash: +998901234567 → 998901234567
    const cleanPhone = phone.replace(/\D/g, '');

    try {
      await axios.post(
        `${this.baseUrl}/api/message/sms/send`,
        {
          mobile_phone: cleanPhone,
          message,
          from: process.env.ESKIZ_SENDER || 'MakerPay',
          callback_url: '',
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      this.logger.log(`SMS yuborildi: ${cleanPhone}`);
      return true;
    } catch (e: any) {
      this.logger.error(`SMS xatolik (${cleanPhone}): ${e.message}`);
      return false;
    }
  }

  async sendPaymentNotification(phone: string, amount: number, currency = 'UZS', orderId: string): Promise<boolean> {
    const formatted = new Intl.NumberFormat('uz-UZ').format(amount);
    const message   = `MakerPay: To'lov qabul qilindi! Summa: ${formatted} ${currency}. Buyurtma: ${orderId}. Balansga o'tkazildi.`;
    return this.send(phone, message);
  }

  async sendWithdrawalNotification(phone: string, amount: number): Promise<boolean> {
    const formatted = new Intl.NumberFormat('uz-UZ').format(amount);
    const message   = `MakerPay: ${formatted} UZS yechish arizangiz qabul qilindi. Admin ko'rib chiqqanidan so'ng o'tkaziladi.`;
    return this.send(phone, message);
  }

  async sendWithdrawalApproved(phone: string, amount: number): Promise<boolean> {
    const formatted = new Intl.NumberFormat('uz-UZ').format(amount);
    const message   = `MakerPay: ${formatted} UZS muvaffaqiyatli o'tkazildi. Hisobingizni tekshiring.`;
    return this.send(phone, message);
  }
}
