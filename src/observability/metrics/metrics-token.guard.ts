import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) {
    return false;
  }

  return timingSafeEqual(aa, bb);
}

@Injectable()
export class MetricsTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    const token = String(req.headers['x-metrics-token'] ?? '')
      .replace(/^Bearer\s+/i, '')
      .trim();
    const expected = this.configService.get<string>('METRICS_TOKEN');

    if (!expected) {
      throw new UnauthorizedException('METRICS_TOKEN not set');
    }

    if (!token || !safeEqual(token, expected)) {
      throw new UnauthorizedException('Invalid metrics token');
    }

    return true;
  }
}
