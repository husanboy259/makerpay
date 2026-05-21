import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class BrowserOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const origin  = req.headers['origin']  || '';
    const referer = req.headers['referer'] || '';
    const ua      = req.headers['user-agent'] || '';

    const allowed = (process.env.FRONTEND_URL || 'https://makerpay.uz').replace(/\/$/, '');
    const devAllowed = ['http://localhost:3000', 'http://localhost:3001'];

    const originOk =
      origin.startsWith(allowed) ||
      devAllowed.some(d => origin.startsWith(d)) ||
      referer.startsWith(allowed) ||
      devAllowed.some(d => referer.startsWith(d));

    // Block headless/curl requests with no browser User-Agent
    const hasBrowserUA = ua.includes('Mozilla') || ua.includes('Chrome') || ua.includes('Safari');

    if (!originOk && !hasBrowserUA) {
      throw new ForbiddenException('Bu so\'rov faqat brauzerdan amalga oshirilishi mumkin');
    }

    // Block requests from known bad origins
    const blocked = ['intelektai.uz', 'curl/', 'python-requests', 'Wget', 'scrapy'];
    if (blocked.some(b => ua.includes(b) || origin.includes(b) || referer.includes(b))) {
      throw new ForbiddenException('Ruxsat berilmagan manba');
    }

    return true;
  }
}
