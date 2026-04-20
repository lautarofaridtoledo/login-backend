import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  username: process.env.REDIS_USERNAME ?? '',
  password: process.env.REDIS_PASSWORD ?? '',
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
  tls: process.env.REDIS_TLS === 'true',
  keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'auth-service',
}));