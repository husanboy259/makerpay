import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ad, AdPosition } from './ad.entity';

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(Ad)
    private readonly adRepo: Repository<Ad>,
  ) {}

  async create(data: Partial<Ad>) {
    const ad = this.adRepo.create(data);
    return this.adRepo.save(ad);
  }

  async findAll() {
    return this.adRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findActive() {
    const now = new Date();
    const ads = await this.adRepo.find({ where: { isActive: true } });
    return ads.filter(ad => {
      if (ad.startDate && now < ad.startDate) return false;
      if (ad.endDate   && now > ad.endDate)   return false;
      return true;
    });
  }

  async findByPosition(position: AdPosition) {
    const active = await this.findActive();
    return active.filter(a => a.position === position);
  }

  async findOne(id: string) {
    const ad = await this.adRepo.findOne({ where: { id } });
    if (!ad) throw new NotFoundException('Ad not found');
    return ad;
  }

  async update(id: string, data: Partial<Ad>) {
    await this.findOne(id);
    await this.adRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const ad = await this.findOne(id);
    await this.adRepo.remove(ad);
    return { message: 'Ad deleted' };
  }

  async trackClick(id: string) {
    await this.adRepo.increment({ id }, 'clickCount', 1);
  }

  async trackImpression(id: string) {
    await this.adRepo.increment({ id }, 'impressionCount', 1);
  }

  async getStats() {
    const all = await this.adRepo.find();
    return {
      total: all.length,
      active: all.filter(a => a.isActive).length,
      totalClicks: all.reduce((s, a) => s + a.clickCount, 0),
      totalImpressions: all.reduce((s, a) => s + a.impressionCount, 0),
      byPosition: Object.values(AdPosition).map(pos => ({
        position: pos,
        count: all.filter(a => a.position === pos).length,
        clicks: all.filter(a => a.position === pos).reduce((s, a) => s + a.clickCount, 0),
      })),
    };
  }
}
