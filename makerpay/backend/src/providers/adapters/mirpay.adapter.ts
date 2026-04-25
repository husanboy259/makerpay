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

export class MirPayAdapter extends BasePaymentAdapter {
  readonly providerName = 'mirpay';
  private readonly logger = new Logger(MirPayAdapter.name);
  private readonly http: AxiosInstance;

  constructor(credentials: AdapterCredentials) {
    super(credentials);
    const baseURL = credentials.testMode
      ? 'https://sandbox.mirpay.uz/api/v1'
      : 'https://api.mirpay.uz/api/v1';

    this.http = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': credentials.apiKey,
        'X-Merchant-Id': credentials.merchantId,
      },
    });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const { data } = await this.http.post('/payment/create', {
        merchant_id: this.credentials.merchantId,
        order_id: input.orderId,
        amount: input.amount,
        currency: input.currency || 'UZS',
        description: input.description,
        return_url: input.returnUrl,
        notify_url: input.callbackUrl,
        client_name: input.customerName,
        client_email: input.customerEmail,
        client_phone: input.customerPhone,
        extra: input.metadata,
      });

      return {
        providerPaymentId: data.payment_id || data.id,
        paymentUrl: data.payment_url || data.redirect_url,
        status: this.mapStatus(data.status),
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`MirPay createPayment error: ${error.message}`);
      throw new Error(`MirPay error: ${error.response?.data?.message || error.message}`);
    }
  }

  async checkStatus(providerPaymentId: string): Promise<CheckStatusResult> {
    try {
      const { data } = await this.http.get(`/payment/status/${providerPaymentId}`);

      return {
        providerPaymentId,
        status: this.mapStatus(data.status),
        amount: data.amount,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`MirPay checkStatus error: ${error.message}`);
      throw new Error(`MirPay error: ${error.response?.data?.message || error.message}`);
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const { data } = await this.http.post('/payment/refund', {
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
      this.logger.error(`MirPay refund error: ${error.message}`);
      throw new Error(`MirPay refund error: ${error.response?.data?.message || error.message}`);
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookResult> {
    if (signature && !this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid MirPay webhook signature');
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

  private mapStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
    const map: Record<string, any> = {
      created:    'pending',
      pending:    'pending',
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
