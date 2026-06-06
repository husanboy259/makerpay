import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export const PLAN_PRICES: Record<string, number> = {
  basic:      8000,
  standard:   25000,
  business:   65000,
  enterprise: 999000,
};

@Entity('subscription_orders')
export class SubscriptionOrder {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'merchant_id' }) merchantId: string;
  @Column({ name: 'user_id' }) userId: string;
  @Column() plan: string;
  @Column({ type: 'int' }) amount: number;
  @Column({ default: 'pending' }) status: string; // pending | paid | expired | cancelled
  @Column({ name: 'payer_name', nullable: true }) payerName: string;
  @Column({ name: 'payer_phone', nullable: true }) payerPhone: string;
  @Column({ name: 'admin_confirmed_by', nullable: true }) adminConfirmedBy: string;
  @Column({ name: 'admin_note', nullable: true }) adminNote: string;
  @Column({ name: 'provider_payment_id', nullable: true }) providerPaymentId: string;
  @Column({ name: 'payment_provider', nullable: true }) paymentProvider: string;
  @Column({ name: 'payment_url', nullable: true }) paymentUrl: string;
  @Column({ name: 'paid_at', nullable: true }) paidAt: Date;
  @Column({ name: 'expires_at', nullable: true }) expiresAt: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
