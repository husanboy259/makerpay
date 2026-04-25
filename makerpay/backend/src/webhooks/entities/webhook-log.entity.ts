import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('webhook_logs')
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id', nullable: true })
  paymentId: string;

  @Column({ name: 'merchant_id', nullable: true })
  merchantId: string;

  @Column({ name: 'provider_name', nullable: true })
  providerName: string;

  @Column({ default: 'inbound' }) // inbound | outbound
  direction: string;

  @Column({ name: 'event_type' })
  eventType: string;

  // Inbound
  @Column({ name: 'raw_payload', type: 'jsonb' })
  rawPayload: Record<string, any>;

  @Column({ name: 'signature_valid', nullable: true })
  signatureValid: boolean;

  // Outbound
  @Column({ name: 'target_url', nullable: true })
  targetUrl: string;

  @Column({ name: 'forwarded_payload', type: 'jsonb', nullable: true })
  forwardedPayload: Record<string, any>;

  @Column({ name: 'response_status', nullable: true })
  responseStatus: number;

  @Column({ name: 'response_body', nullable: true, length: 2000 })
  responseBody: string;

  @Column({ name: 'response_time_ms', nullable: true })
  responseTimeMs: number;

  @Column({ default: 'pending' })
  status: string; // pending | delivered | failed | retrying

  @Column({ name: 'attempt_count', default: 0 })
  attemptCount: number;

  @Column({ name: 'max_attempts', default: 5 })
  maxAttempts: number;

  @Column({ name: 'next_retry_at', nullable: true })
  nextRetryAt: Date;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
