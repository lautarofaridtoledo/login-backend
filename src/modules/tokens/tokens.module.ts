import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokensService } from './tokens.service';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';

@Module({
  imports: [JwtModule.register({})],
  providers: [TokensService, RefreshTokensRepository],
  exports: [TokensService],
})
export class TokensModule {}
