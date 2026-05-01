import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal, MIN_WITHDRAWAL } from './withdrawal.entity';
import { Merchant } from '../merchants/entities/merchant.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly repo: Repository<Withdrawal>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    private readonly mailService: MailService,
  ) {}

  async request(merchantId: string, dto: {
    amount: number; bankName?: string; bankAccount?: string;
    cardNumber?: string; cardHolder?: string; merchantNote?: string;
  }) {
    if (dto.amount < MIN_WITHDRAWAL) {
      throw new BadRequestException(`Minimal yechish miqdori: ${MIN_WITHDRAWAL.toLocaleString()} UZS`);
    }

    const merchant = await this.merchantRepo.findOne({ where: { id: merchantId } });
    if (!merchant) throw new NotFoundException('Merchant topilmadi');

    if (merchant.balance < dto.amount) {
      throw new BadRequestException(`Balans yetarli emas. Joriy balans: ${merchant.balance.toLocaleString()} UZS`);
    }

    await this.merchantRepo.update(merchantId, {
      balance: () => `balance - ${dto.amount}`,
    });

    const withdrawal = this.repo.create({ merchantId, ...dto, status: 'pending' });
    const saved = await this.repo.save(withdrawal);

    // Email notification
    if (merchant.contactEmail) {
      await this.mailService.sendWithdrawalRequested(merchant.contactEmail, dto.amount);
    }

    return saved;
  }

  async getMyWithdrawals(merchantId: string) {
    return this.repo.find({ where: { merchantId }, order: { createdAt: 'DESC' } });
  }

  async getAll(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [data, total] = await this.repo.findAndCount({
      where, order: { createdAt: 'DESC' },
      skip: (page - 1) * limit, take: limit,
    });
    return { data, meta: { total, page, limit } };
  }

  async approve(id: string, adminId: string, adminNote?: string) {
    const w = await this.repo.findOne({ where: { id } });
    if (!w) throw new NotFoundException('So\'rov topilmadi');
    if (w.status !== 'pending') throw new BadRequestException('So\'rov allaqachon ko\'rib chiqilgan');

    await this.repo.update(id, {
      status: 'completed', processedBy: adminId,
      processedAt: new Date(), adminNote,
    });

    const merchant = await this.merchantRepo.findOne({ where: { id: w.merchantId } });
    if (merchant?.contactEmail) {
      await this.mailService.sendWithdrawalApproved(merchant.contactEmail, w.amount);
    }

    return this.repo.findOne({ where: { id } });
  }

  async reject(id: string, adminId: string, adminNote: string) {
    const w = await this.repo.findOne({ where: { id } });
    if (!w) throw new NotFoundException('So\'rov topilmadi');
    if (w.status !== 'pending') throw new BadRequestException('So\'rov allaqachon ko\'rib chiqilgan');

    await this.merchantRepo.update(w.merchantId, {
      balance: () => `balance + ${w.amount}`,
    });

    await this.repo.update(id, {
      status: 'rejected', processedBy: adminId,
      processedAt: new Date(), adminNote,
    });

    return this.repo.findOne({ where: { id } });
  }

  async getStats() {
    const all = await this.repo.find();
    return {
      total:       all.length,
      pending:     all.filter(w => w.status === 'pending').length,
      completed:   all.filter(w => w.status === 'completed').length,
      rejected:    all.filter(w => w.status === 'rejected').length,
      totalAmount: all.filter(w => w.status === 'completed')
        .reduce((s, w) => s + +w.amount, 0),
    };
  }
}
