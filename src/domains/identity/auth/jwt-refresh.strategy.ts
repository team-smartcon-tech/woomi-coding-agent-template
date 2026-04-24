import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

type JwtRefreshPayload = {
  sub: number;
};

function readRefreshCookie(req?: Request): string | null {
  if (!req) {
    return null;
  }

  const fromCookieParser = req.cookies?.refresh_token;
  if (typeof fromCookieParser === 'string' && fromCookieParser) {
    return fromCookieParser;
  }

  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === 'refresh_token') {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => readRefreshCookie(req)]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev-jwt-refresh-secret',
    });
  }

  async validate(payload: JwtRefreshPayload) {
    return {
      userId: payload.sub,
    };
  }
}
