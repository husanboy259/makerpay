import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = this.userRepo.create({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      phone: dto.phone,
      role: UserRole.USER,
      emailVerified: false,
      otpCode: otp,
      otpExpiresAt,
    });

    await this.userRepo.save(user);
    await this.mailService.sendOtp(user.email, otp, user.fullName);

    return { message: 'OTP sent', email: user.email };
  }

  async verifyOtp(email: string, code: string) {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'email', 'otpCode', 'otpExpiresAt', 'role', 'fullName', 'avatarUrl'],
    });

    if (!user) throw new BadRequestException('Foydalanuvchi topilmadi');
    if (!user.otpCode || user.otpCode !== code) throw new BadRequestException('Kod noto\'g\'ri');
    if (new Date() > user.otpExpiresAt) throw new BadRequestException('Kod muddati tugagan');

    await this.userRepo.update(user.id, {
      emailVerified: true,
      otpCode: null as any,
      otpExpiresAt: null as any,
    });

    return this.generateTokens(user);
  }

  async googleLoginWithCode(code: string) {
    const axios = require('axios');
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  process.env.GOOGLE_CALLBACK_URL,
      grant_type:    'authorization_code',
    });
    const { access_token } = tokenRes.data;
    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileRes.data;
    return this.googleLogin({
      googleId:  profile.id,
      email:     profile.email,
      fullName:  profile.name,
      avatarUrl: profile.picture,
    });
  }

  async googleLogin(googleUser: { googleId: string; email: string; fullName: string; avatarUrl: string }) {
    let user = await this.userRepo.findOne({ where: { email: googleUser.email } });

    if (!user) {
      user = this.userRepo.create({
        email:         googleUser.email,
        fullName:      googleUser.fullName,
        avatarUrl:     googleUser.avatarUrl,
        role:          UserRole.USER,
        emailVerified: true,
        isActive:      true,
        password:      Math.random().toString(36),
      });
      await this.userRepo.save(user);
    } else {
      await this.userRepo.update(user.id, {
        avatarUrl:     googleUser.avatarUrl,
        emailVerified: true,
      });
    }

    return this.generateTokens(user);
  }

  async telegramLogin(authData: any) {
    const { hash, ...data } = authData;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new BadRequestException('Telegram not configured');

    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const checkString = Object.keys(data).sort().map(k => `${k}=${data[k]}`).join('\n');
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    if (hmac !== hash) throw new UnauthorizedException('Invalid Telegram auth');
    if (Date.now() / 1000 - Number(data.auth_date) > 86400) throw new UnauthorizedException('Auth expired');

    const telegramId = String(data.id);
    let user = await this.userRepo.findOne({ where: { telegramId } });

    if (!user) {
      user = this.userRepo.create({
        telegramId,
        email: `tg_${telegramId}@telegram.makerpay.uz`,
        fullName: [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Telegram User',
        telegramUsername: data.username,
        avatarUrl: data.photo_url,
        emailVerified: true,
        isActive: true,
        role: UserRole.USER,
        password: crypto.randomBytes(16).toString('hex'),
      });
      await this.userRepo.save(user);
    }

    return this.generateTokens(user);
  }

  async resendOtp(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Foydalanuvchi topilmadi');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.userRepo.update(user.id, { otpCode: otp, otpExpiresAt });
    await this.mailService.sendOtp(user.email, otp, user.fullName);

    return { message: 'OTP qayta yuborildi' };
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'password', 'role', 'isActive', 'fullName',
               'failedLoginCount', 'lockedUntil', 'avatarUrl'],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');
    if (user.isLocked) throw new UnauthorizedException('Account is temporarily locked');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      await this.userRepo.update(user.id, {
        failedLoginCount: user.failedLoginCount + 1,
        lockedUntil: user.failedLoginCount >= 4
          ? new Date(Date.now() + 15 * 60 * 1000)
          : null,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on success
    await this.userRepo.update(user.id, {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });

    return this.generateTokens(user);
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      return this.userRepo.findOne({ where: { id: payload.sub } });
    } catch {
      return null;
    }
  }

  async getProfile(userId: string) {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async updateProfile(userId: string, data: Partial<User>) {
    await this.userRepo.update(userId, data);
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(userId, { password: hashed });
    return { message: 'Password changed successfully' };
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
