import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_number' })
  ticketNumber: string;

  @Column({ name: 'merchant_id', nullable: true })
  merchantId: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'assigned_to', nullable: true })
  assignedTo: string;

  @Column()
  subject: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text', default: 'open' })
  status: string;

  @Column({ type: 'text', default: 'medium' })
  priority: string;

  @Column({ nullable: true })
  category: string;

  @Column({ name: 'payment_id', nullable: true })
  paymentId: string;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'closed_at', nullable: true })
  closedAt: Date;

  @Column({ name: 'first_response_at', nullable: true })
  firstResponseAt: Date;

  @Column({ name: 'satisfaction_rating', nullable: true })
  satisfactionRating: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TicketMessage, (m) => m.ticket, { eager: true })
  messages: TicketMessage[];
}

@Entity('ticket_messages')
export class TicketMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id' })
  ticketId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column()
  message: string;

  @Column({ type: 'text', array: true, default: [] })
  attachments: string[];

  @Column({ name: 'is_internal', default: false })
  isInternal: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  ticket: SupportTicket;
}
