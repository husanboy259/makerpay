import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant, MerchantStatus } from './entities/merchant.entity';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
  ) {}

  async create(userId: string, dto: CreateMerchantDto): Promise<Merchant> {
    const exists = await this.merchantRepo.findOne({ where: { userId } });
    if (exists) throw new ConflictException('User already has a merchant account');

    const merchant = this.merchantRepo.create({ ...dto, userId });
    return this.merchantRepo.save(merchant);
  }

  async getMyMerchant(userId: string): Promise<Merchant> {
    const m = await this.merchantRepo.findOne({ where: { userId } });
    if (!m) throw new NotFoundException('Merchant profile not found');
    return m;
  }

  async update(userId: string, dto: UpdateMerchantDto): Promise<Merchant> {
    const m = await this.merchantRepo.findOne({ where: { userId } });
    if (!m) throw new NotFoundException('Merchant not found');
    Object.assign(m, dto);
    return this.merchantRepo.save(m);
  }

  async getAll(page = 1, limit = 20, search?: string, status?: string) {
    const qb = this.merchantRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.user', 'u')
      .select([
        'm.id', 'm.businessName', 'm.status', 'm.totalVolume',
        'm.totalTransactions', 'm.currency', 'm.feePercentage',
        'm.contactEmail', 'm.contactPhone', 'm.createdAt',
        'u.email', 'u.fullName',
      ]);

    if (status) qb.andWhere('m.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(m.businessName ILIKE :s OR u.email ILIKE :s OR m.inn ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string): Promise<Merchant> {
    const m = await this.merchantRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!m) throw new NotFoundException('Merchant not found');
    return m;
  }

  async approve(id: string, adminId: string): Promise<Merchant> {
    const m = await this.merchantRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Merchant not found');
    m.status = MerchantStatus.ACTIVE;
    m.verifiedAt = new Date();
    m.verifiedBy = adminId;
    return this.merchantRepo.save(m);
  }

  async suspend(id: string, adminId: string, reason: string): Promise<Merchant> {
    const m = await this.merchantRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Merchant not found');
    m.status = MerchantStatus.SUSPENDED;
    m.suspendedAt = new Date();
    m.suspendedBy = adminId;
    m.suspensionReason = reason;
    return this.merchantRepo.save(m);
  }

  async updateInternalNotes(id: string, notes: string): Promise<void> {
    await this.merchantRepo.update(id, { internalNotes: notes });
  }

  async getStats() {
    const result = await this.merchantRepo
      .createQueryBuilder('m')
      .select([
        'COUNT(*) as total',
        'COUNT(*) FILTER (WHERE m.status = \'active\') as active',
        'COUNT(*) FILTER (WHERE m.status = \'pending_verification\') as pending',
        'COUNT(*) FILTER (WHERE m.status = \'suspended\') as suspended',
        'COALESCE(SUM(m.totalVolume), 0) as total_volume',
      ])
      .getRawOne();
    return result;
  }
}
