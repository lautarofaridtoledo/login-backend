import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  passwordReset: {
    secret: process.env.PASSWORD_RESET_SECRET ?? '',
    expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN ?? '1h',
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN ?? 'localhost',
    secure: process.env.COOKIE_SECURE === 'true',
    name: 'refresh_token',
    path: '/auth',
    sameSite: 'lax' as const,
  },
  throttle: {
    // THROTTLE_TTL is expected in seconds; stored here as milliseconds for ThrottlerModule
    ttlMs: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '10', 10),
  },
}));
