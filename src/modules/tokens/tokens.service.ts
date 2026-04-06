import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import ms = require('ms');
import authConfig from '../../common/config/auth.config';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { JwtPayload, AuthTokens } from '../../types';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
    private readonly refreshTokensRepo: RefreshTokensRepository,
  ) {}

  async generateTokens(userId: string, email: string): Promise<AuthTokens & { refreshToken: string }> {
    const expiresInMs = ms(this.config.jwt.accessExpiresIn as ms.StringValue);
    const expiresInSec = Math.floor(expiresInMs / 1000);

    const accessToken = this.jwt.sign(
      { sub: userId, email } as Record<string, unknown>,
      {
        secret: this.config.jwt.accessSecret,
        expiresIn: expiresInSec,
      },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = this.computeExpiry(this.config.jwt.refreshExpiresIn);

    await this.refreshTokensRepo.create({ tokenHash, userId, expiresAt });

    const decoded = this.jwt.decode(accessToken) as { exp: number };
    const accessTokenExpiresAt = new Date(decoded.exp * 1000).toISOString();

    return { accessToken, accessTokenExpiresAt, refreshToken };
  }

  async refreshAccessToken(oldRefreshToken: string): Promise<AuthTokens & { refreshToken: string }> {
    const oldHash = this.hashToken(oldRefreshToken);
    const stored = await this.refreshTokensRepo.findByTokenHash(oldHash);

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new
    await this.refreshTokensRepo.revoke(stored.id);
    return this.generateTokens(stored.userId, '');
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const hash = this.hashToken(refreshToken);
    const stored = await this.refreshTokensRepo.findByTokenHash(hash);
    if (stored) {
      await this.refreshTokensRepo.revoke(stored.id);
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokensRepo.revokeAllForUser(userId);
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token, {
      secret: this.config.jwt.accessSecret,
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private computeExpiry(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const ms: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + num * (ms[unit] ?? 1000));
  }
}
