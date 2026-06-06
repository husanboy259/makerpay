import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { MerchantProvider, ProviderStatus, ConnectionType } from './entities/merchant-provider.entity';
import { ApiKey } from './entities/api-key.entity';
import { BasePaymentAdapter } from './base.adapter';
import { TsPayAdapter } from './adapters/tspay.adapter';
import { PaynestAdapter } from './adapters/paynest.adapter';
import { TulovpayAdapter } from './adapters/tulovpay.adapter';
import { MirPayAdapter } from './adapters/mirpay.adapter';
import { QulayPayAdapter } from './adapters/qulaypay.adapter';
import { ConnectProviderDto } from './dto/connect-provider.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(MerchantProvider)
    private readonly mpRepo: Repository<MerchantProvider>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {}

  // ─── Provider Connections ─────────────────────────────────────────────

  async connectProvider(merchantId: string, dto: ConnectProviderDto) {
    const existing = await this.mpRepo.findOne({
      where: { merchantId, providerName: dto.providerName },
    });
    if (existing) {
      throw new ConflictException(`Provider ${dto.providerName} already connected`);
    }

    const encKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32c';
    const encryptedApiKey = this.encrypt(dto.apiKey, encKey);
    const encryptedSecretKey = this.encrypt(dto.secretKey || '', encKey);

    const mp = this.mpRepo.create({
      merchantId,
      providerName: dto.providerName,
      apiKey: encryptedApiKey,
      secretKey: encryptedSecretKey,
      providerMerchantId: dto.providerMerchantId,
      webhookUrl: dto.webhookUrl,
      isDefault: dto.isDefault ?? false,
      testMode: dto.testMode ?? false,
      extraConfig: dto.extraConfig || {},
    });

    if (dto.isDefault) {
      await this.mpRepo.update({ merchantId }, { isDefault: false });
    }

    return this.mpRepo.save(mp);
  }

  async getMerchantProviders(merchantId: string) {
    return this.mpRepo.find({
      where: { merchantId },
      select: {
        id: true,
        merchantId: true,
        providerName: true,
        providerMerchantId: true,
        webhookUrl: true,
        status: true,
        isDefault: true,
        testMode: true,
        lastUsedAt: true,
        totalTransactions: true,
        totalVolume: true,
        lastError: true,
        lastErrorAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProvider(merchantId: string, id: string, dto: Partial<ConnectProviderDto>) {
    const mp = await this.mpRepo.findOne({ where: { id, merchantId } });
    if (!mp) throw new NotFoundException('Provider connection not found');

    const encKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32c';

    if (dto.apiKey) mp.apiKey = this.encrypt(dto.apiKey, encKey);
    if (dto.secretKey) mp.secretKey = this.encrypt(dto.secretKey, encKey);
    if (dto.webhookUrl !== undefined) mp.webhookUrl = dto.webhookUrl;
    if (dto.testMode !== undefined) mp.testMode = dto.testMode;
    if (dto.isDefault !== undefined) {
      if (dto.isDefault) await this.mpRepo.update({ merchantId }, { isDefault: false });
      mp.isDefault = dto.isDefault;
    }

    return this.mpRepo.save(mp);
  }

  async adminPauseEcosystem(providerName: string) {
    await this.mpRepo.update({ providerName }, { status: ProviderStatus.INACTIVE });
    return { message: `${providerName} paused for all merchants` };
  }

  async adminResumeEcosystem(providerName: string) {
    await this.mpRepo.update({ providerName }, { status: ProviderStatus.ACTIVE });
    return { message: `${providerName} resumed for all merchants` };
  }

  async adminGetEcosystemStats() {
    const providers = ['tspay', 'paynest', 'tulovpay', 'mirpay', 'qulaypay'];
    return Promise.all(
      providers.map(async (p) => ({
        providerName: p,
        total:  await this.mpRepo.count({ where: { providerName: p } }),
        active: await this.mpRepo.count({ where: { providerName: p, status: ProviderStatus.ACTIVE } }),
        paused: await this.mpRepo.count({ where: { providerName: p, status: ProviderStatus.INACTIVE } }),
      })),
    );
  }

  async activateMakerpayProvider(merchantId: string, providerName: string) {
    const MAKERPAY_PROVIDERS = ['mirpay', 'paynest', 'tspay', 'qulaypay'];
    if (!MAKERPAY_PROVIDERS.includes(providerName)) {
      throw new BadRequestException(`${providerName} is not a Makerpay partnership provider`);
    }

    const existing = await this.mpRepo.findOne({ where: { merchantId, providerName } });
    if (existing) throw new ConflictException(`Provider ${providerName} already activated`);

    const mp = this.mpRepo.create({
      merchantId,
      providerName,
      connectionType: ConnectionType.MAKERPAY,
      // placeholder values — real keys come from env at runtime
      apiKey: 'makerpay_managed',
      secretKey: 'makerpay_managed',
      isDefault: false,
      testMode: false,
      extraConfig: {},
    });

    return this.mpRepo.save(mp);
  }

  async disconnectProvider(merchantId: string, id: string) {
    const mp = await this.mpRepo.findOne({ where: { id, merchantId } });
    if (!mp) throw new NotFoundException('Provider connection not found');
    await this.mpRepo.remove(mp);
    return { message: 'Provider disconnected' };
  }

  async testConnection(merchantId: string, providerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const adapter = await this.getAdapter(merchantId, providerId);
      await adapter.checkStatus('test_connection_check');
      return { success: true, message: 'Ulanish muvaffaqiyatli' };
    } catch (error: any) {
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        return { success: true, message: 'Provayder mavjud (ulanish ishlaydi)' };
      }
      return { success: false, message: error.message || 'Ulanish xatoligi' };
    }
  }

  // ─── Adapter Factory ──────────────────────────────────────────────────

  async getAdapter(merchantId: string, providerId: string): Promise<BasePaymentAdapter> {
    const mp = await this.mpRepo.findOne({
      where: { id: providerId, merchantId },
      select: ['id', 'providerName', 'apiKey', 'secretKey', 'providerMerchantId', 'testMode', 'extraConfig'],
    });
    if (!mp) throw new NotFoundException('Provider connection not found');

    return this.buildAdapter(mp);
  }

  async getDefaultAdapter(merchantId: string): Promise<{ adapter: BasePaymentAdapter; mp: MerchantProvider }> {
    const mp = await this.mpRepo.findOne({
      where: { merchantId, isDefault: true, status: ProviderStatus.ACTIVE },
      select: ['id', 'providerName', 'apiKey', 'secretKey', 'providerMerchantId', 'testMode', 'extraConfig'],
    });
    if (!mp) throw new BadRequestException('No default payment provider configured');

    return { adapter: this.buildAdapter(mp), mp };
  }

  async getAdapterByProviderName(merchantId: string, providerName: string): Promise<{ adapter: BasePaymentAdapter; mp: MerchantProvider }> {
    const mp = await this.mpRepo.findOne({
      where: { merchantId, providerName, status: ProviderStatus.ACTIVE },
      select: ['id', 'providerName', 'apiKey', 'secretKey', 'providerMerchantId', 'testMode', 'extraConfig'],
    });
    if (!mp) throw new NotFoundException(`Provider ${providerName} not connected`);

    return { adapter: this.buildAdapter(mp), mp };
  }

  private buildAdapter(mp: MerchantProvider): BasePaymentAdapter {
    let apiKey: string;
    let secretKey: string;

    if (mp.connectionType === ConnectionType.MAKERPAY) {
      const envPrefix = mp.providerName.toUpperCase();
      apiKey = process.env[`${envPrefix}_API_KEY`] || '';
      secretKey = process.env[`${envPrefix}_SECRET_KEY`] || '';
    } else {
      const encKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32c';
      apiKey = this.decrypt(mp.apiKey, encKey);
      secretKey = this.decrypt(mp.secretKey, encKey);
    }

    const credentials = {
      apiKey,
      secretKey,
      merchantId: mp.providerMerchantId,
      testMode: mp.testMode,
      extraConfig: mp.extraConfig,
    };

    switch (mp.providerName) {
      case 'tspay':    return new TsPayAdapter(credentials);
      case 'paynest':  return new PaynestAdapter(credentials);
      case 'tulovpay': return new TulovpayAdapter(credentials);
      case 'mirpay':   return new MirPayAdapter(credentials);
      case 'qulaypay': return new QulayPayAdapter(credentials);
      default:         throw new BadRequestException(`Unsupported provider: ${mp.providerName}`);
    }
  }

  // ─── API Keys ─────────────────────────────────────────────────────────

  async createApiKey(merchantId: string, dto: CreateApiKeyDto, createdBy: string) {
    if (!merchantId) {
      throw new BadRequestException('Merchant profili topilmadi. Avval profil yarating: /dashboard/merchant/profile');
    }
    const env     = dto.environment === 'sandbox' ? 'test' : 'live';
    const keyType = dto.keyType || 'secret';
    const prefix  = keyType === 'publishable' ? `mpk_pub_${env}` : `mpk_${env}`;
    const rawKey  = `${prefix}_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash   = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 16);

    const apiKey = this.apiKeyRepo.create({
      merchantId,
      name: dto.name,
      keyHash,
      keyPrefix,
      environment: dto.environment || 'production',
      keyType,
      permissions:     dto.permissions     || ['payments:create', 'payments:read', 'refunds:create'],
      allowedDomains:  dto.allowedDomains  || [],
      allowedIps:      dto.allowedIps      || [],
      rateLimitPerMin: dto.rateLimitPerMin || 60,
      createdBy,
    });

    await this.apiKeyRepo.save(apiKey);
    return { ...apiKey, key: rawKey }; // Show full key once only
  }

  async getMerchantApiKeys(merchantId: string) {
    return this.apiKeyRepo.find({
      where: { merchantId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeApiKey(merchantId: string, id: string, revokedBy: string) {
    const key = await this.apiKeyRepo.findOne({ where: { id, merchantId } });
    if (!key) throw new NotFoundException('API key not found');

    await this.apiKeyRepo.remove(key);
    return { message: 'API key deleted' };
  }

  async validateApiKey(rawKey: string): Promise<ApiKey | null> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.apiKeyRepo.findOne({
      where: { keyHash, isActive: true },
      relations: ['merchant'],
    });

    if (!apiKey) return null;
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) return null;

    await this.apiKeyRepo.update(apiKey.id, { lastUsedAt: new Date() });
    return apiKey;
  }

  // ─── Encryption helpers ───────────────────────────────────────────────

  private encrypt(text: string, key: string): string {
    const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, keyBuffer, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(encrypted: string, key: string): string {
    const keyBuffer = Buffer.from(key.padEnd(32, '0').slice(0, 32));
    const [ivHex, tagHex, dataHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(tag);
    return decipher.update(data) + decipher.final('utf8');
  }
}
