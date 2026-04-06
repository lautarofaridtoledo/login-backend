import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Response, Request } from 'express';
import authConfig from '../config/auth.config';

@Injectable()
export class CookieHelper {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  setRefreshToken(res: Response, token: string): void {
    const maxAge = this.parseExpiresIn(this.config.jwt.refreshExpiresIn);
    res.cookie(this.config.cookie.name, token, {
      httpOnly: true,
      secure: this.config.cookie.secure,
      sameSite: this.config.cookie.sameSite,
      domain: this.config.cookie.domain,
      path: this.config.cookie.path,
      maxAge,
    });
  }

  clearRefreshToken(res: Response): void {
    res.clearCookie(this.config.cookie.name, {
      httpOnly: true,
      secure: this.config.cookie.secure,
      sameSite: this.config.cookie.sameSite,
      domain: this.config.cookie.domain,
      path: this.config.cookie.path,
    });
  }

  extractRefreshToken(req: Request): string | undefined {
    return req.cookies?.[this.config.cookie.name];
  }

  private parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return num * (multipliers[unit] ?? 1000);
  }
}
