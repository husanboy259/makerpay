import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';

export enum ProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

@Entity('merchant_providers')
@Unique(['merchantId', 'providerName'])
export class MerchantProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'provider_name' })
  providerName: string; // tspay | paynest | tulovpay

  // Credentials (encrypted in service layer)
  @Column({ name: 'api_key', select: false })
  apiKey: string;

  @Column({ name: 'secret_key', select: false })
  secretKey: string;

  @Column({ name: 'provider_merchant_id', nullable: true })
  providerMerchantId: string;

  @Column({ name: 'extra_config', type: 'jsonb', default: {} })
  extraConfig: Record<string, any>;

  // Merchant webhook settings
  @Column({ name: 'webhook_url', nullable: true })
  webhookUrl: string;

  @Column({ name: 'webhook_secret', nullable: true, select: false })
  webhookSecret: string;

  @Column({ type: 'enum', enum: ProviderStatus, default: ProviderStatus.ACTIVE })
  status: ProviderStatus;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'test_mode', default: false })
  testMode: boolean;

  // Stats
  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'total_transactions', default: 0 })
  totalTransactions: number;

  @Column({ name: 'total_volume', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalVolume: number;

  @Column({ name: 'last_error', nullable: true })
  lastError: string;

  @Column({ name: 'last_error_at', nullable: true })
  lastErrorAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
