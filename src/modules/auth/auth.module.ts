import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies';
import { UsersModule } from '../users';
import { TokensModule } from '../tokens';
import { PasswordResetModule } from '../password-reset';
import { ProvidersModule } from '../providers';
import { SecurityModule } from '../../common/security';

@Module({
  imports: [
    UsersModule,
    TokensModule,
    PasswordResetModule,
    ProvidersModule,
    SecurityModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
