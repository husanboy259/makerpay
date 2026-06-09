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
      ? 'https://test.tspay.uz/api'
      : 'https://api.tspay.uz/api';

    this.http = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${credentials.apiKey}`,
      },
    });
  }

  // TSPay requires integer order_id; convert UUID by taking first 8 hex chars
  static uuidToOrderId(uuid: string): number {
    return parseInt(uuid.replace(/-/g, '').slice(0, 8), 16);
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const tsPayOrderId = TsPayAdapter.uuidToOrderId(input.orderId);
      const { data } = await this.http.post('/transactions/', {
        merchant_id: this.credentials.merchantId,
        amount: input.amount,
        order_id: tsPayOrderId,
        redirect_url: input.returnUrl,
      });

      return {
        providerPaymentId: data.cheque_id,
        paymentUrl: data.payment_url,
        status: 'pending',
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`TSPay createPayment error: ${JSON.stringify(error.response?.data)} status=${error.response?.status}`);
      throw new Error(`TSPay error: ${JSON.stringify(error.response?.data) || error.message}`);
    }
  }

  async checkStatus(providerPaymentId: string): Promise<CheckStatusResult> {
    try {
      const { data } = await this.http.get(`/transactions/cheque/${providerPaymentId}`);
      return {
        providerPaymentId,
        status: this.mapStatus(data.status),
        amount: data.amount,
        paidAt: data.paid_at ? new Date(data.paid_at * 1000) : undefined,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`TSPay checkStatus error: ${error.message}`);
      throw new Error(`TSPay error: ${error.response?.data?.detail || error.message}`);
    }
  }

  async refund(_input: RefundInput): Promise<RefundResult> {
    throw new Error('TSPay refund not supported');
  }

  // Webhook 3-method protocol handled directly in SubscriptionsService
  async handleWebhook(payload: any, _signature?: string): Promise<WebhookResult> {
    const params = payload?.params || {};
    return {
      paymentId: params.cheque_id || params.order_id?.toString(),
      status: payload?.method === 'performTransaction' ? 'completed' : 'pending',
      amount: params.amount,
      rawData: payload,
    };
  }

  verifyWebhookSignature(payload: any, signature: string, timestamp?: string): boolean {
    if (!timestamp) return false;
    const params = payload?.params || {};
    const orderId = params.order_id ?? '';
    let amountStr = String(params.amount ?? '');
    if (!amountStr.includes('.')) amountStr += '.0';

    const expected = 'sha256=' + crypto
      .createHmac('sha256', this.credentials.secretKey)
      .update(`${orderId}:${amountStr}:${timestamp}`)
      .digest('hex');

    try {
      return signature.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  private mapStatus(status: string | number): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
    if (status === 1 || status === 'success') return 'completed';
    if (status === -1 || status === 'canceled') return 'cancelled';
    if (status === -9 || status === 'failed') return 'failed';
    return 'pending';
  }
}
