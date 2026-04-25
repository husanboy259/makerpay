export interface CreatePaymentInput {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  returnUrl?: string;
  callbackUrl?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  paymentUrl?: string;
  status: string;
  rawResponse: Record<string, any>;
}

export interface CheckStatusResult {
  providerPaymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount?: number;
  paidAt?: Date;
  rawResponse: Record<string, any>;
}

export interface RefundInput {
  providerPaymentId: string;
  amount: number;
  reason?: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: string;
  rawResponse: Record<string, any>;
}

export interface WebhookResult {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount?: number;
  rawData: Record<string, any>;
}

export interface AdapterCredentials {
  apiKey: string;
  secretKey: string;
  merchantId?: string;
  testMode?: boolean;
  extraConfig?: Record<string, any>;
}

export abstract class BasePaymentAdapter {
  protected credentials: AdapterCredentials;
  abstract readonly providerName: string;

  constructor(credentials: AdapterCredentials) {
    this.credentials = credentials;
  }

  abstract createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  abstract checkStatus(providerPaymentId: string): Promise<CheckStatusResult>;
  abstract refund(input: RefundInput): Promise<RefundResult>;
  abstract handleWebhook(payload: any, signature?: string): Promise<WebhookResult>;
  abstract verifyWebhookSignature(payload: any, signature: string): boolean;
}
