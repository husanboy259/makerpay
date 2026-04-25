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

export class TsPayAdapter extends BasePaymentAdapter {
  readonly providerName = 'tspay';
  private readonly logger = new Logger(TsPayAdapter.name);
  private readonly http: AxiosInstance;

  constructor(credentials: AdapterCredentials) {
    super(credentials);
    const baseURL = credentials.testMode
      ? 'https://sandbox.tspay.uz/api/v1'
      : 'https://api.tspay.uz/api/v1';

    this.http = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credentials.apiKey}`,
      },
    });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const { data } = await this.http.post('/payments/create', {
        merchant_id: this.credentials.merchantId,
        order_id: input.orderId,
        amount: input.amount,
        currency: input.currency || 'UZS',
        description: input.description,
        return_url: input.returnUrl,
        callback_url: input.callbackUrl,
        customer: {
          name: input.customerName,
          email: input.customerEmail,
          phone: input.customerPhone,
        },
        extra: input.metadata,
      });

      return {
        providerPaymentId: data.payment_id || data.id,
        paymentUrl: data.payment_url || data.url,
        status: this.mapStatus(data.status),
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`TSPay createPayment error: ${error.message}`);
      throw new Error(`TSPay error: ${error.response?.data?.message || error.message}`);
    }
  }

  async checkStatus(providerPaymentId: string): Promise<CheckStatusResult> {
    try {
      const { data } = await this.http.get(`/payments/${providerPaymentId}/status`);

      return {
        providerPaymentId,
        status: this.mapStatus(data.status),
        amount: data.amount,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`TSPay checkStatus error: ${error.message}`);
      throw new Error(`TSPay error: ${error.response?.data?.message || error.message}`);
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const { data } = await this.http.post('/refunds/create', {
        payment_id: input.providerPaymentId,
        amount: input.amount,
        reason: input.reason,
      });

      return {
        providerRefundId: data.refund_id || data.id,
        status: data.status,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`TSPay refund error: ${error.message}`);
      throw new Error(`TSPay refund error: ${error.response?.data?.message || error.message}`);
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookResult> {
    if (signature && !this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid TSPay webhook signature');
    }

    return {
      paymentId: payload.payment_id || payload.order_id,
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

  private mapStatus(
    status: string,
  ): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
    const map: Record<string, any> = {
      created: 'pending',
      pending: 'pending',
      processing: 'processing',
      paid: 'completed',
      completed: 'completed',
      success: 'completed',
      failed: 'failed',
      error: 'failed',
      cancelled: 'cancelled',
      refunded: 'refunded',
    };
    return map[status?.toLowerCase()] || 'pending';
  }
}
