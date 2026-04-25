import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { ProvidersService } from '../providers/providers.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { Merchant } from '../merchants/entities/merchant.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    private readonly providersService: ProvidersService,
    private readonly webhooksService: WebhooksService,
    private readonly dataSource: DataSource,
  ) {}

  async createPayment(merchantId: string, dto: CreatePaymentDto, apiKeyId?: string) {
    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.paymentRepo.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;
    }

    const merchant = await this.merchantRepo.findOne({ where: { id: merchantId } });
    if (!merchant) throw new NotFoundException('Merchant not found');

    // Get provider adapter
    let adapter: any, mp: any;
    if (dto.providerName) {
      ({ adapter, mp } = await this.providersService.getAdapterByProviderName(merchantId, dto.providerName));
    } else {
      ({ adapter, mp } = await this.providersService.getDefaultAdapter(merchantId));
    }

    // Calculate fees
    const platformFeePercent = merchant.feePercentage || 1.5;
    const platformFee = (dto.amount * platformFeePercent) / 100;

    // Create payment record
    const payment = this.paymentRepo.create({
      merchantId,
      merchantProviderId: mp.id,
      providerName: mp.providerName,
      apiKeyId,
      externalOrderId: dto.externalOrderId,
      idempotencyKey: dto.idempotencyKey || uuidv4(),
      amount: dto.amount,
      currency: dto.currency || 'UZS',
      description: dto.description,
      returnUrl: dto.returnUrl,
      callbackUrl: dto.callbackUrl,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      customerId: dto.customerId,
      platformFee,
      netAmount: dto.amount - platformFee,
      metadata: dto.metadata || {},
      status: PaymentStatus.PENDING,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    });

    await this.paymentRepo.save(payment);

    // Call provider
    try {
      const result = await adapter.createPayment({
        amount: dto.amount,
        currency: dto.currency || 'UZS',
        orderId: payment.id,
        description: dto.description,
        returnUrl: dto.returnUrl,
        callbackUrl: `${process.env.BASE_URL}/api/v1/webhooks/${mp.providerName}`,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        metadata: dto.metadata,
      });

      await this.paymentRepo.update(payment.id, {
        providerPaymentId: result.providerPaymentId,
        paymentUrl: result.paymentUrl,
        status: this.mapProviderStatus(result.status),
        providerResponse: result.rawResponse,
      });

      // Update provider stats
      await this.dataSource.query(
        'UPDATE merchant_providers SET total_transactions = total_transactions + 1, last_used_at = NOW() WHERE id = $1',
        [mp.id],
      );

      return { ...payment, paymentUrl: result.paymentUrl, providerPaymentId: result.providerPaymentId };
    } catch (error: any) {
      await this.paymentRepo.update(payment.id, {
        status: PaymentStatus.FAILED,
        errorMessage: error.message,
        failedAt: new Date(),
      });
      throw new BadRequestException(`Payment creation failed: ${error.message}`);
    }
  }

  async getPaymentStatus(merchantId: string, paymentId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, merchantId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    // If pending/processing, check live status from provider
    if (['pending', 'processing'].includes(payment.status) && payment.providerPaymentId) {
      try {
        const { adapter } = await this.providersService.getAdapterByProviderName(
          merchantId,
          payment.providerName,
        );
        const status = await adapter.checkStatus(payment.providerPaymentId);
        const newStatus = this.mapProviderStatus(status.status);

        if (newStatus !== payment.status) {
          await this.paymentRepo.update(payment.id, {
            status: newStatus,
            paidAt: status.paidAt,
            providerResponse: status.rawResponse,
          });
          payment.status = newStatus;
        }
      } catch (error: any) {
        this.logger.warn(`Could not refresh payment status: ${error?.message}`);
      }
    }

    return payment;
  }

  async getPayments(merchantId: string, query: QueryPaymentsDto) {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .where('p.merchantId = :merchantId', { merchantId });

    if (query.status) qb.andWhere('p.status = :status', { status: query.status });
    if (query.providerName) qb.andWhere('p.providerName = :providerName', { providerName: query.providerName });
    if (query.from) qb.andWhere('p.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('p.createdAt <= :to', { to: query.to });
    if (query.search) {
      qb.andWhere(
        '(p.externalOrderId ILIKE :search OR p.customerName ILIKE :search OR p.customerPhone ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    qb.orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async refundPayment(merchantId: string, paymentId: string, dto: RefundPaymentDto, requestedBy: string) {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId, merchantId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }
    if (dto.amount > payment.amount) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    const { adapter } = await this.providersService.getAdapterByProviderName(merchantId, payment.providerName);

    try {
      const result = await adapter.refund({
        providerPaymentId: payment.providerPaymentId,
        amount: dto.amount,
        reason: dto.reason,
      });

      await this.paymentRepo.update(payment.id, { status: PaymentStatus.REFUNDED });

      return result;
    } catch (error: any) {
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  async getMerchantStats(merchantId: string) {
    const result = await this.paymentRepo
      .createQueryBuilder('p')
      .select([
        'COUNT(*) as total',
        'COUNT(*) FILTER (WHERE p.status = \'completed\') as completed',
        'COUNT(*) FILTER (WHERE p.status = \'failed\') as failed',
        'COUNT(*) FILTER (WHERE p.status = \'pending\') as pending',
        'COALESCE(SUM(p.amount) FILTER (WHERE p.status = \'completed\'), 0) as total_volume',
        'COALESCE(SUM(p.platform_fee) FILTER (WHERE p.status = \'completed\'), 0) as total_fees',
        'COALESCE(AVG(p.amount) FILTER (WHERE p.status = \'completed\'), 0) as avg_amount',
      ])
      .where('p.merchantId = :merchantId', { merchantId })
      .getRawOne();

    const today = await this.paymentRepo
      .createQueryBuilder('p')
      .select([
        'COUNT(*) FILTER (WHERE p.status = \'completed\') as today_completed',
        'COALESCE(SUM(p.amount) FILTER (WHERE p.status = \'completed\'), 0) as today_volume',
      ])
      .where('p.merchantId = :merchantId', { merchantId })
      .andWhere('p.createdAt >= CURRENT_DATE')
      .getRawOne();

    return { ...result, ...today };
  }

  async getDailyChart(merchantId: string, days = 7) {
    const rows = await this.paymentRepo.query(
      `SELECT
         TO_CHAR(DATE(p.created_at), 'YYYY-MM-DD') as date,
         COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0)::float as amount,
         COUNT(*) FILTER (WHERE p.status = 'completed') as count
       FROM payments p
       WHERE p.merchant_id = $1
         AND p.created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(p.created_at)
       ORDER BY DATE(p.created_at) ASC`,
      [merchantId],
    );

    // fill missing days with 0
    const result: { date: string; amount: number; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = rows.find((r: any) => r.date === key);
      const day = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'][d.getDay()];
      result.push({ date: day, amount: found ? parseFloat(found.amount) : 0, count: found ? parseInt(found.count) : 0 });
    }
    return result;
  }

  async updatePaymentFromWebhook(
    providerPaymentId: string,
    status: string,
    rawData: Record<string, any>,
  ) {
    const payment = await this.paymentRepo.findOne({ where: { providerPaymentId } });
    if (!payment) return null;

    const newStatus = this.mapProviderStatus(status);
    await this.paymentRepo.update(payment.id, {
      status: newStatus,
      paidAt: newStatus === PaymentStatus.COMPLETED ? new Date() : payment.paidAt,
      providerResponse: rawData,
    });

    return { ...payment, status: newStatus };
  }

  private mapProviderStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      completed: PaymentStatus.COMPLETED,
      failed: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
    };
    return map[status] || PaymentStatus.PENDING;
  }
}
