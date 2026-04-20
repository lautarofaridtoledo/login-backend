import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenBlacklistService } from './access-token-blacklist.service';
import { TokensService } from './tokens.service';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { ConfigType } from '@nestjs/config';
import authConfig from '../../common/config/auth.config';
import { TokenLifecyclePolicy } from './domain';
import {
  ACCESS_TOKEN_BLACKLIST,
  REFRESH_TOKENS_REPOSITORY,
} from './ports';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    TokensService,
    RefreshTokensRepository,
    AccessTokenBlacklistService,
    {
      provide: REFRESH_TOKENS_REPOSITORY,
      useExisting: RefreshTokensRepository,
    },
    {
      provide: ACCESS_TOKEN_BLACKLIST,
      useExisting: AccessTokenBlacklistService,
    },
    {
      provide: TokenLifecyclePolicy,
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => {
        return new TokenLifecyclePolicy(
          config.jwt.accessExpiresIn,
          config.jwt.refreshExpiresIn,
        );
      },
    },
  ],
  exports: [TokensService, AccessTokenBlacklistService],
})
export class TokensModule {}
