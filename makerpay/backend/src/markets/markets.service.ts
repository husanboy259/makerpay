import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Market } from './market.entity';

@Injectable()
export class MarketsService {
  constructor(
    @InjectRepository(Market)
    private repo: Repository<Market>,
  ) {}

  findAll(merchantId: string) {
    return this.repo.find({ where: { merchantId }, order: { createdAt: 'DESC' } });
  }

  create(merchantId: string, data: { name: string; url: string; webhookUrl: string; description?: string }) {
    const market = this.repo.create({ merchantId, ...data });
    return this.repo.save(market);
  }

  async update(merchantId: string, id: string, data: Partial<Market>) {
    const market = await this.repo.findOne({ where: { id, merchantId } });
    if (!market) throw new NotFoundException('Market not found');
    Object.assign(market, data);
    return this.repo.save(market);
  }

  async remove(merchantId: string, id: string) {
    const market = await this.repo.findOne({ where: { id, merchantId } });
    if (!market) throw new NotFoundException('Market not found');
    await this.repo.remove(market);
    return { message: 'Deleted' };
  }
}
