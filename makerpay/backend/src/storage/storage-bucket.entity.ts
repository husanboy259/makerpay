import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('storage_buckets')
export class StorageBucket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ name: 'api_key_hash' })
  apiKeyHash: string;

  @Column({ name: 'api_key_prefix' })
  apiKeyPrefix: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'file_count', default: 0 })
  fileCount: number;

  @Column({ name: 'total_size', default: 0, type: 'bigint' })
  totalSize: number;

  @Column({ name: 'custom_domain', nullable: true, default: null })
  customDomain: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
