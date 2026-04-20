import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { createClient, RedisClientOptions } from 'redis';
import redisConfig from '../config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: ReturnType<typeof createClient>;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly config: ConfigType<typeof redisConfig>,
  ) {
    const options: RedisClientOptions = {
      username: this.config.username || undefined,
      password: this.config.password || undefined,
      database: this.config.db,
    };

    options.socket = this.config.tls
      ? {
          host: this.config.host,
          port: this.config.port,
          tls: true,
        }
      : {
          host: this.config.host,
          port: this.config.port,
        };

    this.client = createClient(options);

    this.client.on('error', (error) => {
      this.logger.error(`Redis client error: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Redis connection error';
      throw new ServiceUnavailableException(`Redis is unavailable: ${message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async setWithTtl(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, value, { EX: ttlSeconds });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Redis write error';
      throw new ServiceUnavailableException(`Failed to write to Redis: ${message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Redis read error';
      throw new ServiceUnavailableException(`Failed to read from Redis: ${message}`);
    }
  }

  buildKey(...parts: string[]): string {
    return [this.config.keyPrefix, ...parts].join(':');
  }
}