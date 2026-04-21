import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Global rate-limiting guard applied to every route by default.
 * Routes that handle high-frequency legitimate traffic or are already
 * protected by JWT authentication should opt out explicitly with @SkipThrottle().
 */
@Injectable()
export class ThrottleAuthGuard extends ThrottlerGuard {}
