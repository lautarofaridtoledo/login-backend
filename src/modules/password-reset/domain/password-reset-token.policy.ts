import { createHash, randomBytes } from 'crypto';

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
}

export interface IssuedPasswordResetToken {
  plainToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export class InvalidPasswordResetTokenError extends Error {
  constructor() {
    super('Invalid or expired reset token');
  }
}

export class PasswordResetTokenPolicy {
  constructor(private readonly expiresIn: string) {}

  issue(now: Date = new Date()): IssuedPasswordResetToken {
    const plainToken = randomBytes(48).toString('hex');

    return {
      plainToken,
      tokenHash: this.hash(plainToken),
      expiresAt: this.computeExpiry(now),
    };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  ensureUsable(record: PasswordResetTokenRecord, now: Date = new Date()): void {
    if (record.used || record.expiresAt < now) {
      throw new InvalidPasswordResetTokenError();
    }
  }

  private computeExpiry(now: Date): Date {
    const match = this.expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      return new Date(now.getTime() + 60 * 60 * 1000);
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