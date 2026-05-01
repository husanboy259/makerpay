import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id', nullable: true }) userId: string;
  @Column({ name: 'merchant_id', nullable: true }) merchantId: string;
  @Column() title: string;
  @Column() message: string;
  @Column({ nullable: true }) type: string;
  @Column({ nullable: true }) icon: string;
  @Column({ name: 'action_url', nullable: true }) actionUrl: string;
  @Column({ name: 'is_read', default: false }) isRead: boolean;
  @Column({ name: 'read_at', nullable: true }) readAt: Date;
  @Column({ type: 'jsonb', nullable: true }) metadata: any;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
