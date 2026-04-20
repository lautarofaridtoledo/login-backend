import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Guard específico para endpoints sensibles de autenticación (login, forgot-password).
 * Aplica el rate limit configurado en ThrottlerModule para mitigar fuerza bruta.
 */
@Injectable()
export class ThrottleAuthGuard extends ThrottlerGuard {}
