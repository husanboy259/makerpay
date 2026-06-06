import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantSubscription, TrialApplication, PLAN_LIMITS } from './entities/subscription.entity';
import { Notification } from './entities/notification.entity';
import { SubscriptionOrder, PLAN_PRICES } from './entities/subscription-order.entity';
import { TsPayAdapter } from '../providers/adapters/tspay.adapter';
import { QulayPayAdapter } from '../providers/adapters/qulaypay.adapter';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(MerchantSubscription)
    private readonly subRepo: Repository<MerchantSubscription>,
    @InjectRepository(TrialApplication)
    private readonly trialRepo: Repository<TrialApplication>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(SubscriptionOrder)
    private readonly orderRepo: Repository<SubscriptionOrder>,
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

  // ─── Subscription Orders (paid plans) ────────────────────────────

  getSubscriptionPaymentInfo() {
    return {
      cardNumber: process.env.PLATFORM_PAYMENT_CARD || '8600 0000 0000 0000',
      cardHolder: process.env.PLATFORM_CARD_HOLDER || 'MakerPay',
    };
  }

  private readonly logger = new Logger(SubscriptionsService.name);

  private getPlatformAdapter() {
    const provider = process.env.PLATFORM_PROVIDER || 'tspay';
    const apiKey    = process.env[`PLATFORM_${provider.toUpperCase()}_API_KEY`]    || process.env.TSPAY_API_KEY    || '';
    const secretKey = process.env[`PLATFORM_${provider.toUpperCase()}_SECRET_KEY`] || process.env.TSPAY_SECRET_KEY || '';
    const merchantId = process.env[`PLATFORM_${provider.toUpperCase()}_MERCHANT_ID`] || process.env.TSPAY_MERCHANT_ID || '';

    if (!apiKey) return null;

    const testMode = process.env.PLATFORM_TEST_MODE === 'true';
    const credentials = { apiKey, secretKey, merchantId, testMode, extraConfig: {} };
    return provider === 'qulaypay' ? { adapter: new QulayPayAdapter(credentials), provider } :
                                     { adapter: new TsPayAdapter(credentials), provider };
  }

  async createOrder(userId: string, merchantId: string, plan: string) {
    const amount = PLAN_PRICES[plan];
    if (!amount) throw new BadRequestException(`Noma'lum tarif: ${plan}`);

    await this.orderRepo.update({ merchantId, plan, status: 'pending' }, { status: 'cancelled' });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const order = await this.orderRepo.save(
      this.orderRepo.create({ userId, merchantId, plan, amount, expiresAt }),
    );

    const platform = this.getPlatformAdapter();
    if (platform) {
      try {
        const baseUrl = process.env.BASE_URL || 'https://makerpay.uz';

        // TSPay calls our webhook synchronously during createPayment (checkPerform +
        // createTransaction). Pre-store the numeric order_id so the webhook handler
        // can look up this order before createPayment returns.
        if (platform.provider === 'tspay') {
          const numericId = TsPayAdapter.uuidToOrderId(order.id);
          await this.orderRepo.update(order.id, {
            providerPaymentId: numericId.toString(),
            paymentProvider: 'tspay',
          });
        }

        const result = await platform.adapter.createPayment({
          orderId: order.id,
          amount,
          currency: 'UZS',
          description: `MakerPay ${plan.toUpperCase()} tarifi — 1 oy`,
          returnUrl: `${baseUrl}/dashboard/merchant/upgrade?plan=${plan}&order=${order.id}`,
          callbackUrl: `${baseUrl}/api/v1/subscriptions/webhook/${platform.provider}`,
        });

        await this.orderRepo.update(order.id, {
          status: 'processing',
          providerPaymentId: result.providerPaymentId, // cheque_id for TSPay
          paymentProvider: platform.provider,
          paymentUrl: result.paymentUrl,
        });

        return { ...order, status: 'processing', paymentUrl: result.paymentUrl, providerPaymentId: result.providerPaymentId };
      } catch (err: any) {
        this.logger.warn(`Payment provider error, falling back to manual: ${err.message}`);
        if (platform.provider === 'tspay') {
          await this.orderRepo.update(order.id, { providerPaymentId: null, paymentProvider: null });
        }
      }
    }

    return order;
  }

  async handleProviderWebhook(provider: string, payload: any, signature?: string, timestamp?: string) {
    if (provider === 'tspay') {
      return this.handleTsPayWebhook(payload, signature, timestamp);
    }

    const platform = this.getPlatformAdapter();
    if (platform) {
      try {
        const result = await platform.adapter.handleWebhook(payload, signature);
        if (result.status === 'completed') {
          const order = await this.orderRepo.findOne({ where: { id: result.paymentId } }) ||
                        await this.orderRepo.findOne({ where: { providerPaymentId: result.paymentId } });
          if (order && order.status !== 'paid') {
            await this.orderRepo.update(order.id, { status: 'paid', paidAt: new Date() });
            await this.assignPlan(order.merchantId, order.plan, 'webhook', `${provider} webhook`, 1);
            await this.notify(
              order.userId,
              `✅ ${order.plan.toUpperCase()} tarifi faollashtirildi!`,
              `To'lovingiz tasdiqlandi. ${order.plan.toUpperCase()} tarifi 1 oyga faollashtirildi.`,
              'subscription_activated',
              '/dashboard/merchant',
            );
          }
        }
        return { received: true };
      } catch (err: any) {
        this.logger.error(`Webhook error: ${err.message}`);
        return { received: true };
      }
    }
    return { received: true };
  }

  private async handleTsPayWebhook(payload: any, signature?: string, timestamp?: string) {
    const method = payload?.method;
    const params = payload?.params || {};

    if (signature && timestamp) {
      const platform = this.getPlatformAdapter();
      if (platform?.provider === 'tspay') {
        const valid = (platform.adapter as TsPayAdapter).verifyWebhookSignature(payload, signature, timestamp);
        if (!valid) {
          this.logger.warn('TSPay webhook: invalid signature');
          return { allow: false, reason: 'Invalid signature' };
        }
      }
    }

    if (method === 'checkPerform') {
      const orderId = params.order_id?.toString();
      const order = await this.orderRepo.findOne({
        where: { providerPaymentId: orderId, paymentProvider: 'tspay' },
      });
      if (!order) {
        this.logger.warn(`TSPay checkPerform: order not found (order_id=${orderId})`);
        return { allow: false, reason: 'Order topilmadi' };
      }
      if (Math.abs(order.amount - Number(params.amount)) > 1) {
        return { allow: false, reason: 'Summa mos kelmaydi' };
      }
      return { allow: true };
    }

    if (method === 'createTransaction') {
      const orderId = params.order_id?.toString();
      const order = await this.orderRepo.findOne({
        where: { providerPaymentId: orderId, paymentProvider: 'tspay' },
      });
      if (!order) return { success: false };
      return { success: true, transaction_id: order.id };
    }

    if (method === 'performTransaction') {
      const order = await this.orderRepo.findOne({
        where: { providerPaymentId: params.cheque_id, paymentProvider: 'tspay' },
      });
      if (!order) {
        this.logger.warn(`TSPay performTransaction: order not found (cheque_id=${params.cheque_id})`);
        return { success: false };
      }
      if (order.status === 'paid') return { success: true };

      // Reject webhooks arriving more than 10 minutes after order creation (fake/replay protection)
      const ageMs = Date.now() - new Date(order.createdAt).getTime();
      if (ageMs > 10 * 60 * 1000) {
        this.logger.warn(`TSPay performTransaction: order expired (age=${Math.round(ageMs / 1000)}s)`);
        await this.orderRepo.update(order.id, { status: 'cancelled' });
        return { success: false };
      }

      await this.orderRepo.update(order.id, { status: 'paid', paidAt: new Date() });
      await this.assignPlan(order.merchantId, order.plan, 'tspay', "TSPay orqali to'lov", 1);
      await this.notify(
        order.userId,
        `✅ ${order.plan.toUpperCase()} tarifi faollashtirildi!`,
        `TSPay orqali to'lovingiz tasdiqlandi. ${order.plan.toUpperCase()} tarifi 1 oyga faollashtirildi.`,
        'subscription_activated',
        '/dashboard/merchant',
      );
      return { success: true };
    }

    // TSPay cancels transactions after 10 min or user cancels payment
    if (method === 'cancelTransaction') {
      const order = await this.orderRepo.findOne({
        where: { providerPaymentId: params.cheque_id || params.order_id?.toString(), paymentProvider: 'tspay' },
      });
      if (order) {
        if (order.status === 'paid') {
          // Payment was already activated — downgrade subscription back to start
          await this.orderRepo.update(order.id, { status: 'cancelled' });
          await this.assignPlan(order.merchantId, 'start', 'tspay', "To'lov bekor qilindi — downgrade", 0);
          await this.notify(
            order.userId,
            '❌ To\'lov bekor qilindi',
            `${order.plan.toUpperCase()} tarifi to'lovi bekor qilindi. Subscription o'chirildi.`,
            'payment_cancelled',
            '/pricing',
          );
        } else if (order.status !== 'cancelled') {
          await this.orderRepo.update(order.id, { status: 'cancelled' });
          await this.notify(
            order.userId,
            '❌ To\'lov bekor qilindi',
            'To\'lovingiz bekor qilindi yoki muddati o\'tdi. Qaytadan urinib ko\'ring.',
            'payment_cancelled',
            '/pricing',
          );
        }
      }
      return { success: true };
    }

    this.logger.warn(`TSPay: unknown webhook method: ${method}`);
    return { allow: false, reason: "Noma'lum method" };
  }

  async submitPaymentProof(orderId: string, userId: string, payerName: string, payerPhone: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order topilmadi');
    if (order.status === 'paid') throw new BadRequestException('Bu order allaqachon tasdiqlangan');

    await this.orderRepo.update(orderId, {
      payerName,
      payerPhone,
      status: 'paid',
      paidAt: new Date(),
    });

    await this.assignPlan(order.merchantId, order.plan, 'auto', "Foydalanuvchi to'lov ma'lumotlarini yubordi", 1);

    await this.notify(
      userId,
      `✅ ${order.plan.toUpperCase()} tarifi faollashtirildi!`,
      `To'lovingiz qabul qilindi. ${order.plan.toUpperCase()} tarifi 1 oyga faollashtirildi.`,
      'subscription_activated',
      '/dashboard/merchant',
    );

    return this.orderRepo.findOne({ where: { id: orderId } });
  }

  async getMyOrders(userId: string) {
    return this.orderRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 10 });
  }

  async getOrderStatus(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order topilmadi');
    return order;
  }

  async getAllOrders(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [data, total] = await this.orderRepo.findAndCount({
      where, order: { createdAt: 'DESC' },
      skip: (page - 1) * limit, take: limit,
    });
    return { data, meta: { total, page, limit } };
  }

  async adminConfirmOrder(orderId: string, adminId: string, adminNote?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order topilmadi');
    if (order.status === 'paid') throw new BadRequestException('Bu order allaqachon tasdiqlangan');

    await this.orderRepo.update(orderId, {
      status: 'paid',
      paidAt: new Date(),
      adminConfirmedBy: adminId,
      adminNote,
    });

    // Activate the plan for the merchant
    const months = 1;
    await this.assignPlan(order.merchantId, order.plan, adminId, `To'lov tasdiqlandi: ${adminNote || ''}`, months);

    await this.notify(
      order.userId,
      `✅ ${order.plan.toUpperCase()} tarifi faollashtirildi!`,
      `To'lovingiz tasdiqlandi. ${order.plan.toUpperCase()} tarifi 1 oyga faollashtirildi.`,
      'subscription_activated',
      '/dashboard/merchant',
    );

    return this.orderRepo.findOne({ where: { id: orderId } });
  }

  async adminRejectOrder(orderId: string, adminId: string, adminNote: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order topilmadi');

    await this.orderRepo.update(orderId, {
      status: 'rejected',
      adminConfirmedBy: adminId,
      adminNote,
    });

    await this.notify(
      order.userId,
      `❌ To'lov tasdiqlanmadi`,
      adminNote || "To'lovingiz tasdiqlanmadi. Iltimos, qayta urinib ko'ring yoki support bilan bog'laning.",
      'payment_rejected',
      '/dashboard/merchant',
    );

    return this.orderRepo.findOne({ where: { id: orderId } });
  }
}
