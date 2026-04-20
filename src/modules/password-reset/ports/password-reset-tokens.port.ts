import { PasswordResetToken } from '@prisma/client';

export const PASSWORD_RESET_TOKENS_REPOSITORY = Symbol('PASSWORD_RESET_TOKENS_REPOSITORY');

export interface PasswordResetTokensRepositoryPort {
  create(data: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUsed(id: string): Promise<void>;
  invalidateAllForUser(userId: string): Promise<void>;
}