export const ACCESS_TOKEN_BLACKLIST = Symbol('ACCESS_TOKEN_BLACKLIST');

export interface AccessTokenBlacklistPort {
  blacklist(jti: string, expiresAtUnix: number): Promise<void>;
  isBlacklisted(jti: string): Promise<boolean>;
}