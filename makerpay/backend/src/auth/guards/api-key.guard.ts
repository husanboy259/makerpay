import {
  Injectable, CanActivate, ExecutionContext,
  UnauthorizedException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKey } from '../../providers/entities/api-key.entity';

function ipInCidr(ip: string, cidr: string): boolean {
  try {
    if (!cidr.includes('/')) return ip === cidr;
    const [range, bits] = cidr.split('/');
    const mask = ~((1 << (32 - +bits)) - 1);
    const ipInt   = ip.split('.').reduce((acc, o) => (acc << 8) | +o, 0);
    const rangeInt = range.split('.').reduce((acc, o) => (acc << 8) | +o, 0);
    return (ipInt & mask) === (rangeInt & mask);
  } catch { return false; }
}

function extractIp(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.ip ||
    ''
  ).replace('::ffff:', '');
}

function extractDomain(req: any): string {
  const origin = req.headers['origin'] || req.headers['referer'] || '';
  try { return new URL(origin).hostname; } catch { return ''; }
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const raw =
      req.headers['x-api-key'] ||
      req.headers['authorization']?.replace(/^Bearer\s+/i, '');

    if (!raw) throw new UnauthorizedException('API kalit topilmadi');

    const keyHash = crypto.createHash('sha256').update(raw).digest('hex');
    const apiKey  = await this.apiKeyRepo.findOne({
      where: { keyHash, isActive: true },
    });

    if (!apiKey) throw new UnauthorizedException('API kalit noto\'g\'ri yoki nofaol');
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      throw new UnauthorizedException('API kalit muddati tugagan');
    }

    const clientIp     = extractIp(req);
    const clientDomain = extractDomain(req);

    // ── Frontend (publishable) key — domain + IP tekshirish ───────────
    if (apiKey.keyType === 'publishable') {
      // Domain tekshirish
      if (apiKey.allowedDomains.length > 0) {
        const domainOk = apiKey.allowedDomains.some(d =>
          clientDomain === d || clientDomain.endsWith(`.${d}`)
        );
        if (!domainOk) {
          throw new ForbiddenException(
            `Domain ruxsat berilmagan: ${clientDomain}. Ruxsat berilganlar: ${apiKey.allowedDomains.join(', ')}`
          );
        }
      }

      // IP tekshirish
      if (apiKey.allowedIps.length > 0) {
        const ipOk = apiKey.allowedIps.some(cidr => ipInCidr(clientIp, cidr));
        if (!ipOk) {
          throw new ForbiddenException(
            `IP manzil ruxsat berilmagan: ${clientIp}`
          );
        }
      }
    }

    // Update last used
    await this.apiKeyRepo.update(apiKey.id, {
      lastUsedAt: new Date(),
      lastUsedIp: clientIp,
    });

    // Attach to request
    req.apiKey    = apiKey;
    req.merchant  = { id: apiKey.merchantId };

    return true;
  }
}
