import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { WebhookLog } from './entities/webhook-log.entity';
import { PaymentsService } from '../payments/payments.service';
import { MerchantProvider } from '../providers/entities/merchant-provider.entity';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepo: Repository<WebhookLog>,
    @InjectRepository(MerchantProvider)
    private readonly mpRepo: Repository<MerchantProvider>,
  ) {}

  async handleInboundWebhook(
    providerName: string,
    payload: any,
    signature?: string,
  ): Promise<void> {
    // Log inbound webhook
    const log = this.webhookLogRepo.create({
      providerName,
      direction: 'inbound',
      eventType: payload.event || payload.type || 'payment.update',
      rawPayload: payload,
      status: 'pending',
    });
    await this.webhookLogRepo.save(log);

    // Find which merchant this belongs to
    const orderId = payload.order_id || payload.invoice_number || payload.payment_id;

    this.logger.log(`Inbound webhook from ${providerName}: ${orderId}`);
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
