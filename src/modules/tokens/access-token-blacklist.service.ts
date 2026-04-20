import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/redis';

@Injectable()
export class AccessTokenBlacklistService {
  constructor(private readonly redisService: RedisService) {}

  async blacklist(jti: string, expiresAtUnix: number): Promise<void> {
    const ttlSeconds = expiresAtUnix - Math.floor(Date.now() / 1000);
    if (ttlSeconds <= 0) {
      return;
    }

    const key = this.buildBlacklistKey(jti);
    await this.redisService.setWithTtl(key, '1', ttlSeconds);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const key = this.buildBlacklistKey(jti);
    return this.redisService.exists(key);
  }

  private buildBlacklistKey(jti: string): string {
    return this.redisService.buildKey('blacklist', 'access-token', jti);
  }
}