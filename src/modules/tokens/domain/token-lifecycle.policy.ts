import { createHash, randomBytes, randomUUID } from 'crypto';
import ms = require('ms');
import { JwtPayload } from '../../../types';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  expiresAt: Date;
  revoked: boolean;
}

export interface IssuedRefreshToken {
  plainToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid or expired refresh token');
  }
}

export class TokenLifecyclePolicy {
  constructor(
    private readonly accessExpiresIn: string,
    private readonly refreshExpiresIn: string,
  ) {}

  createAccessTokenPayload(userId: string, email: string): JwtPayload {
    return {
      sub: userId,
      email,
      jti: randomUUID(),
    };
  }

  getAccessTokenExpiresInSeconds(): number {
    const expiresInMs = ms(this.accessExpiresIn as ms.StringValue);
    return Math.floor(expiresInMs / 1000);
  }

  issueRefreshToken(now: Date = new Date()): IssuedRefreshToken {
    const plainToken = randomBytes(48).toString('hex');

    return {
      plainToken,
      tokenHash: this.hashRefreshToken(plainToken),
      expiresAt: this.computeRefreshExpiry(now),
    };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  ensureRefreshTokenUsable(record: RefreshTokenRecord, now: Date = new Date()): void {
    if (record.revoked || record.expiresAt < now) {
      throw new InvalidRefreshTokenError();
    }
  }

  private computeRefreshExpiry(now: Date): Date {
    const match = this.refreshExpiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const unitMs: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(now.getTime() + value * (unitMs[unit] ?? 1000));
  }
}