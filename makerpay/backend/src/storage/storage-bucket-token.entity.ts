import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('storage_bucket_tokens')
export class StorageBucketToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bucket_id' })
  bucketId: string;

  @Column()
  name: string;

  @Column({ name: 'api_key_hash' })
  apiKeyHash: string;

  @Column({ name: 'api_key_prefix' })
  apiKeyPrefix: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
