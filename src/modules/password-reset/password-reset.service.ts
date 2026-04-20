import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users';
import {
  InvalidPasswordResetTokenError,
  PasswordResetTokenPolicy,
} from './domain';
import {
  PASSWORD_RESET_NOTIFIER,
  PASSWORD_RESET_TOKENS_REPOSITORY,
  PasswordResetNotifier,
  PasswordResetTokensRepositoryPort,
} from './ports';

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(PASSWORD_RESET_TOKENS_REPOSITORY)
    private readonly resetTokensRepo: PasswordResetTokensRepositoryPort,
    private readonly usersService: UsersService,
    @Inject(PASSWORD_RESET_NOTIFIER)
    private readonly emailService: PasswordResetNotifier,
    private readonly tokenPolicy: PasswordResetTokenPolicy,
  ) {}

  /**
   * Initiates password reset. Always returns success to prevent email enumeration.
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Don't reveal whether the email exists

    // Invalidate previous tokens
    await this.resetTokensRepo.invalidateAllForUser(user.id);

    const issuedToken = this.tokenPolicy.issue();

    await this.resetTokensRepo.create({
      tokenHash: issuedToken.tokenHash,
      userId: user.id,
      expiresAt: issuedToken.expiresAt,
    });
    await this.emailService.sendPasswordReset(user.email, issuedToken.plainToken);
  }

  async resetPassword(plainToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.tokenPolicy.hash(plainToken);
    const stored = await this.resetTokensRepo.findByTokenHash(tokenHash);

    if (!stored) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    try {
      this.tokenPolicy.ensureUsable(stored);
    } catch (error) {
      if (error instanceof InvalidPasswordResetTokenError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    await this.resetTokensRepo.markUsed(stored.id);
    await this.usersService.updatePassword(stored.userId, newPassword);
  }
}
