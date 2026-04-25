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

export class PaynestAdapter extends BasePaymentAdapter {
  readonly providerName = 'paynest';
  private readonly logger = new Logger(PaynestAdapter.name);
  private readonly http: AxiosInstance;

  constructor(credentials: AdapterCredentials) {
    super(credentials);
    const baseURL = credentials.testMode
      ? 'https://sandbox.paynest.uz/api'
      : 'https://api.paynest.uz/api';

    this.http = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': credentials.apiKey,
        'X-Merchant-ID': credentials.merchantId || '',
      },
    });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const signature = this.buildSignature({
        order_id: input.orderId,
        amount: input.amount,
        currency: input.currency,
      });

      const { data } = await this.http.post('/v2/payment/init', {
        order_id: input.orderId,
        amount: input.amount,
        currency: input.currency || 'UZS',
        description: input.description,
        success_url: input.returnUrl,
        notify_url: input.callbackUrl,
        buyer_name: input.customerName,
        buyer_email: input.customerEmail,
        buyer_phone: input.customerPhone,
        extra_fields: input.metadata,
        signature,
      });

      return {
        providerPaymentId: data.transaction_id || data.id,
        paymentUrl: data.redirect_url || data.payment_link,
        status: this.mapStatus(data.status),
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`Paynest createPayment error: ${error.message}`);
      throw new Error(`Paynest error: ${error.response?.data?.error || error.message}`);
    }
  }

  async checkStatus(providerPaymentId: string): Promise<CheckStatusResult> {
    try {
      const { data } = await this.http.post('/v2/payment/status', {
        transaction_id: providerPaymentId,
      });

      return {
        providerPaymentId,
        status: this.mapStatus(data.status),
        amount: data.amount,
        paidAt: data.completed_at ? new Date(data.completed_at) : undefined,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`Paynest checkStatus error: ${error.message}`);
      throw new Error(`Paynest error: ${error.response?.data?.error || error.message}`);
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const { data } = await this.http.post('/v2/payment/refund', {
        transaction_id: input.providerPaymentId,
        amount: input.amount,
        reason: input.reason,
        signature: this.buildSignature({ transaction_id: input.providerPaymentId, amount: input.amount }),
      });

      return {
        providerRefundId: data.refund_id || data.id,
        status: data.status,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`Paynest refund error: ${error.message}`);
      throw new Error(`Paynest refund error: ${error.response?.data?.error || error.message}`);
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookResult> {
    if (signature && !this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid Paynest webhook signature');
    }

    return {
      paymentId: payload.transaction_id || payload.order_id,
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
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  private buildSignature(params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return crypto
      .createHmac('sha256', this.credentials.secretKey)
      .update(sorted)
      .digest('hex');
  }

  private mapStatus(
    status: string,
  ): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
    const map: Record<string, any> = {
      initiated: 'pending',
      pending: 'pending',
      in_process: 'processing',
      paid: 'completed',
      completed: 'completed',
      succeeded: 'completed',
      failed: 'failed',
      rejected: 'failed',
      cancelled: 'cancelled',
      voided: 'cancelled',
      refunded: 'refunded',
      partially_refunded: 'refunded',
    };
    return map[status?.toLowerCase()] || 'pending';
  }
}
