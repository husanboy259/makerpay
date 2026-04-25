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
