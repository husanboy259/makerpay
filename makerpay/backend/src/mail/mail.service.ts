import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: `"MakerPay" <${process.env.SMTP_USER}>`,
        to, subject, html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (e: any) {
      this.logger.error(`Email xatolik (${to}): ${e.message}`);
    }
  }

  async sendPaymentNotification(email: string, amount: number, currency = 'UZS', orderId: string) {
    const fmt = new Intl.NumberFormat('uz-UZ').format(amount);
    await this.send(email, `✅ To'lov qabul qilindi — ${fmt} ${currency}`, `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;border-radius:16px;padding:32px;border:1px solid #222">
        <h2 style="margin:0 0 4px">✅ To'lov qabul qilindi!</h2>
        <p style="color:#888;margin:0 0 24px;font-size:14px">MakerPay bildirishnomasi</p>
        <div style="background:#0a2a0a;border:1px solid #1a4a1a;border-radius:12px;padding:24px;margin:0 0 20px">
          <p style="margin:0;font-size:13px;color:#aaa">Summa</p>
          <p style="margin:4px 0 0;font-size:32px;font-weight:900;color:#4ade80">${fmt} ${currency}</p>
        </div>
        <p style="font-size:14px;color:#aaa">Buyurtma ID: <b style="color:#fff">${orderId}</b></p>
        <p style="font-size:13px;color:#666;margin-top:24px">MakerPay — To'lov avtomatizatsiya platformasi</p>
      </div>
    `);
  }

  async sendWithdrawalRequested(email: string, amount: number) {
    const fmt = new Intl.NumberFormat('uz-UZ').format(amount);
    await this.send(email, `💸 Yechish so'rovi qabul qilindi — ${fmt} UZS`, `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;border-radius:16px;padding:32px;border:1px solid #222">
        <h2 style="margin:0 0 4px">💸 Yechish so'rovingiz qabul qilindi</h2>
        <p style="color:#888;margin:0 0 24px;font-size:14px">MakerPay bildirishnomasi</p>
        <div style="background:#111;border:1px solid #333;border-radius:12px;padding:24px;margin:0 0 20px">
          <p style="margin:0;font-size:13px;color:#aaa">So'ralgan summa</p>
          <p style="margin:4px 0 0;font-size:32px;font-weight:900;color:#fff">${fmt} UZS</p>
        </div>
        <p style="font-size:14px;color:#aaa">Admin ko'rib chiqqanidan so'ng hisobingizga o'tkaziladi.</p>
        <p style="font-size:13px;color:#666;margin-top:24px">MakerPay — To'lov avtomatizatsiya platformasi</p>
      </div>
    `);
  }

  async sendWithdrawalApproved(email: string, amount: number) {
    const fmt = new Intl.NumberFormat('uz-UZ').format(amount);
    await this.send(email, `✅ ${fmt} UZS muvaffaqiyatli o'tkazildi`, `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;border-radius:16px;padding:32px;border:1px solid #222">
        <h2 style="margin:0 0 4px">✅ Pul o'tkazildi!</h2>
        <p style="color:#888;margin:0 0 24px;font-size:14px">MakerPay bildirishnomasi</p>
        <div style="background:#0a2a0a;border:1px solid #1a4a1a;border-radius:12px;padding:24px;margin:0 0 20px">
          <p style="margin:0;font-size:13px;color:#aaa">O'tkazilgan summa</p>
          <p style="margin:4px 0 0;font-size:32px;font-weight:900;color:#4ade80">${fmt} UZS</p>
        </div>
        <p style="font-size:14px;color:#aaa">Hisobingizni tekshiring.</p>
        <p style="font-size:13px;color:#666;margin-top:24px">MakerPay — To'lov avtomatizatsiya platformasi</p>
      </div>
    `);
  }

  async sendPasswordReset(email: string, code: string, fullName?: string) {
    await this.send(email, 'Parol tiklash kodi — MakerPay', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;border-radius:16px;padding:32px;border:1px solid #222">
        <h2 style="margin:0 0 8px;font-size:22px">MakerPay</h2>
        <p style="color:#888;margin:0 0 24px;font-size:14px">Parol tiklash so'rovi</p>
        <p style="font-size:15px;color:#ccc">Salom${fullName ? ', ' + fullName : ''}!</p>
        <p style="font-size:14px;color:#aaa">Parolingizni tiklash uchun quyidagi kodni kiriting:</p>
        <div style="background:#111;border:1px solid #333;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#fff">${code}</span>
        </div>
        <p style="font-size:13px;color:#666">Kod 10 daqiqa davomida amal qiladi.</p>
        <p style="font-size:13px;color:#666">Agar siz bu so'rovni yuborgan bo'lmasangiz — bu xabarni e'tiborsiz qoldiring.</p>
        <p style="font-size:13px;color:#555;margin-top:24px">MakerPay — To'lov avtomatizatsiya platformasi</p>
      </div>
    `);
  }

  async sendOtp(email: string, code: string, fullName?: string) {
    await this.transporter.sendMail({
      from: `"MakerPay" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Email tasdiqlash kodi — MakerPay',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#fff;border-radius:16px;padding:32px;border:1px solid #222">
          <h2 style="margin:0 0 8px;font-size:22px">MakerPay</h2>
          <p style="color:#888;margin:0 0 24px;font-size:14px">To'lov avtomatizatsiya platformasi</p>
          <p style="font-size:15px;color:#ccc">Salom${fullName ? ', ' + fullName : ''}!</p>
          <p style="font-size:14px;color:#aaa">Emailingizni tasdiqlash uchun quyidagi kodni kiriting:</p>
          <div style="background:#111;border:1px solid #333;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#fff">${code}</span>
          </div>
          <p style="font-size:13px;color:#666">Kod 10 daqiqa davomida amal qiladi.</p>
          <p style="font-size:13px;color:#666">Agar siz ro'yxatdan o'tmagan bo'lsangiz — bu xabarni e'tiborsiz qoldiring.</p>
        </div>
      `,
    });
    this.logger.log(`OTP sent to ${email}`);
  }
}
