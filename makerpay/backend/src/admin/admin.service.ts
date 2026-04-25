import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { Payment } from '../payments/entities/payment.entity';
import { WebhookLog } from '../webhooks/entities/webhook-log.entity';
import { MerchantProvider } from '../providers/entities/merchant-provider.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(WebhookLog)
    private readonly webhookRepo: Repository<WebhookLog>,
    @InjectRepository(MerchantProvider)
    private readonly mpRepo: Repository<MerchantProvider>,
  ) {}

  async getDashboardStats() {
    const [
      totalMerchants,
      activeMerchants,
      pendingMerchants,
      totalUsers,
      totalPayments,
      completedPayments,
    ] = await Promise.all([
      this.merchantRepo.count(),
      this.merchantRepo.count({ where: { status: 'active' as any } }),
      this.merchantRepo.count({ where: { status: 'pending_verification' as any } }),
      this.userRepo.count(),
      this.paymentRepo.count(),
      this.paymentRepo.count({ where: { status: 'completed' as any } }),
    ]);

    const volumeResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'totalVolume')
      .where("p.status = 'completed'")
      .getRawOne();

    const todayStats = await this.paymentRepo
      .createQueryBuilder('p')
      .select([
        'COUNT(*) as today_payments',
        'COALESCE(SUM(p.amount) FILTER (WHERE p.status = \'completed\'), 0) as today_volume',
      ])
      .where('p.createdAt >= CURRENT_DATE')
      .getRawOne();

    const providerStats = await this.mpRepo
      .createQueryBuilder('mp')
      .select(['mp.providerName', 'COUNT(*) as count', 'SUM(mp.totalVolume) as volume'])
      .groupBy('mp.providerName')
      .getRawMany();

    return {
      merchants: { total: totalMerchants, active: activeMerchants, pending: pendingMerchants },
      users: { total: totalUsers },
      payments: {
        total: totalPayments,
        completed: completedPayments,
        totalVolume: parseFloat(volumeResult?.totalVolume || '0'),
      },
      today: {
        payments: parseInt(todayStats?.today_payments || '0'),
        volume: parseFloat(todayStats?.today_volume || '0'),
      },
      providers: providerStats,
    };
  }

  async getAllPayments(page = 1, limit = 20, filters: any = {}) {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.merchant', 'm');

    if (filters.status) qb.andWhere('p.status = :status', { status: filters.status });
    if (filters.merchantId) qb.andWhere('p.merchantId = :merchantId', { merchantId: filters.merchantId });
    if (filters.providerName) qb.andWhere('p.providerName = :providerName', { providerName: filters.providerName });
    if (filters.from) qb.andWhere('p.createdAt >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('p.createdAt <= :to', { to: filters.to });

    const [data, total] = await qb
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit } };
  }

  async getAllUsers(page = 1, limit = 20) {
    const [data, total] = await this.userRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit } };
  }

  async updateUserRole(userId: string, role: string) {
    await this.userRepo.update(userId, { role: role as any });
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async banUser(userId: string) {
    await this.userRepo.update(userId, { isActive: false });
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async unbanUser(userId: string) {
    await this.userRepo.update(userId, { isActive: true, failedLoginCount: 0, lockedUntil: null as any });
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async getUserById(userId: string) {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async getUserLogs(userId: string) {
    const merchant = await this.merchantRepo.findOne({ where: { user: { id: userId } } as any });
    const payments = merchant
      ? await this.paymentRepo.find({
          where: { merchant: { id: merchant.id } } as any,
          order: { createdAt: 'DESC' },
          take: 20,
        })
      : [];
    return { payments, merchantId: merchant?.id };
  }

  async getErrorLogs(page = 1, limit = 50) {
    const [data, total] = await this.paymentRepo.findAndCount({
      where: { status: 'failed' as any },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit } };
  }

  async getWebhookErrors(page = 1, limit = 50) {
    const [data, total] = await this.webhookRepo.findAndCount({
      where: { status: 'failed' },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit } };
  }

  async getRevenueChart(days = 30) {
    const rows = await this.paymentRepo
      .createQueryBuilder('p')
      .select([
        "TO_CHAR(DATE_TRUNC('day', p.created_at), 'DD Mon') as name",
        "COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) as amount",
      ])
      .where("p.created_at >= NOW() - (:days || ' days')::interval", { days: String(days) })
      .groupBy("DATE_TRUNC('day', p.created_at)")
      .orderBy("DATE_TRUNC('day', p.created_at)", 'ASC')
      .getRawMany();

    return rows.map(r => ({ name: r.name, amount: parseFloat(r.amount) }));
  }
}
