import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('markets')
export class Market {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'url', type: 'varchar', length: 500 })
  url: string;

  @Column({ name: 'webhook_url', type: 'varchar', length: 500 })
  webhookUrl: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'webhook_status', type: 'varchar', length: 20, nullable: true })
  webhookStatus: string;

  @Column({ name: 'last_webhook_at', type: 'timestamptz', nullable: true })
  lastWebhookAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
