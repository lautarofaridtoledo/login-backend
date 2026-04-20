import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Guard for sensitive auth endpoints (login, forgot-password).
 * Applies the rate limit configured in ThrottlerModule to mitigate brute-force attacks.
 */
@Injectable()
export class ThrottleAuthGuard extends ThrottlerGuard {}
