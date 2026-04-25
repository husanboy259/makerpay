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

export class TulovpayAdapter extends BasePaymentAdapter {
  readonly providerName = 'tulovpay';
  private readonly logger = new Logger(TulovpayAdapter.name);
  private readonly http: AxiosInstance;

  constructor(credentials: AdapterCredentials) {
    super(credentials);
    const baseURL = credentials.testMode
      ? 'https://sandbox.tulovpay.uz/api/v1'
      : 'https://api.tulovpay.uz/api/v1';

    this.http = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.secretKey}`).toString('base64')}`,
      },
    });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const { data } = await this.http.post('/invoice/create', {
        merchant: this.credentials.merchantId,
        invoice_number: input.orderId,
        amount: Math.round(input.amount), // TulovPay uses integers (tiyin)
        currency: input.currency || 'UZS',
        description: input.description,
        redirect_url: input.returnUrl,
        webhook_url: input.callbackUrl,
        payer_info: {
          name: input.customerName,
          email: input.customerEmail,
          phone: input.customerPhone,
        },
        metadata: input.metadata,
      });

      return {
        providerPaymentId: data.invoice_id || data.id,
        paymentUrl: data.payment_url || data.checkout_url,
        status: this.mapStatus(data.state || data.status),
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`TulovPay createPayment error: ${error.message}`);
      throw new Error(`TulovPay error: ${error.response?.data?.message || error.message}`);
    }
  }

  async checkStatus(providerPaymentId: string): Promise<CheckStatusResult> {
    try {
      const { data } = await this.http.get(`/invoice/${providerPaymentId}`);

      return {
        providerPaymentId,
        status: this.mapStatus(data.state || data.status),
        amount: data.amount,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`TulovPay checkStatus error: ${error.message}`);
      throw new Error(`TulovPay error: ${error.response?.data?.message || error.message}`);
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const { data } = await this.http.post('/refund/create', {
        invoice_id: input.providerPaymentId,
        amount: Math.round(input.amount),
        reason: input.reason,
      });

      return {
        providerRefundId: data.refund_id || data.id,
        status: data.state || data.status,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`TulovPay refund error: ${error.message}`);
      throw new Error(`TulovPay refund error: ${error.response?.data?.message || error.message}`);
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookResult> {
    if (signature && !this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid TulovPay webhook signature');
    }

    return {
      paymentId: payload.invoice_id || payload.invoice_number,
      status: this.mapStatus(payload.state || payload.status),
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

  private mapStatus(
    status: string,
  ): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
    const map: Record<string, any> = {
      new: 'pending',
      pending: 'pending',
      waiting: 'pending',
      processing: 'processing',
      in_progress: 'processing',
      paid: 'completed',
      completed: 'completed',
      confirmed: 'completed',
      failed: 'failed',
      error: 'failed',
      expired: 'cancelled',
      cancelled: 'cancelled',
      reversed: 'refunded',
      refunded: 'refunded',
    };
    return map[status?.toLowerCase()] || 'pending';
  }
}
