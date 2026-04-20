import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import authConfig from '../../common/config/auth.config';
import { JwtPayload, AuthTokens } from '../../types';
import {
  InvalidRefreshTokenError,
  TokenLifecyclePolicy,
} from './domain';
import {
  ACCESS_TOKEN_BLACKLIST,
  AccessTokenBlacklistPort,
  REFRESH_TOKENS_REPOSITORY,
  RefreshTokensRepositoryPort,
} from './ports';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
    @Inject(REFRESH_TOKENS_REPOSITORY)
    private readonly refreshTokensRepo: RefreshTokensRepositoryPort,
    @Inject(ACCESS_TOKEN_BLACKLIST)
    private readonly accessTokenBlacklist: AccessTokenBlacklistPort,
    private readonly tokenPolicy: TokenLifecyclePolicy,
  ) {}

  async generateTokens(userId: string, email: string): Promise<AuthTokens & { refreshToken: string }> {
    const expiresInSec = this.tokenPolicy.getAccessTokenExpiresInSeconds();
    const payload: JwtPayload = this.tokenPolicy.createAccessTokenPayload(userId, email);

    const accessToken = this.jwt.sign(
      payload,
      {
        secret: this.config.jwt.accessSecret,
        expiresIn: expiresInSec,
      },
    );

    const refreshToken = this.tokenPolicy.issueRefreshToken();

    await this.refreshTokensRepo.create({
      tokenHash: refreshToken.tokenHash,
      userId,
      expiresAt: refreshToken.expiresAt,
    });

    const decoded = this.jwt.decode(accessToken) as { exp: number };
    const accessTokenExpiresAt = new Date(decoded.exp * 1000).toISOString();

    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken: refreshToken.plainToken,
    };
  }

  async refreshAccessToken(oldRefreshToken: string): Promise<AuthTokens & { refreshToken: string }> {
    const oldHash = this.tokenPolicy.hashRefreshToken(oldRefreshToken);
    const stored = await this.refreshTokensRepo.findByTokenHash(oldHash);

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    try {
      this.tokenPolicy.ensureRefreshTokenUsable(stored);
    } catch (error) {
      if (error instanceof InvalidRefreshTokenError) {
        throw new UnauthorizedException(error.message);
      }

      throw error;
    }

    // Rotate: revoke old, issue new
    await this.refreshTokensRepo.revoke(stored.id);
    return this.generateTokens(stored.userId, '');
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const hash = this.tokenPolicy.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokensRepo.findByTokenHash(hash);
    if (stored) {
      await this.refreshTokensRepo.revoke(stored.id);
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokensRepo.revokeAllForUser(userId);
  }

  async blacklistAccessToken(token: string): Promise<void> {
    const payload = this.verifyAccessToken(token);
    if (!payload.jti || !payload.exp) {
      throw new UnauthorizedException('Access token is missing revocation metadata');
    }

    await this.accessTokenBlacklist.blacklist(payload.jti, payload.exp);
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    return this.accessTokenBlacklist.isBlacklisted(jti);
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token, {
      secret: this.config.jwt.accessSecret,
    });
  }
}
