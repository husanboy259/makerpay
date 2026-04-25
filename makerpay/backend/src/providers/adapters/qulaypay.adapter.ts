import { Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  BasePaymentAdapter,
  AdapterCredentials,
  CreatePaymentInput,
  CreatePaymentResult,
  CheckStatusResult,
  RefundInput,
  RefundResult,
  WebhookResult,
} from '../base.adapter';

export class QulayPayAdapter extends BasePaymentAdapter {
  readonly providerName = 'qulaypay';
  private readonly logger = new Logger(QulayPayAdapter.name);
  private readonly http: AxiosInstance;

  constructor(credentials: AdapterCredentials) {
    super(credentials);
    this.http = axios.create({
      baseURL: 'https://api.qulaypay.uz',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.apiKey}`,
      },
    });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const { data } = await this.http.post('/transaction/create', {
        amount: input.amount,
        provider: input.metadata?.provider || 'click',
        comment: input.description || input.orderId,
        redirect_url: input.returnUrl,
      });

      return {
        providerPaymentId: data.transaction?.id || data.id,
        paymentUrl: data.transaction?.payment_url || data.payment_url,
        status: this.mapStatus(data.transaction?.status || data.status),
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`QulayPay createPayment error: ${error.message}`);
      throw new Error(`QulayPay error: ${error.response?.data?.message || error.message}`);
    }
  }

  async checkStatus(providerPaymentId: string): Promise<CheckStatusResult> {
    try {
      const { data } = await this.http.get(`/transaction/${providerPaymentId}`);

      return {
        providerPaymentId,
        status: this.mapStatus(data.transaction?.status || data.status),
        amount: data.transaction?.amount || data.amount,
        paidAt: data.transaction?.paid_at ? new Date(data.transaction.paid_at) : undefined,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`QulayPay checkStatus error: ${error.message}`);
      throw new Error(`QulayPay error: ${error.response?.data?.message || error.message}`);
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const { data } = await this.http.post(`/transaction/${input.providerPaymentId}/refund`, {
        amount: input.amount,
        reason: input.reason,
      });

      return {
        providerRefundId: data.refund_id || data.id,
        status: data.status,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`QulayPay refund error: ${error.message}`);
      throw new Error(`QulayPay refund error: ${error.response?.data?.message || error.message}`);
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookResult> {
    if (signature && !this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid QulaYPay webhook signature');
    }

    return {
      paymentId: payload.external_id || payload.id,
      status: this.mapStatus(payload.status),
      amount: payload.amount,
      rawData: payload,
    };
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = crypto
      .createHmac('sha256', this.credentials.secretKey)
      .update(data)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  private mapStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
    const map: Record<string, any> = {
      created:    'pending',
      pending:    'pending',
      waiting:    'pending',
      processing: 'processing',
      paid:       'completed',
      completed:  'completed',
      success:    'completed',
      failed:     'failed',
      error:      'failed',
      cancelled:  'cancelled',
      refunded:   'refunded',
    };
    return map[status?.toLowerCase()] || 'pending';
  }
}
