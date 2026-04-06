import { AuthUser } from '../../../types';

export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');

export interface IAuthProvider {
  /**
   * Validate credentials and return the authenticated user.
   * Throws UnauthorizedException on failure.
   */
  authenticate(email: string, password: string): Promise<AuthUser>;
}
