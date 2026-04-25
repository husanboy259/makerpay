import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column()
  name: string;

  @Column({ name: 'key_hash', unique: true })
  keyHash: string;

  @Column({ name: 'key_prefix' })
  keyPrefix: string; // First 12 chars displayed to user

  @Column({ default: 'production' })
  environment: string; // production | sandbox

  @Column({ type: 'jsonb', default: ['payments:create', 'payments:read', 'refunds:create'] })
  permissions: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_used_at', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'last_used_ip', nullable: true })
  lastUsedIp: string;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'revoked_at', nullable: true })
  revokedAt: Date;

  @Column({ name: 'revoked_by', nullable: true })
  revokedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
