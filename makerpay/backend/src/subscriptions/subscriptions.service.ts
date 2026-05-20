import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantSubscription, TrialApplication, PLAN_LIMITS } from './entities/subscription.entity';
import { Notification } from './entities/notification.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(MerchantSubscription)
    private readonly subRepo: Repository<MerchantSubscription>,
    @InjectRepository(TrialApplication)
    private readonly trialRepo: Repository<TrialApplication>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  private async notify(userId: string, title: string, message: string, type: string, actionUrl?: string) {
    const n = this.notifRepo.create({ userId, title, message, type, actionUrl, icon: type });
    await this.notifRepo.save(n).catch(() => {});
  }

  async getNotifications(userId: string) {
    return this.notifRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 30 });
  }

  async markRead(id: string, userId: string) {
    await this.notifRepo.update({ id, userId }, { isRead: true, readAt: new Date() });
  }

  async markAllRead(userId: string) {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
  }

  async getUnreadCount(userId: string) {
    return this.notifRepo.count({ where: { userId, isRead: false } });
  }

  // ─── Merchant subscription ─────────────────────────────────────────

  async getMySubscription(merchantId: string) {
    let sub = await this.subRepo.findOne({ where: { merchantId } });
    if (!sub) {
      // Auto-create START plan
      sub = this.subRepo.create({
        merchantId,
        plan: 'start',
        status: 'active',
        requestLimit: 200,
        storeLimit: 1,
        price: 0,
        startsAt: new Date(),
      });
      await this.subRepo.save(sub);
    }
    return sub;
  }

  async getAllSubscriptions(page = 1, limit = 20) {
    const [data, total] = await this.subRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit } };
  }

  async assignPlan(merchantId: string, plan: string, adminId: string, adminNote?: string, months?: number) {
    if (!PLAN_LIMITS[plan]) throw new BadRequestException(`Unknown plan: ${plan}`);
    const limits = PLAN_LIMITS[plan];
    const expiresAt = months ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000) : undefined;

    let sub = await this.subRepo.findOne({ where: { merchantId } });
    if (sub) {
      await this.subRepo.update(sub.id, {
        plan, status: 'active',
        requestLimit: limits.requestLimit,
        storeLimit: limits.storeLimit,
        price: limits.price,
        startsAt: new Date(),
        expiresAt: expiresAt || null,
        assignedBy: adminId,
        adminNote,
      });
      return this.subRepo.findOne({ where: { merchantId } });
    }

    sub = this.subRepo.create({
      merchantId, plan, status: 'active',
      requestLimit: limits.requestLimit,
      storeLimit: limits.storeLimit,
      price: limits.price,
      startsAt: new Date(),
      expiresAt,
      assignedBy: adminId,
      adminNote,
    });
    return this.subRepo.save(sub);
  }

  // ─── Trial applications ────────────────────────────────────────────

  getTrialPaymentInfo() {
    return {
      amount: 6000,
      currency: 'UZS',
      cardNumber: process.env.PLATFORM_PAYMENT_CARD || '8600 0000 0000 0000',
      cardHolder: process.env.PLATFORM_CARD_HOLDER || 'MakerPay',
      description: 'Trial ariza tekshiruv to\'lovi',
    };
  }

  async applyForTrial(userId: string, merchantId: string, dto: {
    companyName: string; description: string; mvpUrl?: string;
    telegramUsername?: string; phone: string;
    verificationPayerName?: string; verificationPayerPhone?: string;
  }) {
    const existing = await this.trialRepo.findOne({ where: { userId, status: 'pending' } });
    if (existing) throw new BadRequestException('Sizning arizangiz allaqachon ko\'rib chiqilmoqda');

    const app = this.trialRepo.create({
      userId, merchantId, ...dto,
      verificationPaid: !!(dto.verificationPayerName && dto.verificationPayerPhone),
      verificationAmount: 6000,
    });
    return this.trialRepo.save(app);
  }

  async getMyTrialApplication(userId: string) {
    return this.trialRepo.findOne({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async getAllTrialApplications(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [data, total] = await this.trialRepo.findAndCount({
      where, order: { createdAt: 'DESC' },
      skip: (page - 1) * limit, take: limit,
    });
    return { data, meta: { total, page, limit } };
  }

  async approveTrialApplication(id: string, adminId: string, invitationText?: string) {
    const app = await this.trialRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Ariza topilmadi');
    if (app.status !== 'pending') throw new BadRequestException('Ariza allaqachon ko\'rib chiqilgan');

    await this.trialRepo.update(id, {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      invitationText,
    });

    // Assign TRIAL plan for 2 months
    if (app.merchantId) {
      await this.assignPlan(app.merchantId, 'trial', adminId, 'Trial approved', 2);
    }

    // Notify user
    await this.notify(
      app.userId,
      '🎉 Trial arizangiz tasdiqlandi!',
      invitationText || "Tabriklaymiz! Sizga 2 oylik bepul TRIAL rejasi berildi. Business darajasida barcha imkoniyatlardan foydalaning.",
      'trial_approved',
      '/dashboard/merchant',
    );

    return this.trialRepo.findOne({ where: { id } });
  }

  async rejectTrialApplication(id: string, adminId: string, adminNote: string) {
    const app = await this.trialRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Ariza topilmadi');

    await this.trialRepo.update(id, {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      adminNote,
    });

    await this.notify(
      app.userId,
      '❌ Trial arizangiz rad etildi',
      adminNote || "Afsuski, arizangiz qabul qilinmadi. Batafsil ma'lumot uchun support bilan bog'laning.",
      'trial_rejected',
      '/dashboard/merchant',
    );

    return this.trialRepo.findOne({ where: { id } });
  }

  async sendInvitation(id: string, adminId: string, invitationText: string) {
    const app = await this.trialRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Ariza topilmadi');
    await this.trialRepo.update(id, { invitationText, reviewedBy: adminId });

    await this.notify(
      app.userId,
      '📨 MakerPay dan taklif!',
      invitationText,
      'invitation',
      '/dashboard/merchant',
    );

    return this.trialRepo.findOne({ where: { id } });
  }

  async getStats() {
    const plans = Object.keys(PLAN_LIMITS);
    const subs = await this.subRepo.find();
    const trials = await this.trialRepo.find();
    return {
      totalSubscriptions: subs.length,
      byPlan: plans.map(p => ({ plan: p, count: subs.filter(s => s.plan === p).length })),
      trialApplications: {
        total: trials.length,
        pending: trials.filter(t => t.status === 'pending').length,
        approved: trials.filter(t => t.status === 'approved').length,
        rejected: trials.filter(t => t.status === 'rejected').length,
      },
    };
  }
}
