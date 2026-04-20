import { RefreshToken } from '@prisma/client';

export const REFRESH_TOKENS_REPOSITORY = Symbol('REFRESH_TOKENS_REPOSITORY');

export interface RefreshTokensRepositoryPort {
  create(data: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}