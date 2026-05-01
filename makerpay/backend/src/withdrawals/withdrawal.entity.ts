import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export const MIN_WITHDRAWAL = 15000;

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'merchant_id' }) merchantId: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) amount: number;
  @Column({ default: 'UZS' }) currency: string;
  @Column({ default: 'pending' }) status: string;
  @Column({ name: 'bank_name', nullable: true }) bankName: string;
  @Column({ name: 'bank_account', nullable: true }) bankAccount: string;
  @Column({ name: 'card_number', nullable: true }) cardNumber: string;
  @Column({ name: 'card_holder', nullable: true }) cardHolder: string;
  @Column({ name: 'merchant_note', nullable: true }) merchantNote: string;
  @Column({ name: 'admin_note', nullable: true }) adminNote: string;
  @Column({ name: 'processed_by', nullable: true }) processedBy: string;
  @Column({ name: 'processed_at', nullable: true }) processedAt: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
