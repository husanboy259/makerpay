import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MerchantStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'business_name' })
  businessName: string;

  @Column({ name: 'business_type', nullable: true })
  businessType: string; // LLC, JSC, IP

  @Column({ nullable: true, unique: true })
  inn: string; // Tax ID

  @Column({ name: 'legal_address', nullable: true })
  legalAddress: string;

  @Column({ name: 'actual_address', nullable: true })
  actualAddress: string;

  @Column({ name: 'website_url', nullable: true })
  websiteUrl: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({
    type: 'enum',
    enum: MerchantStatus,
    default: MerchantStatus.PENDING_VERIFICATION,
  })
  status: MerchantStatus;

  // Financial
  @Column({ name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ name: 'bank_account', nullable: true })
  bankAccount: string;

  @Column({ nullable: true })
  mfo: string; // Bank MFO code

  @Column({ default: 'UZS' })
  currency: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'monthly_volume', type: 'decimal', precision: 15, scale: 2, default: 0 })
  monthlyVolume: number;

  @Column({ name: 'total_volume', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalVolume: number;

  @Column({ name: 'total_transactions', default: 0 })
  totalTransactions: number;

  @Column({ name: 'fee_percentage', type: 'decimal', precision: 5, scale: 2, default: 1.5 })
  feePercentage: number;

  // Contact
  @Column({ name: 'contact_name', nullable: true })
  contactName: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string;

  @Column({ name: 'telegram_username', nullable: true })
  telegramUsername: string;

  // Startup / Company info
  @Column({ nullable: true })
  description: string;

  @Column({ name: 'founded_at', type: 'date', nullable: true })
  foundedAt: Date;

  @Column({ name: 'employee_count', nullable: true })
  employeeCount: number;

  @Column({ name: 'instagram_url', nullable: true })
  instagramUrl: string;

  @Column({ name: 'linkedin_url', nullable: true })
  linkedinUrl: string;

  @Column({ name: 'twitter_url', nullable: true })
  twitterUrl: string;

  // Documents
  @Column({ type: 'jsonb', default: [] })
  documents: any[];

  @Column({ name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  // Admin fields
  @Column({ name: 'verified_at', nullable: true })
  verifiedAt: Date;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy: string;

  @Column({ name: 'suspended_at', nullable: true })
  suspendedAt: Date;

  @Column({ name: 'suspended_by', nullable: true })
  suspendedBy: string;

  @Column({ name: 'suspension_reason', nullable: true })
  suspensionReason: string;

  @Column({ name: 'internal_notes', nullable: true })
  internalNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
