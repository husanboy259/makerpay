import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum ProviderName {
  TSPAY = 'tspay',
  PAYNEST = 'paynest',
  TULOVPAY = 'tulovpay',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'merchant_provider_id', nullable: true })
  merchantProviderId: string;

  @Column({ name: 'api_key_id', nullable: true })
  apiKeyId: string;

  // Provider info
  @Column({ name: 'provider_name', nullable: true })
  providerName: string;

  @Column({ name: 'provider_payment_id', nullable: true })
  providerPaymentId: string;

  // Order info
  @Column({ name: 'external_order_id', nullable: true })
  externalOrderId: string;

  @Column({ name: 'idempotency_key', nullable: true, unique: true })
  idempotencyKey: string;

  // Amount
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ default: 'UZS' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  description: string;

  // URLs
  @Column({ name: 'payment_url', nullable: true })
  paymentUrl: string;

  @Column({ name: 'return_url', nullable: true })
  returnUrl: string;

  @Column({ name: 'callback_url', nullable: true })
  callbackUrl: string;

  // Customer info
  @Column({ name: 'customer_name', nullable: true })
  customerName: string;

  @Column({ name: 'customer_email', nullable: true })
  customerEmail: string;

  @Column({ name: 'customer_phone', nullable: true })
  customerPhone: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId: string;

  // Fees
  @Column({ name: 'platform_fee', type: 'decimal', precision: 15, scale: 2, default: 0 })
  platformFee: number;

  @Column({ name: 'provider_fee', type: 'decimal', precision: 15, scale: 2, default: 0 })
  providerFee: number;

  @Column({ name: 'net_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  netAmount: number;

  // Technical
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'provider_response', type: 'jsonb', nullable: true })
  providerResponse: Record<string, any>;

  // Error
  @Column({ name: 'error_code', nullable: true })
  errorCode: string;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  // Timestamps
  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ name: 'paid_at', nullable: true })
  paidAt: Date;

  @Column({ name: 'failed_at', nullable: true })
  failedAt: Date;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
