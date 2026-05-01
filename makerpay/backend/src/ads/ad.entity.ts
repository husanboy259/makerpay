import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AdPosition {
  HEADER       = 'header',
  SIDEBAR_LEFT = 'sidebar_left',
  SIDEBAR_RIGHT= 'sidebar_right',
  MIDDLE       = 'middle',
  FOOTER       = 'footer',
}

@Entity('ads')
export class Ad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @Column({ name: 'link_url', nullable: true })
  linkUrl: string;

  @Column({ type: 'enum', enum: AdPosition })
  position: AdPosition;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'start_date', nullable: true, type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'end_date', nullable: true, type: 'timestamptz' })
  endDate: Date;

  @Column({ name: 'click_count', default: 0 })
  clickCount: number;

  @Column({ name: 'impression_count', default: 0 })
  impressionCount: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
