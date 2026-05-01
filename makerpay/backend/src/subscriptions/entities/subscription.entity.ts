import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export const PLAN_LIMITS: Record<string, { requestLimit: number; storeLimit: number; price: number }> = {
  start:      { requestLimit: 200,    storeLimit: 1,         price: 0 },
  trial:      { requestLimit: 15000,  storeLimit: 10,        price: 0 },
  basic:      { requestLimit: 1000,   storeLimit: 2,         price: 49000 },
  standard:   { requestLimit: 5000,   storeLimit: 5,         price: 149000 },
  business:   { requestLimit: 15000,  storeLimit: 15,        price: 399000 },
  enterprise: { requestLimit: 999999, storeLimit: 999999,    price: 999000 },
};

@Entity('merchant_subscriptions')
export class MerchantSubscription {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'merchant_id' }) merchantId: string;
  @Column({ default: 'start' }) plan: string;
  @Column({ default: 'active' }) status: string;
  @Column({ name: 'request_limit', default: 200 }) requestLimit: number;
  @Column({ name: 'store_limit', default: 1 }) storeLimit: number;
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 }) price: number;
  @Column({ default: 'UZS' }) currency: string;
  @Column({ name: 'starts_at', nullable: true }) startsAt: Date;
  @Column({ name: 'expires_at', nullable: true }) expiresAt: Date;
  @Column({ name: 'assigned_by', nullable: true }) assignedBy: string;
  @Column({ name: 'admin_note', nullable: true }) adminNote: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}

@Entity('trial_applications')
export class TrialApplication {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @Column({ name: 'merchant_id', nullable: true }) merchantId: string;
  @Column({ name: 'company_name' }) companyName: string;
  @Column() description: string;
  @Column({ name: 'mvp_url', nullable: true }) mvpUrl: string;
  @Column({ name: 'telegram_username', nullable: true }) telegramUsername: string;
  @Column() phone: string;
  @Column({ default: 'pending' }) status: string;
  @Column({ name: 'admin_note', nullable: true }) adminNote: string;
  @Column({ name: 'invitation_text', nullable: true }) invitationText: string;
  @Column({ name: 'reviewed_by', nullable: true }) reviewedBy: string;
  @Column({ name: 'reviewed_at', nullable: true }) reviewedAt: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
