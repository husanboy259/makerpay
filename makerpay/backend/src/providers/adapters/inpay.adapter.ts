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

export class InPayAdapter extends BasePaymentAdapter {
  readonly providerName = 'inpay';
  private readonly logger = new Logger(InPayAdapter.name);
  private readonly http: AxiosInstance;
  private bearerToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(credentials: AdapterCredentials) {
    super(credentials);
    this.http = axios.create({
      baseURL: 'https://inpay.uz/api/v1',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    });
  }

  private async getBearerToken(): Promise<string> {
    if (this.bearerToken && Date.now() < this.tokenExpiry) {
      return this.bearerToken;
    }
    const { data } = await this.http.get('/authorization/', {
      params: {
        merchant_id: this.credentials.merchantId,
        merchant_token: this.credentials.secretKey,
      },
    });
    if (!data.success || !data.bearer_token) {
      throw new Error('inPAY: Bearer token olishda xatolik');
    }
    this.bearerToken = data.bearer_token;
    this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 soat
    return this.bearerToken;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const token = await this.getBearerToken();
      const { data } = await this.http.post('/create/', {
        merchant_id: this.credentials.merchantId,
        token: this.credentials.secretKey,
        amount: input.amount,
        description: input.description,
        callback_url: input.callbackUrl,
        phone: input.customerPhone?.replace(/\D/g, ''),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data.success) {
        throw new Error(`inPAY error: ${data.message || data.error_code}`);
      }

      return {
        providerPaymentId: data.order_id,
        paymentUrl: data.pay_url,
        status: 'pending',
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`inPAY createPayment error: ${error.message}`);
      throw new Error(`inPAY error: ${error.response?.data?.message || error.message}`);
    }
  }

  async checkStatus(orderId: string): Promise<CheckStatusResult> {
    try {
      const { data } = await this.http.get('/transactions/', {
        params: { order_id: orderId },
      });
      return {
        providerPaymentId: orderId,
        status: this.mapStatus(data.status),
        amount: data.amount,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        rawResponse: data,
      };
    } catch (error: any) {
      throw new Error(`inPAY checkStatus error: ${error.message}`);
    }
  }

  async refund(_input: RefundInput): Promise<RefundResult> {
    throw new Error('inPAY refund not supported');
  }

  async handleWebhook(payload: any, _signature?: string): Promise<WebhookResult> {
    return {
      paymentId: payload.order_id,
      status: payload.status === 'success' ? 'completed' : 'failed',
      amount: parseFloat(payload.amount),
      rawData: payload,
    };
  }

  verifyWebhookSignature(_payload: any, _signature: string): boolean {
    return true;
  }

  private mapStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
    if (status === 'success') return 'completed';
    if (status === 'failed') return 'failed';
    if (status === 'cancelled') return 'cancelled';
    return 'pending';
  }
}
