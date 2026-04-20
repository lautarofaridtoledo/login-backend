import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies';
import { UsersModule } from '../users';
import { TokensModule } from '../tokens';
import { PasswordResetModule } from '../password-reset';
import { ProvidersModule } from '../providers';
import { SecurityModule } from '../../common/security';
import { ThrottleAuthGuard } from '../../common/guards';

@Module({
  imports: [
    ThrottlerModule,
    UsersModule,
    TokensModule,
    PasswordResetModule,
    ProvidersModule,
    SecurityModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ThrottleAuthGuard],
})
export class AuthModule {}
