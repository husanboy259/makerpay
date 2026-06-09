import { Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
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

export class SmartPayAdapter extends BasePaymentAdapter {
  readonly providerName = 'smartpay';
  private readonly logger = new Logger(SmartPayAdapter.name);
  private readonly http: AxiosInstance;

  constructor(credentials: AdapterCredentials) {
    super(credentials);
    this.http = axios.create({
      baseURL: 'https://smartpay.uz/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const { data } = await this.http.post('/invoices/', {
        merchant_id: this.credentials.merchantId,
        token: this.credentials.apiKey,
        amount: input.amount,
        description: input.description || 'To\'lov',
        callback_url: input.callbackUrl,
        return_url: input.returnUrl,
        phone: input.customerPhone?.replace(/\D/g, ''),
      });

      if (!data.success && !data.invoice_id && !data.id) {
        throw new Error(`SmartPay error: ${data.message || data.error || JSON.stringify(data)}`);
      }

      const invoiceId = data.invoice_id || data.id || data.order_id;
      const paymentUrl = data.payment_url || data.pay_url || data.url;

      return {
        providerPaymentId: String(invoiceId),
        paymentUrl,
        status: 'pending',
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`SmartPay createPayment error: ${JSON.stringify(error.response?.data)} status=${error.response?.status}`);
      throw new Error(`SmartPay error: ${error.response?.data?.message || error.message}`);
    }
  }

  async checkStatus(invoiceId: string): Promise<CheckStatusResult> {
    try {
      const { data } = await this.http.get(`/invoices/${invoiceId}`, {
        params: {
          merchant_id: this.credentials.merchantId,
          token: this.credentials.apiKey,
        },
      });
      return {
        providerPaymentId: invoiceId,
        status: this.mapStatus(data.status),
        amount: data.amount,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`SmartPay checkStatus error: ${error.message}`);
      throw new Error(`SmartPay checkStatus error: ${error.response?.data?.message || error.message}`);
    }
  }

  async refund(_input: RefundInput): Promise<RefundResult> {
    throw new Error('SmartPay refund not supported');
  }

  async handleWebhook(payload: any, _signature?: string): Promise<WebhookResult> {
    return {
      paymentId: payload.invoice_id || payload.order_id,
      status: this.mapStatus(payload.status),
      amount: parseFloat(payload.amount),
      rawData: payload,
    };
  }

  verifyWebhookSignature(_payload: any, _signature: string): boolean {
    return true;
  }

  private mapStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
    if (status === 'success' || status === 'paid' || status === 'completed') return 'completed';
    if (status === 'failed' || status === 'error') return 'failed';
    if (status === 'cancelled' || status === 'canceled') return 'cancelled';
    return 'pending';
  }
}
