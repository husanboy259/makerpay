import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as crypto from 'crypto';
import { WebhookLog } from './entities/webhook-log.entity';
import { Payment } from '../payments/entities/payment.entity';
import { MerchantProvider } from '../providers/entities/merchant-provider.entity';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepo: Repository<WebhookLog>,
    @InjectRepository(MerchantProvider)
    private readonly mpRepo: Repository<MerchantProvider>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async handleInboundWebhook(
    providerName: string,
    payload: any,
    signature?: string,
  ): Promise<void> {
    const log = this.webhookLogRepo.create({
      providerName,
      direction: 'inbound',
      eventType: payload.event || payload.type || 'payment.update',
      rawPayload: payload,
      status: 'pending',
    });
    await this.webhookLogRepo.save(log);

    const providerPaymentId = payload.payment_id || payload.transaction_id || payload.id;
    const externalOrderId   = payload.order_id   || payload.invoice_number || payload.merchant_order_id;
    const rawStatus         = payload.status      || payload.payment_status;

    if (!rawStatus) return;

    const statusMap: Record<string, string> = {
      paid: 'completed', success: 'completed', completed: 'completed',
      failed: 'failed', error: 'failed', cancelled: 'cancelled',
      processing: 'processing', pending: 'pending',
    };
    const mappedStatus = statusMap[rawStatus?.toLowerCase()] || 'pending';

    // Find the payment by provider payment ID or external order ID
    let payment: Payment | null = null;
    if (providerPaymentId) {
      payment = await this.paymentRepo.findOne({ where: { providerPaymentId } });
    }
    if (!payment && externalOrderId) {
      payment = await this.paymentRepo.findOne({ where: { externalOrderId } });
    }

    if (payment) {
      // Verify webhook signature if merchant has set a webhookSecret
      const mp = await this.mpRepo.findOne({
        where: { merchantId: payment.merchantId, providerName },
        select: ['id', 'webhookSecret'],
      });

      if (mp?.webhookSecret && signature) {
        const isValid = this.verifySignature(payload, signature, mp.webhookSecret);
        if (!isValid) {
          this.logger.warn(`Invalid webhook signature from ${providerName} for merchant ${payment.merchantId}`);
          await this.webhookLogRepo.update(log.id, { status: 'failed', errorMessage: 'Invalid signature' });
          return;
        }
      }

      const update: any = { status: mappedStatus };
      if (mappedStatus === 'completed') update.paidAt = new Date();
      if (providerPaymentId) update.providerPaymentId = providerPaymentId;
      await this.paymentRepo.update(payment.id, update);
      await this.webhookLogRepo.update(log.id, { status: 'delivered', merchantId: payment.merchantId });
      this.logger.log(`Payment ${payment.id} updated to ${mappedStatus} via ${providerName} webhook`);
    } else {
      this.logger.warn(`No payment found for webhook from ${providerName}: orderId=${externalOrderId}`);
      await this.webhookLogRepo.update(log.id, { status: 'failed', errorMessage: 'Payment not found' });
    }
  }

  async forwardWebhookToMerchant(
    merchantId: string,
    targetUrl: string,
    payload: any,
    logId?: string,
  ): Promise<void> {
    if (!targetUrl) return;

    try {
      const response = await axios.post(targetUrl, payload, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json', 'X-MakerPay-Event': 'payment.update' },
      });

      if (logId) {
        await this.webhookLogRepo.update(logId, {
          status: 'delivered',
          responseStatus: response.status,
          responseBody: JSON.stringify(response.data).substring(0, 1000),
          deliveredAt: new Date(),
        });
      }
    } catch (error: any) {
      this.logger.error(`Webhook forward failed to ${targetUrl}: ${error.message}`);
      if (logId) {
        await this.webhookLogRepo.update(logId, {
          status: 'failed',
          errorMessage: error.message,
          attemptCount: () => 'attempt_count + 1' as any,
          nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
        });
      }
    }
  }

  async getMerchantWebhookLogs(merchantId: string, page = 1, limit = 20) {
    const [data, total] = await this.webhookLogRepo.findAndCount({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit } };
  }

  private verifySignature(payload: any, signature: string, secret: string): boolean {
    try {
      const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
      const sigBuf = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async retryFailedWebhooks() {
    const failed = await this.webhookLogRepo.find({
      where: { status: 'retrying' },
      take: 10,
    });

    for (const log of failed) {
      if (log.attemptCount >= log.maxAttempts) {
        await this.webhookLogRepo.update(log.id, { status: 'failed' });
        continue;
      }

      if (log.nextRetryAt && new Date() < log.nextRetryAt) continue;

      await this.forwardWebhookToMerchant(
        log.merchantId,
        log.targetUrl,
        log.forwardedPayload,
        log.id,
      );
    }
  }
}
