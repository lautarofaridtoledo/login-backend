import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import authConfig from '../../common/config/auth.config';
import { PasswordResetTokensRepository } from './repositories/password-reset-tokens.repository';
import { UsersService } from '../users';
import { EmailService } from '../email'

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
    private readonly resetTokensRepo: PasswordResetTokensRepository,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Initiates password reset. Always returns success to prevent email enumeration.
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Don't reveal whether the email exists

    // Invalidate previous tokens
    await this.resetTokensRepo.invalidateAllForUser(user.id);

    const plainToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(plainToken);
    const expiresAt = this.computeExpiry(this.config.passwordReset.expiresIn);

    await this.resetTokensRepo.create({ tokenHash, userId: user.id, expiresAt });
    await this.emailService.sendPasswordReset(user.email, plainToken);
  }

  async resetPassword(plainToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(plainToken);
    const stored = await this.resetTokensRepo.findByTokenHash(tokenHash);

    if (!stored || stored.used || stored.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.resetTokensRepo.markUsed(stored.id);
    await this.usersService.updatePassword(stored.userId, newPassword);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private computeExpiry(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 60 * 60 * 1000);
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
